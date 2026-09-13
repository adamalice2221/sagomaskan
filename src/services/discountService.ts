import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Discount,
  DiscountValidationResult,
  CartItem,
  InquiryItem,
  Product
} from '../types';
import { sanitizeForFirestore } from './db';

export const DISCOUNTS_COLLECTION = 'discounts';

/**
 * Normalizes discount codes (removes whitespace, transforms to uppercase).
 */
export function normalizeDiscountCode(code: string): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

/**
 * Pure calculation function that evaluates a discount against a list of cart or inquiry items.
 * Can be run safely on both client and server side.
 */
export function calculateDiscount(
  discount: Discount,
  items: Array<CartItem | InquiryItem>,
  now: Date = new Date()
): DiscountValidationResult {
  // Normalize items to a uniform format
  const normalizedItems = items.map((item) => {
    const isCartItem = 'product' in item;
    const productId = isCartItem ? (item as CartItem).product.id : (item as InquiryItem).productId;
    const price = isCartItem ? (item as CartItem).product.price : (item as InquiryItem).priceAtTimeOfInquiry;
    const quantity = item.quantity || 1;
    const categoryId = isCartItem ? (item as CartItem).product.categoryId : undefined;
    const category = isCartItem ? (item as CartItem).product.category : undefined;
    return {
      productId,
      price: Number(price) || 0,
      quantity: Number(quantity) || 1,
      categoryId,
      category
    };
  });

  const subtotalBeforeDiscount = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 1. Check if discount is active
  if (!discount.active) {
    return {
      valid: false,
      discount,
      discountAmount: 0,
      eligibleSubtotal: 0,
      subtotalBeforeDiscount,
      totalAfterDiscount: subtotalBeforeDiscount,
      errorMessage: 'Inaktiv rabattkod'
    };
  }

  // 2. Check validFrom
  if (discount.validFrom) {
    const fromDate = new Date(discount.validFrom);
    // Set to start of day in local time
    fromDate.setHours(0, 0, 0, 0);
    if (now < fromDate) {
      return {
        valid: false,
        discount,
        discountAmount: 0,
        eligibleSubtotal: 0,
        subtotalBeforeDiscount,
        totalAfterDiscount: subtotalBeforeDiscount,
        errorMessage: 'Rabattkoden har ännu inte börjat gälla'
      };
    }
  }

  // 3. Check validUntil
  if (discount.validUntil) {
    const untilDate = new Date(discount.validUntil);
    // Set to end of day in local time
    untilDate.setHours(23, 59, 59, 999);
    if (now > untilDate) {
      return {
        valid: false,
        discount,
        discountAmount: 0,
        eligibleSubtotal: 0,
        subtotalBeforeDiscount,
        totalAfterDiscount: subtotalBeforeDiscount,
        errorMessage: 'Rabattkoden har gått ut'
      };
    }
  }

  // 4. Check maxUses vs usedCount
  if (
    discount.maxUses !== undefined &&
    discount.maxUses !== null &&
    discount.maxUses > 0 &&
    (discount.usedCount || 0) >= discount.maxUses
  ) {
    return {
      valid: false,
      discount,
      discountAmount: 0,
      eligibleSubtotal: 0,
      subtotalBeforeDiscount,
      totalAfterDiscount: subtotalBeforeDiscount,
      errorMessage: 'Rabattkoden har nått sitt maximala antal användningar'
    };
  }

  // 5. Check minimumOrderAmount
  if (
    discount.minimumOrderAmount !== undefined &&
    discount.minimumOrderAmount !== null &&
    discount.minimumOrderAmount > 0 &&
    subtotalBeforeDiscount < discount.minimumOrderAmount
  ) {
    return {
      valid: false,
      discount,
      discountAmount: 0,
      eligibleSubtotal: 0,
      subtotalBeforeDiscount,
      totalAfterDiscount: subtotalBeforeDiscount,
      errorMessage: `Rabattkoden gäller från ${discount.minimumOrderAmount} kr.`
    };
  }

  // 6. Calculate eligible subtotal based on appliesTo
  let eligibleSubtotal = 0;
  if (discount.appliesTo === 'all') {
    eligibleSubtotal = subtotalBeforeDiscount;
  } else if (discount.appliesTo === 'products') {
    const allowedIds = new Set(discount.productIds || []);
    eligibleSubtotal = normalizedItems
      .filter((item) => allowedIds.has(item.productId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  } else if (discount.appliesTo === 'categories') {
    const allowedCatIds = new Set(discount.categoryIds || []);
    eligibleSubtotal = normalizedItems
      .filter((item) => (item.categoryId && allowedCatIds.has(item.categoryId)) || (item.category && allowedCatIds.has(item.category)))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // If no items are eligible
  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      discount,
      discountAmount: 0,
      eligibleSubtotal: 0,
      subtotalBeforeDiscount,
      totalAfterDiscount: subtotalBeforeDiscount,
      errorMessage: 'Rabattkoden gäller inte för produkterna i förfrågelistan'
    };
  }

  // 7. Calculate exact discount amount
  let discountAmount = 0;
  if (discount.discountType === 'percentage') {
    const pct = Math.max(0, Math.min(100, discount.discountValue));
    discountAmount = Math.round(eligibleSubtotal * (pct / 100) * 100) / 100;
  } else if (discount.discountType === 'fixed') {
    discountAmount = Math.min(discount.discountValue, eligibleSubtotal);
  }

  // Double check: discount cannot exceed eligible subtotal or overall subtotal
  discountAmount = Math.min(discountAmount, eligibleSubtotal, subtotalBeforeDiscount);
  // Round to 2 decimals
  discountAmount = Math.round(discountAmount * 100) / 100;

  const totalAfterDiscount = Math.max(0, Math.round((subtotalBeforeDiscount - discountAmount) * 100) / 100);

  return {
    valid: true,
    discount,
    discountAmount,
    eligibleSubtotal,
    subtotalBeforeDiscount,
    totalAfterDiscount
  };
}

// ----------------------------------------------------------------------------
// FIRESTORE OPERATIONS
// ----------------------------------------------------------------------------

export function subscribeDiscounts(callback: (discounts: Discount[]) => void): () => void {
  const collectionRef = collection(db, DISCOUNTS_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: Discount[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Discount),
          id: docSnap.id
        });
      });
      // Sort newest created first
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(items);
    },
    (error) => {
      console.error('Error fetching discounts from Firestore:', error);
      callback([]);
    }
  );
}

