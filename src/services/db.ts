import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, ProductStockStatus, Category, Inquiry, InquiryStatus, SiteSettings, Discount } from '../types';
import { ensureStorageCategoryImageUrl, normalizeHeroImageUrl } from './storage';
import {
  DISCOUNTS_COLLECTION,
  getDiscountByCode,
  calculateDiscount,
  normalizeDiscountCode
} from './discountService';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const INQUIRIES_COLLECTION = 'inquiries';
const SETTINGS_COLLECTION = 'siteSettings';

// Default initial settings
export const DEFAULT_SETTINGS: SiteSettings = {
  email: 'hello@sagomaskan.se',
  instagram: '@sagomaskan',
  heroTitle: 'Handgjorda virkade produkter med kärlek',
  heroSubtitle: 'Mjuka detaljer för både stora och små i nordisk, minimalistisk design.',
  heroImage: '',
  heroProductId: '',
  heroProductBadge: 'Unikt hantverk',
  aboutText: 'Sagomaskan är en liten svensk hantverksateljé som skapar personliga och tidlösa virkade produkter för hand med stor omsorg och glädje.',

  // Fas 2: Om hantverket
  aboutStoryParagraphs: [
    'Jag tycker om att skapa saker som känns personliga, mysiga och gjorda för att användas och uppskattas länge.',
    'Sagomaskan drivs som en personlig hobbyverksamhet. Här hittar du inga maskintillverkade produkter eller massupplagor. Från det första varvet till den sista fästa tråden görs allt för hand med virknål, garn och tålamod.',
    'Vissa produkter finns färdiga i ett fåtal exemplar, medan andra virkas efter att du har skickat in din förfrågan. Du är alltid välkommen att ställa frågor om färgval eller önskemål.'
  ],

  // Fas 2: Frakt & leverans
  shippingSections: [
    {
      title: 'Hur leveransen går till',
      content: 'Efter att du skickat in din beställningsförfrågan går jag igenom om produkten finns färdig eller om den behöver virkas efter dina önskemål. Jag återkommer till dig via e-post med information om beräknad tillverkningstid, aktuell fraktkostnad baserat på paketets storlek samt betalningsinformation. Varje paket packas varsamt så att dina handvirkade alster kommer fram hela, rena och fina.'
    }
  ],

  // Fas 2: Köpvillkor
  termsSections: [
    {
      title: '1. Om verksamheten',
      content: 'Sagomaskan drivs som en personlig hobbyverksamhet. Alla produkter virkas för hand med omsorg och glädje. Webbplatsen fungerar som en produktkatalog och ett verktyg för att skicka en beställningsförfrågan.'
    },
    {
      title: '2. Beställningsförfrågan & ingen betalning på webbplatsen',
      content: 'En beställningsförfrågan via formuläret innebär inte ett slutfört köp eller någon direkt betalning. Jag återkommer personligen via e-post med information om produkten, eventuell tillverkningstid, frakt och hur betalning sker.'
    },
    {
      title: '3. Tillverkning & unika egenskaper',
      content: 'Eftersom varje produkt är handvirkad har varje exemplar sin egen karaktär och personlighet. Vissa produkter finns färdiga i ateljén medan andra virkas efter din beställning.'
    },
    {
      title: '4. Personlig kontakt och frågor',
      content: 'Har du frågor kring en produkt, önskemål om färg eller annat är du alltid varmt välkommen att höra av dig. Vi har en öppen och personlig dialog kring varje förfrågan.'
    }
  ],

  // Fas 2: FAQ
  faqItems: [
    {
      id: 'forfragan-funkar',
      question: 'Hur fungerar en beställningsförfrågan?',
      answer: 'Eftersom Sagomaskan är en personlig hobbyverksamhet genomförs ingen automatisk betalning på webbplatsen. Du lägger de alster du är intresserad av i din förfrågelista och skickar dina uppgifter. Jag går igenom din förfrågan personligen och återkommer via e-post med information om beställningen, pris, eventuell frakt och betalning.',
      category: 'forfragan'
    },
    {
      id: 'nar-betalar-jag',
      question: 'När betalar jag?',
      answer: 'Ingen betalning sker på webbplatsen. När vi kommit överens om din beställning och jag bekräftat tillgänglighet eller tillverkningstid återkommer jag med information om pris, frakt och hur betalning sker.',
      category: 'betalning'
    },
    {
      id: 'leveranstid',
      question: 'Hur lång tid tar leveransen?',
      answer: 'Alster som finns färdiga i ateljén skickas snarast möjligt efter överenskommelse. För alster som virkas på beställning meddelar jag beräknad tillverkningstid direkt i mitt svarsmejl.',
      category: 'leverans'
    },
    {
      id: 'handgjorda',
      question: 'Är alla produkter handgjorda?',
      answer: 'Ja, varje produkt är virkad för hand med omsorg och glädje. Eftersom det är ett genuint hantverk har varje exemplar sin unika karaktär och personliga känsla.',
      category: 'produkter'
    },
    {
      id: 'annan-farg',
      question: 'Kan jag önska en annan färg eller storlek?',
      answer: 'Ja, skriv gärna dina önskemål i meddelandefältet när du skickar din beställningsförfrågan. Jag går igenom mina garner och återkommer om möjligheterna.',
      category: 'produkter'
    },
    {
      id: 'skotsel',
      question: 'Hur sköter jag om de virkade alstren?',
      answer: 'För mössor, pannband, halsdukar och strumpor i ull/alpacka/merino rekommenderas varsam handtvätt i ljummet vatten med ulltvättmedel och plantorkning. Skallror och bitringar i bomullstrikå kan torkas av med fuktig trasa och lufttorkas.',
      category: 'skotsel'
    }
  ],

  // Fas 3: Announcement bar & Populära söktermer
  announcementText: 'Handgjorda virkade produkter på beställning • Skicka en kostnadsfri beställningsförfrågan',
  announcementEnabled: true,
  popularSearchTerms: [
    'Mössor',
    'Pannband',
    'Halsdukar',
    'Strumpor',
    'Skallror',
    'Bitringar',
    'Merinoull',
    'Baby'
  ],

  // Footer - Varumärke
  footerBrandName: 'SAGOMASKAN',
  footerTagline: 'VIRKADE PRODUKTER',
  footerDescription: 'Handgjorda virkade produkter, skapade med omsorg och glädje.',

  // Footer - Sidor
  footerPageLinks: [
    { label: 'Hem', href: 'home', enabled: true },
    { label: 'Shop', href: 'shop', enabled: true },
    { label: 'Om mig', href: 'about', enabled: true },
    { label: 'Kontakt', href: 'contact', enabled: true },
  ],

  // Footer - Information
  footerInfoLinks: [
    { label: 'Frakt & leverans', href: 'shipping', enabled: true },
    { label: 'Köpvillkor', href: 'terms', enabled: true },
    { label: 'FAQ', href: 'faq', enabled: true },
  ],

  // Footer - Kontakt & Följ
  footerInstagramLabel: 'Instagram',
  footerInstagramUrl: 'https://instagram.com/sagomaskan',
  footerInstagramEnabled: true,
  footerEmailLabel: 'E-post',
  footerEmail: 'hello@sagomaskan.se',
  footerContactLabel: 'Kontakt',
  footerContactUrl: 'contact',
  footerContactEnabled: true,

  // Footer - Nedre Footer
  footerCopyright: '© Sagomaskan. Alla rättigheter reserverade.',
  footerSignature: 'Små maskor – stora leenden. ♡',
  footerShowAdminLink: false,
};