export async function getDiscountByCode(rawCode: string): Promise<Discount | null> {
  const code = normalizeDiscountCode(rawCode);
  if (!code) return null;

  try {
    const q = query(collection(db, DISCOUNTS_COLLECTION), where('code', '==', code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return {
        ...(docSnap.data() as Discount),
        id: docSnap.id
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${DISCOUNTS_COLLECTION}?code=${code}`);
    return null;
  }
}

export async function getDiscountById(id: string): Promise<Discount | null> {
  try {
    const docRef = doc(db, DISCOUNTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        ...(snap.data() as Discount),
        id: snap.id
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${DISCOUNTS_COLLECTION}/${id}`);
    return null;
  }
}

export async function createDiscount(
  discountData: Omit<Discount, 'id' | 'usedCount' | 'createdAt'>
): Promise<string> {
  const code = normalizeDiscountCode(discountData.code);
  if (!code) {
    throw new Error('Rabattkod kan inte vara tom.');
  }

  // Check if code already exists
  const existing = await getDiscountByCode(code);
  if (existing) {
    throw new Error(`En rabattkod med namnet "${code}" finns redan.`);
  }

  try {
    const docRef = doc(collection(db, DISCOUNTS_COLLECTION));
    const payload: Discount = {
      ...discountData,
      id: docRef.id,
      code,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sanitized = sanitizeForFirestore(payload);
    await setDoc(docRef, sanitized);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, DISCOUNTS_COLLECTION);
    throw error;
  }
}

export async function updateDiscount(
  id: string,
  updates: Partial<Omit<Discount, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, DISCOUNTS_COLLECTION, id);
    const rawUpdates: Partial<Discount> & { updatedAt: string } = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.code) {
      rawUpdates.code = normalizeDiscountCode(updates.code);
    }

    const sanitized = sanitizeForFirestore(rawUpdates);
    await updateDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${DISCOUNTS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deleteDiscount(id: string): Promise<void> {
  try {
    const docRef = doc(db, DISCOUNTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DISCOUNTS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function toggleDiscountActive(id: string, currentStatus: boolean): Promise<void> {
  return updateDiscount(id, { active: !currentStatus });
}

/**
 * Validates discount code from client input against live Firestore data and computes result.
 */
export async function validateDiscountCode(
  rawCode: string,
  items: CartItem[]
): Promise<DiscountValidationResult> {
  const code = normalizeDiscountCode(rawCode);
  if (!code) {
    return {
      valid: false,
      discountAmount: 0,
      eligibleSubtotal: 0,
      subtotalBeforeDiscount: 0,
      totalAfterDiscount: 0,
      errorMessage: 'Vänligen ange en rabattkod'
    };
  }

  const discount = await getDiscountByCode(code);
  if (!discount) {
    return {
      valid: false,
      discountAmount: 0,
      eligibleSubtotal: 0,
      subtotalBeforeDiscount: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      totalAfterDiscount: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      errorMessage: 'Ogiltig rabattkod'
    };
  }

  return calculateDiscount(discount, items);
}

/**
 * Safely increments the discount's usedCount in Firestore via transaction.
 * Called only when an inquiry is successfully created with a valid discount.
 */
export async function recordDiscountUsage(discountId: string): Promise<void> {
  try {
    const docRef = doc(db, DISCOUNTS_COLLECTION, discountId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists()) {
        const currentCount = snap.data().usedCount || 0;
        transaction.update(docRef, {
          usedCount: currentCount + 1,
          updatedAt: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.error(`Failed to increment usedCount for discount ${discountId}:`, error);
  }
}