/**
 * Robust sanitizer that removes undefined values recursively from objects/arrays
 * before sending to Firestore, keeping valid false, 0, empty strings, and arrays.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value === undefined) continue;
      if (value !== null && typeof value === 'object') {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
    return clean as T;
  }
  return data;
}

/**
 * ENSURE SITE SETTINGS EXIST IN FIRESTORE
 * (No hardcoded demo products or categories are re-seeded)
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, 'general');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn('Initial settings check skipped or limited:', error);
  }
}

// ----------------------------------------------------------------------------
// PRODUCTS
// ----------------------------------------------------------------------------

export function subscribeProducts(
  callback: (products: Product[]) => void,
  includeUnpublished = false
): () => void {
  const collectionRef = collection(db, PRODUCTS_COLLECTION);
  const q = includeUnpublished
    ? query(collectionRef)
    : query(collectionRef, where('published', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        const stockQuantity = typeof data.stockQuantity === 'number' && !isNaN(data.stockQuantity)
          ? Math.max(0, Math.floor(data.stockQuantity))
          : 0;
        const computedStockStatus: ProductStockStatus = stockQuantity > 0 ? 'I lager' : 'Slut i lager';
        items.push({
          ...data,
          stockQuantity,
          stockStatus: data.stockStatus || computedStockStatus,
          id: docSnap.id
        });
      });
      callback(items);
    },
    (error) => {
      console.error('Error fetching products from Firestore:', error);
      callback([]);
    }
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Product;
      const stockQuantity = typeof data.stockQuantity === 'number' && !isNaN(data.stockQuantity)
        ? Math.max(0, Math.floor(data.stockQuantity))
        : 0;
      const computedStockStatus: ProductStockStatus = stockQuantity > 0 ? 'I lager' : 'Slut i lager';
      return {
        ...data,
        stockQuantity,
        stockStatus: data.stockStatus || computedStockStatus,
        id: snap.id
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<string> {
  try {
    const id = product.id || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const stockQuantity = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
      ? Math.max(0, Math.floor(product.stockQuantity))
      : 0;
    const computedStockStatus: ProductStockStatus = stockQuantity > 0 ? 'I lager' : 'Slut i lager';

    const rawPayload = {
      ...product,
      stockQuantity,
      stockStatus: computedStockStatus,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const sanitizedPayload = sanitizeForFirestore(rawPayload);
    await setDoc(docRef, sanitizedPayload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const rawUpdates: Partial<Product> & { updatedAt: string } = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.stockQuantity !== undefined) {
      const stockQuantity = typeof updates.stockQuantity === 'number' && !isNaN(updates.stockQuantity)
        ? Math.max(0, Math.floor(updates.stockQuantity))
        : 0;
      rawUpdates.stockQuantity = stockQuantity;
      rawUpdates.stockStatus = stockQuantity > 0 ? 'I lager' : 'Slut i lager';
    }

    const sanitizedUpdates = sanitizeForFirestore(rawUpdates);
    await updateDoc(docRef, sanitizedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function duplicateProduct(id: string): Promise<string> {
  try {
    const original = await getProductById(id);
    if (!original) throw new Error('Produkten hittades inte.');

    const newId = `${original.id}-kopia-${Date.now().toString().slice(-4)}`;
    const stockQuantity = typeof original.stockQuantity === 'number' && !isNaN(original.stockQuantity)
      ? Math.max(0, Math.floor(original.stockQuantity))
      : 0;
    const computedStockStatus: ProductStockStatus = stockQuantity > 0 ? 'I lager' : 'Slut i lager';

    const duplicated: Product = {
      ...original,
      id: newId,
      name: `${original.name} (Kopia)`,
      published: false, // Default to unpublished
      stockQuantity,
      stockStatus: computedStockStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = doc(db, PRODUCTS_COLLECTION, newId);
    await setDoc(docRef, sanitizeForFirestore(duplicated));
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
}

// ----------------------------------------------------------------------------
// CATEGORIES
// ----------------------------------------------------------------------------

export function subscribeCategories(callback: (categories: Category[]) => void): () => void {
  const collectionRef = collection(db, CATEGORIES_COLLECTION);

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Category),
          id: docSnap.id
        });
      });
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      callback(items);
    },
    (error) => {
      console.error('Error fetching categories from Firestore:', error);
      callback([]);
    }
  );
}

export async function createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<string> {
  try {
    const rawId = category.id || category.name.trim().replace(/\//g, '-') || `cat-${Date.now()}`;
    const id = rawId.trim();
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    
    // Ensure image is a lightweight Storage URL, never a heavy base64 string
    const safeImage = await ensureStorageCategoryImageUrl(category.image || '', category.name);

    const rawPayload = {
      ...category,
      id,
      image: safeImage,
      isActive: category.isActive !== undefined ? category.isActive : true,
      sortOrder: category.sortOrder !== undefined ? Number(category.sortOrder) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, sanitizeForFirestore(rawPayload));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CATEGORIES_COLLECTION);
    throw error;
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    
    const safeUpdates: Partial<Category> = { ...updates };
    if (updates.image && updates.image.startsWith('data:image')) {
      safeUpdates.image = await ensureStorageCategoryImageUrl(updates.image, updates.name);
    }

    const rawUpdates = {
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, sanitizeForFirestore(rawUpdates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CATEGORIES_COLLECTION}/${id}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    // Check if any products use this category
    const prodsSnap = await getDocs(
      query(collection(db, PRODUCTS_COLLECTION), where('categoryId', '==', id))
    );
    if (!prodsSnap.empty) {
      throw new Error(`Kategorin kan inte raderas eftersom den innehåller ${prodsSnap.size} produkt(er). Flytta eller ta bort produkterna först.`);
    }

    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CATEGORIES_COLLECTION}/${id}`);
  }
}

// ----------------------------------------------------------------------------
// INQUIRIES
// ----------------------------------------------------------------------------

export function subscribeInquiries(callback: (inquiries: Inquiry[]) => void): () => void {
  const collectionRef = collection(db, INQUIRIES_COLLECTION);

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: Inquiry[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Inquiry),
          id: docSnap.id
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(items);
    },
    (error) => {
      console.error('Error fetching inquiries (admin only):', error);
      callback([]);
    }
  );
}

export async function createInquiry(
  inquiryData: Omit<Inquiry, 'id' | 'inquiryNumber' | 'createdAt' | 'status'> & { inquiryNumber?: string }
): Promise<string> {
  try {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const inquiryNumber = `#${randomNum}`;
    const newDocRef = doc(collection(db, INQUIRIES_COLLECTION));
    
    let finalPayload: Inquiry = {
      ...inquiryData,
      id: newDocRef.id,
      inquiryNumber,
      status: 'Ny',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: ''
    };

    // If a discount code was provided, execute atomic transaction: validate live discount,
    // verify active & valid dates & usage limit, compute discount snapshot, increment usedCount,
    // and create the inquiry document in a single atomic commit.
    if (inquiryData.discountCode) {
      const normalizedCode = normalizeDiscountCode(inquiryData.discountCode);
      if (!normalizedCode) {
        throw new Error('Ogiltig rabattkod.');
      }

      // Query to find the specific discount doc ID
      const q = query(
        collection(db, DISCOUNTS_COLLECTION),
        where('code', '==', normalizedCode)
      );
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        throw new Error('Rabattkoden hittades inte.');
      }

      const discountDocRef = doc(db, DISCOUNTS_COLLECTION, querySnap.docs[0].id);

      await runTransaction(db, async (transaction) => {
        const discountSnap = await transaction.get(discountDocRef);
        if (!discountSnap.exists()) {
          throw new Error('Rabattkoden existerar inte längre.');
        }

        const liveDiscount = {
          ...(discountSnap.data() as Discount),
          id: discountSnap.id
        };

        // 1. Check active status
        if (!liveDiscount.active) {
          throw new Error('Rabattkoden är inte längre aktiv.');
        }

        // 2. Check date limits (validFrom / validUntil)
        const now = new Date();
        if (liveDiscount.validFrom) {
          const fromDate = new Date(liveDiscount.validFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (now < fromDate) {
            throw new Error('Rabattkoden har inte börjat gälla ännu.');
          }
        }
        if (liveDiscount.validUntil) {
          const untilDate = new Date(liveDiscount.validUntil);
          untilDate.setHours(23, 59, 59, 999);
          if (now > untilDate) {
            throw new Error('Rabattkoden har löpt ut.');
          }
        }

        // 3. Check usage limit against live usedCount in transaction
        const currentCount = Number(liveDiscount.usedCount || 0);
        const limit = liveDiscount.usageLimit ?? liveDiscount.maxUses;
        if (
          limit !== undefined &&
          limit !== null &&
          limit > 0 &&
          currentCount >= limit
        ) {
          throw new Error('Rabattkoden har nått sin maximala användningsgräns.');
        }

        // 4. Calculate discount validation against cart items
        const validation = calculateDiscount(liveDiscount, inquiryData.items);
        if (!validation.valid) {
          throw new Error(validation.errorMessage || 'Rabattkoden uppfyller inte villkoren.');
        }

        // 5. Store snapshot in inquiry
        finalPayload = {
          ...finalPayload,
          discountCode: liveDiscount.code,
          discountType: liveDiscount.discountType,
          discountValue: liveDiscount.discountValue,
          discountAmount: validation.discountAmount,
          subtotalBeforeDiscount: validation.subtotalBeforeDiscount,
          totalAfterDiscount: validation.totalAfterDiscount,
          estimatedTotal: validation.totalAfterDiscount
        };

        // 6. Atomically update discount's usedCount and create inquiry
        const sanitizedPayload = sanitizeForFirestore(finalPayload);
        transaction.set(newDocRef, sanitizedPayload);
        transaction.update(discountDocRef, {
          usedCount: currentCount + 1,
          updatedAt: new Date().toISOString()
        });
      });
    } else {
      // Standard inquiry without discount
      const sanitizedPayload = sanitizeForFirestore(finalPayload);
      await setDoc(newDocRef, sanitizedPayload);
    }

    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, INQUIRIES_COLLECTION);
    throw error;
  }
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
  adminNotes?: string
): Promise<void> {
  try {
    const docRef = doc(db, INQUIRIES_COLLECTION, id);
    const updates: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${INQUIRIES_COLLECTION}/${id}`);
  }
}

// ----------------------------------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------------------------------

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SiteSettings;
      if (data.heroImage) {
        data.heroImage = normalizeHeroImageUrl(data.heroImage);
      }
      return { ...DEFAULT_SETTINGS, ...data };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, 'general');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as SiteSettings;
      if (data.heroImage) {
        data.heroImage = normalizeHeroImageUrl(data.heroImage);
      }
      callback({ ...DEFAULT_SETTINGS, ...data });
    } else {
      callback(DEFAULT_SETTINGS);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/general`);
    callback({ ...DEFAULT_SETTINGS });
  });
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'general');
    const settingsCopy = { ...settings };
    if (settingsCopy.heroImage !== undefined) {
      settingsCopy.heroImage = normalizeHeroImageUrl(settingsCopy.heroImage);
    }
    const rawData = { ...settingsCopy, updatedAt: new Date().toISOString() };
    await setDoc(docRef, sanitizeForFirestore(rawData), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/general`);
  }
}
