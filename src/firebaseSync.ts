import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initiera Firebase, Firestore, Storage och Auth
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth(app);

export const ADMIN_EMAIL = 'sagomaskan@outlook.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function normalizeCloudOrder(raw: any) {
  if (!raw || typeof raw !== 'object') return raw;
  const statusMap: Record<string, string> = {
    Mottagen: 'new',
    Packas: 'processing',
    Skickad: 'shipped',
    Avbruten: 'cancelled'
  };
  const rawStatus = String(raw.status || 'new');
  const normalizedStatus = statusMap[rawStatus] || rawStatus;

  const existingCust = raw.customer && typeof raw.customer === 'object' ? raw.customer : {};
  const customer = {
    name: String(existingCust.name || raw.customerName || '').trim(),
    email: String(existingCust.email || raw.customerEmail || '').trim(),
    phone: String(existingCust.phone || raw.customerPhone || '').trim(),
    address: String(existingCust.address || raw.shippingAddress || '').trim(),
    rawAddress: String(existingCust.rawAddress || '').trim(),
    zip: String(existingCust.zip || '').trim(),
    city: String(existingCust.city || '').trim(),
    message: String(existingCust.message || raw.customerMessage || '').trim()
  };

  const totalPrice = Number(raw.totalPrice !== undefined ? raw.totalPrice : raw.totalAmount) || 0;
  return {
    ...raw,
    status: normalizedStatus,
    customer,
    customerName: customer.name || 'Kund',
    customerEmail: customer.email || 'kund@exempel.se',
    customerPhone: customer.phone,
    shippingAddress: customer.address,
    totalPrice,
    totalAmount: totalPrice
  };
}

// Testa anslutningen till Firestore enligt säkerhetsriktlinjerna
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ Sagomaskan Firebase Firestore ansluten till databas:', firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Kunde inte nå Firebase Firestore, kontrollera nätverket.');
    } else {
      console.log('Firebase-anslutning kontrollerad.');
    }
  }
}
testConnection();

// Exponera synkroniseringsmetoder globalt för index.html
declare global {
  interface Window {
    SagomaskanFirebase?: {
      db: typeof db;
      storage: typeof storage;
      auth: typeof auth;
      ADMIN_EMAIL: string;
      uploadProductImage: (file: File | Blob, originalName?: string) => Promise<string>;
      uploadBannerMedia: (file: File | Blob, originalName?: string) => Promise<string>;
      deleteProductImageFromStorage: (imageUrlOrPath: string) => Promise<void>;
      saveProduct: (product: any) => Promise<void>;
      updateProductStock: (productId: string, newStock: number) => Promise<void>;
      deleteProduct: (productId: string, imageUrls?: string[]) => Promise<void>;
      saveCategories: (categories: any[]) => Promise<void>;
      saveOrder: (order: any) => Promise<void>;
      updateOrderStatus: (orderId: string, status: string, trackingUrl?: string, extraFields?: Record<string, any>) => Promise<void>;
      syncCustomerOrdersFromCloud: (localOrders: any[]) => Promise<any[]>;
      deleteOrder: (orderId: string) => Promise<void>;
      saveMessage: (message: any) => Promise<void>;
      updateMessageStatus: (messageId: string, status: string) => Promise<void>;
      deleteMessage: (messageId: string) => Promise<void>;
      saveDiscount: (discount: any) => Promise<void>;
      deleteDiscount: (discountCode: string) => Promise<void>;
      saveStoreSettings: (settings: any) => Promise<void>;
      getGiftBoxPrices: () => Promise<any>;
      saveGiftBoxPrices: (settings: any) => Promise<void>;
      signInAdminWithGoogle: () => Promise<User>;
      signInAdminWithEmail: (email: string, pass: string) => Promise<User>;
      signOutAdmin: () => Promise<void>;
      isCurrentUserAdmin: () => boolean;
      onAdminAuthStateChanged: (cb: (isAdmin: boolean, user: User | null) => void) => () => void;
      isReady: boolean;
    };
  }
}

// Skapa Firebase-hjälpare
const SagomaskanFirebase = {
  db,
  storage,
  auth,
  ADMIN_EMAIL,
  isReady: true,

  isCurrentUserAdmin(): boolean {
    const cur = auth.currentUser;
    return Boolean(cur && cur.email && cur.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  },

  async signInAdminWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await signOut(auth);
      throw new Error(`Åtkomst nekad. Endast ${ADMIN_EMAIL} har administratörsbehörighet. Inloggad som: ${user.email || 'okänd adress'}.`);
    }
    console.log('✅ Admin inloggad via Google:', user.email);
    return user;
  },

  async signInAdminWithEmail(email: string, pass: string): Promise<User> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`Endast ${ADMIN_EMAIL} är godkänd för admininloggning.`);
    }
    const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = result.user;
    if (!user.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await signOut(auth);
      throw new Error(`Åtkomst nekad. Endast ${ADMIN_EMAIL} har administratörsbehörighet.`);
    }
    console.log('✅ Admin inloggad med e-post:', user.email);
    return user;
  },

  async signOutAdmin(): Promise<void> {
    await signOut(auth);
    console.log('Admin utloggad');
  },

  onAdminAuthStateChanged(callback: (isAdmin: boolean, user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      const isAdm = Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      callback(isAdm, user);
    });
  },

  async uploadProductImage(file: File | Blob, originalName?: string): Promise<string> {
    const ext = originalName
      ? originalName.split('.').pop()
      : (file instanceof File && file.name ? file.name.split('.').pop() : 'jpg');
    const cleanExt = (ext || 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    const filename = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
    const fileRef = ref(storage, filename);
    console.log('Laddar upp bild till Firebase Storage:', filename);
    const contentType = file.type || (cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg');
    const snapshot = await uploadBytes(fileRef, file, { contentType });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('✅ Bild sparad i Firebase Storage:', downloadUrl);
    return downloadUrl;
  },

  async uploadBannerMedia(file: File | Blob, originalName?: string): Promise<string> {
    const isVideo = (file instanceof File && file.type ? file.type.startsWith('video/') : false) ||
      Boolean(originalName && /\.(mp4|webm|mov|ogg|m4v)$/i.test(originalName));
    const defaultExt = isVideo ? 'mp4' : 'jpg';
    const ext = originalName
      ? originalName.split('.').pop()
      : (file instanceof File && file.name ? file.name.split('.').pop() : defaultExt);
    const cleanExt = (ext || defaultExt).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || defaultExt;
    const folder = isVideo ? 'banners/videos' : 'banners/images';
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
    const fileRef = ref(storage, filename);
    console.log('Laddar upp bannermedia till Firebase Storage:', filename);
    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      ogg: 'video/ogg',
      m4v: 'video/mp4',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp'
    };
    const contentType = file.type || mimeMap[cleanExt] || (isVideo ? 'video/mp4' : 'image/jpeg');
    const snapshot = await uploadBytes(fileRef, file, { contentType });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('✅ Bannermedia sparad i Firebase Storage:', downloadUrl);
    return downloadUrl;
  },

  async saveProduct(product: any) {
    if (!product || !product.id) return;
    if (!SagomaskanFirebase.isCurrentUserAdmin()) return;
    const path = `products/${product.id}`;
    try {
      const parsedPrice = parseFloat(String(product.price ?? '0').replace(/\s+/g, '').replace(',', '.'));
      const numericPrice = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
      const cleanProd = {
        id: String(product.id),
        name: String(product.name || '').substring(0, 150),
        price: numericPrice,
        categoryIndex: Number(product.categoryIndex) || 0,
        description: String(product.description || '').substring(0, 2000),
        stock: Math.max(0, Number(product.stock !== undefined ? product.stock : 1) || 0),
        images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
        image: String(product.image || product.images?.[0] || ''),
        featured: Boolean(product.featured),
        isDigitalPdf: Boolean(product.isDigitalPdf),
        pdfUrl: String(product.pdfUrl || ''),
        pdfDisplayPath: String(product.pdfDisplayPath || ''),
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'products', String(product.id)), cleanProd);
      console.log('Produkt sparad i Firestore:', product.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async updateProductStock(productId: string, newStock: number) {
    if (!productId) return;
    const path = `products/${productId}`;
    try {
      const safeStock = Math.max(0, parseInt(String(newStock), 10) || 0);
      await setDoc(doc(db, 'products', String(productId)), {
        stock: safeStock,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Lagersaldo uppdaterat i Firestore:', productId, safeStock);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteProductImageFromStorage(imageUrlOrPath: string): Promise<void> {
    if (!imageUrlOrPath || typeof imageUrlOrPath !== 'string') return;
    const cleanUrl = imageUrlOrPath.trim();
    if (!cleanUrl || cleanUrl.startsWith('data:')) return;
    if (!cleanUrl.includes('firebasestorage.googleapis.com') && !cleanUrl.startsWith('products/')) return;
    try {
      const fileRef = ref(storage, cleanUrl);
      await deleteObject(fileRef);
      console.log('✅ Bild borttagen från Firebase Storage:', cleanUrl);
    } catch (err: any) {
      if (err?.code === 'storage/object-not-found') {
        console.log('Bild fanns inte längre i Firebase Storage:', cleanUrl);
      } else {
        console.warn('Varning vid radering av bild ur Firebase Storage:', err);
      }
    }
  },

  async deleteProduct(productId: string, imageUrls?: string[]) {
    if (!productId) return;
    const path = `products/${productId}`;
    try {
      // 1. Samla in alla bild-URL:er för produkten
      let urlsToDelete: string[] = Array.isArray(imageUrls) ? [...imageUrls] : [];
      try {
        const snap = await getDocFromServer(doc(db, 'products', String(productId)));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.images)) {
            urlsToDelete.push(...data.images);
          }
          if (data.image) {
            urlsToDelete.push(data.image);
          }
        }
      } catch (_) {}

      // 2. Radera bilder ur Firebase Storage
      const uniqueUrls = Array.from(new Set(urlsToDelete.filter(Boolean)));
      for (const imgUrl of uniqueUrls) {
        await SagomaskanFirebase.deleteProductImageFromStorage(imgUrl);
      }

      // 3. Radera produktdokumentet ur Firestore
      await deleteDoc(doc(db, 'products', String(productId)));
      console.log('✅ Produkt och dess bilder borttagna ur Firebase:', productId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveCategories(categories: any[]) {
    if (!Array.isArray(categories)) return;
    try {
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        await setDoc(doc(db, 'categories', String(i)), {
          id: String(i),
          name: String(cat.name || `Kategori ${i + 1}`).substring(0, 80),
          image: String(cat.image || ''),
          order: i
        });
      }
      console.log('Kategorier sparade i Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    }
  },

  async saveOrder(order: any) {
    if (!order || !order.id) return;
    const path = `orders/${order.id}`;
    try {
      const custObj = order.customer && typeof order.customer === 'object' ? order.customer : {};
      const customerName = String(custObj.name || order.customerName || '').trim().substring(0, 120);
      const customerEmail = String(custObj.email || order.customerEmail || '').trim().substring(0, 160);
      const customerPhone = String(custObj.phone || order.customerPhone || '').trim().substring(0, 40);
      const shippingAddress = String(custObj.address || order.shippingAddress || '').trim().substring(0, 300);
      const customerMessage = String(custObj.message || order.customerMessage || '').trim().substring(0, 1000);
      const totalAmount = Number(order.totalAmount !== undefined ? order.totalAmount : order.totalPrice) || 0;
      const totalPrice = Number(order.totalPrice !== undefined ? order.totalPrice : order.totalAmount) || 0;
      const rawStatus = String(order.status || 'new');
      const statusMap: Record<string, string> = {
        Mottagen: 'new',
        Packas: 'processing',
        Skickad: 'shipped',
        Avbruten: 'cancelled'
      };
      const status = statusMap[rawStatus] || rawStatus;

      const cleanOrder: any = {
        id: String(order.id),
        orderNumber: String(order.orderNumber || order.id),
        customerId: order.customerId ? String(order.customerId) : null,
        customerName: customerName || 'Kund',
        customerEmail: customerEmail || 'kund@exempel.se',
        customerPhone,
        shippingAddress,
        customerMessage,
        customer: {
          name: customerName || 'Kund',
          email: customerEmail || 'kund@exempel.se',
          phone: customerPhone,
          address: shippingAddress,
          rawAddress: String(custObj.rawAddress || '').trim().substring(0, 200),
          zip: String(custObj.zip || '').trim().substring(0, 20),
          city: String(custObj.city || '').trim().substring(0, 100),
          message: customerMessage
        },
        paymentMethod: String(order.paymentMethod || 'Swish').substring(0, 50),
        items: Array.isArray(order.items) ? order.items : [],
        totalQuantity: Number(order.totalQuantity) || 1,
        subtotalPrice: Number(order.subtotalPrice !== undefined ? order.subtotalPrice : totalPrice) || 0,
        shippingFee: Number(order.shippingFee) || 0,
        totalAmount,
        totalPrice,
        discountCode: order.discountCode ? String(order.discountCode).substring(0, 40) : null,
        discountType: order.discountType ? String(order.discountType) : null,
        discountValue: Number(order.discountValue) || 0,
        discountAmount: Number(order.discountAmount) || 0,
        giftBox: order.giftBox && typeof order.giftBox === 'object' ? {
          type: String(order.giftBox.type || 'none'),
          label: String(order.giftBox.label || ''),
          price: Number(order.giftBox.price) || 0,
          greeting: String(order.giftBox.greeting || '').substring(0, 500)
        } : null,
        hasDigitalItems: Boolean(order.hasDigitalItems),
        isDigitalOnly: Boolean(order.isDigitalOnly),
        status,
        statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
        trackingUrl: String(order.trackingUrl || ''),
        paymentVerified: Boolean(order.paymentVerified),
        paymentVerifiedAt: order.paymentVerifiedAt || null,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString()
      };
      await setDoc(doc(db, 'orders', String(order.id)), cleanOrder);
      console.log('Beställning sparad i Firestore:', order.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateOrderStatus(orderId: string, status: string, trackingUrl?: string, extraFields?: Record<string, any>) {
    if (!orderId) return;
    const path = `orders/${orderId}`;
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (trackingUrl !== undefined) {
        updateData.trackingUrl = String(trackingUrl);
      }
      if (extraFields && typeof extraFields === 'object') {
        Object.assign(updateData, extraFields);
      }
      await setDoc(doc(db, 'orders', String(orderId)), updateData, { merge: true });
      console.log('Orderstatus uppdaterad i Firestore:', orderId, status);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async syncCustomerOrdersFromCloud(localOrders: any[]): Promise<any[]> {
    if (!Array.isArray(localOrders) || localOrders.length === 0) return localOrders;
    try {
      const updated = await Promise.all(
        localOrders.map(async (ord) => {
          if (!ord || !ord.id) return ord;
          try {
            const snap = await getDoc(doc(db, 'orders', String(ord.id)));
            if (snap.exists()) {
              return normalizeCloudOrder({ ...ord, ...snap.data() });
            }
          } catch (_) {}
          return ord;
        })
      );
      return updated;
    } catch (_) {
      return localOrders;
    }
  },

  async deleteOrder(orderId: string) {
    if (!orderId) return;
    const path = `orders/${orderId}`;
    try {
      await deleteDoc(doc(db, 'orders', String(orderId)));
      console.log('Order borttagen ur Firestore:', orderId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveMessage(message: any) {
    if (!message || !message.id) return;
    const path = `messages/${message.id}`;
    try {
      const cleanMsg = {
        id: String(message.id),
        name: String(message.name || '').substring(0, 100),
        email: String(message.email || '').substring(0, 160),
        subject: String(message.subject || 'Kundfråga').substring(0, 120),
        orderNumber: String(message.orderNumber || '').substring(0, 60),
        message: String(message.message || '').substring(0, 3000),
        status: String(message.status || 'unread'),
        createdAt: message.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, 'messages', String(message.id)), cleanMsg);
      console.log('Meddelande sparat i Firestore:', message.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateMessageStatus(messageId: string, status: string) {
    if (!messageId) return;
    const path = `messages/${messageId}`;
    try {
      await setDoc(doc(db, 'messages', String(messageId)), { status }, { merge: true });
      console.log('Meddelandestatus uppdaterad i Firestore:', messageId, status);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteMessage(messageId: string) {
    if (!messageId) return;
    const path = `messages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'messages', String(messageId)));
      console.log('Meddelande borttaget ur Firestore:', messageId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveDiscount(discount: any) {
    if (!discount || !discount.code) return;
    const cleanCode = String(discount.code).trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '').substring(0, 50);
    if (!cleanCode) return;
    const path = `discounts/${cleanCode}`;
    try {
      const cleanDisc = {
        code: cleanCode,
        type: discount.type === 'fixed' ? 'fixed' : 'percent',
        value: Number(discount.value) || 0,
        active: discount.active !== false,
        note: String(discount.note || '').substring(0, 200),
        createdAt: discount.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, 'discounts', cleanCode), cleanDisc);
      console.log('Rabattkod sparad i Firestore:', cleanCode);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteDiscount(discountCode: string) {
    const cleanCode = String(discountCode || '').trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '').substring(0, 50);
    if (!cleanCode) return;
    const path = `discounts/${cleanCode}`;
    try {
      await deleteDoc(doc(db, 'discounts', cleanCode));
      console.log('Rabattkod borttagen ur Firestore:', cleanCode);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveStoreSettings(settings: any) {
    if (!settings || typeof settings !== 'object') return;
    const path = 'settings/storefront';
    try {
      await setDoc(doc(db, 'settings', 'storefront'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Butiksinställningar sparade i Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async getGiftBoxPrices() {
    const path = 'settings/giftBoxes';
    try {
      const snap = await getDoc(doc(db, 'settings', 'giftBoxes'));
      if (snap.exists()) {
        const data = snap.data();
        return {
          standardPrice: data.standardPrice !== undefined ? Number(data.standardPrice) : 49,
          luxuryPrice: data.luxuryPrice !== undefined ? Number(data.luxuryPrice) : 95,
          standardTitle: typeof data.standardTitle === 'string' ? data.standardTitle : 'Standard Presentask',
          standardDesc: typeof data.standardDesc === 'string' ? data.standardDesc : 'En vacker, miljömärkt presentask i naturfärgad kartong som ramar in ditt handvirkade alster med skandinavisk enkelhet.',
          standardFeatures: typeof data.standardFeatures === 'string' ? data.standardFeatures : 'Stadig presentask i oblekt skandinavisk papp\nInbäddad i mjukt, syrafritt silkespapper & bomullsband\nKort med din personliga hälsning ingår',
          luxuryTitle: typeof data.luxuryTitle === 'string' ? data.luxuryTitle : 'Lyxig Signaturask',
          luxuryDesc: typeof data.luxuryDesc === 'string' ? data.luxuryDesc : 'Vår mest exklusiva presentförpackning för dop, babyshower och livets stora stunder – skapad för att sparas som minneslåda i många år.',
          luxuryFeatures: typeof data.luxuryFeatures === 'string' ? data.luxuryFeatures : 'Klädd hårdpappask med magnetlås & präglad logotyp\nSidenband, linnepåse & skötselråd för handvirkade alster\nHandskrivet linnestrukturerat gåvokort i kuvert'
        };
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    return {
      standardPrice: 49,
      luxuryPrice: 95,
      standardTitle: 'Standard Presentask',
      standardDesc: 'En vacker, miljömärkt presentask i naturfärgad kartong som ramar in ditt handvirkade alster med skandinavisk enkelhet.',
      standardFeatures: 'Stadig presentask i oblekt skandinavisk papp\nInbäddad i mjukt, syrafritt silkespapper & bomullsband\nKort med din personliga hälsning ingår',
      luxuryTitle: 'Lyxig Signaturask',
      luxuryDesc: 'Vår mest exklusiva presentförpackning för dop, babyshower och livets stora stunder – skapad för att sparas som minneslåda i många år.',
      luxuryFeatures: 'Klädd hårdpappask med magnetlås & präglad logotyp\nSidenband, linnepåse & skötselråd för handvirkade alster\nHandskrivet linnestrukturerat gåvokort i kuvert'
    };
  },

  async saveGiftBoxPrices(settings: any) {
    if (!settings || typeof settings !== 'object') return;
    const path = 'settings/giftBoxes';
    try {
      const payload: any = {
        standardPrice: Number(settings.standardPrice) >= 0 ? Number(settings.standardPrice) : 49,
        luxuryPrice: Number(settings.luxuryPrice) >= 0 ? Number(settings.luxuryPrice) : 95,
        updatedAt: new Date().toISOString()
      };
      if (typeof settings.standardTitle === 'string') payload.standardTitle = settings.standardTitle.trim();
      if (typeof settings.standardDesc === 'string') payload.standardDesc = settings.standardDesc.trim();
      if (typeof settings.standardFeatures === 'string') payload.standardFeatures = settings.standardFeatures.trim();

      if (typeof settings.luxuryTitle === 'string') payload.luxuryTitle = settings.luxuryTitle.trim();
      if (typeof settings.luxuryDesc === 'string') payload.luxuryDesc = settings.luxuryDesc.trim();
      if (typeof settings.luxuryFeatures === 'string') payload.luxuryFeatures = settings.luxuryFeatures.trim();

      await setDoc(doc(db, 'settings', 'giftBoxes'), payload, { merge: true });
      console.log('Presentask-information sparad i Firestore (settings/giftBoxes)');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
};

window.SagomaskanFirebase = SagomaskanFirebase;

// Prenumerationshanterare för skyddade admin-lyssnare (Ordrar & Meddelanden)
let unsubscribeOrders: (() => void) | null = null;
let unsubscribeMessages: (() => void) | null = null;

function startAdminListeners() {
  const win = window as any;

  // 1. Synka Beställningar i realtid (endast för inloggad admin)
  if (!unsubscribeOrders) {
    try {
      unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const firestoreOrders: any[] = [];
        snapshot.forEach((d) => {
          firestoreOrders.push(normalizeCloudOrder(d.data()));
        });
        firestoreOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (win.applyCloudOrders && typeof win.applyCloudOrders === 'function') {
          win.applyCloudOrders(firestoreOrders);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      });
      console.log('✅ Admin order-lyssnare aktiverad');
    } catch (err) {
      console.warn('Fel vid inställning av orderlyssnare:', err);
    }
  }

  // 2. Synka Meddelanden i realtid (endast för inloggad admin)
  if (!unsubscribeMessages) {
    try {
      unsubscribeMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
        const firestoreMessages: any[] = [];
        snapshot.forEach((d) => {
          firestoreMessages.push(d.data());
        });
        firestoreMessages.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (win.applyCloudMessages && typeof win.applyCloudMessages === 'function') {
          win.applyCloudMessages(firestoreMessages);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'messages');
      });
      console.log('✅ Admin meddelande-lyssnare aktiverad');
    } catch (err) {
      console.warn('Fel vid meddelandelyssnare:', err);
    }
  }
}

function stopAdminListeners() {
  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
    console.log('Admin order-lyssnare stoppad');
  }
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
    console.log('Admin meddelande-lyssnare stoppad');
  }
}

// Starta publika lyssnare i realtid (Produkter & Kategorier för alla besökare)
function setupFirestoreListeners() {
  const win = window as any;

  // 1. Synka Produkter i realtid
  try {
    onSnapshot(collection(db, 'products'), (snapshot) => {
      const firestoreProducts: any[] = [];
      snapshot.forEach((d) => {
        firestoreProducts.push(d.data());
      });
      if (win.applyCloudProducts && typeof win.applyCloudProducts === 'function') {
        win.applyCloudProducts(firestoreProducts);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
  } catch (err) {
    console.warn('Fel vid inställning av produktlyssnare:', err);
  }

  // 2. Synka Kategorier i realtid
  try {
    onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (snapshot.empty) {
        if (SagomaskanFirebase.isCurrentUserAdmin() && win.currentCategories && Array.isArray(win.currentCategories)) {
          console.log('Seedar kategorier till Firestore...');
          SagomaskanFirebase.saveCategories(win.currentCategories);
        }
      } else {
        const firestoreCategories: any[] = [];
        snapshot.forEach((d) => {
          firestoreCategories.push(d.data());
        });
        firestoreCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
        if (win.applyCloudCategories && typeof win.applyCloudCategories === 'function') {
          win.applyCloudCategories(firestoreCategories);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });
  } catch (err) {
    console.warn('Fel vid inställning av kategorilyssnare:', err);
  }

  // 3. Synka Rabattkoder i realtid (för alla besökare och kunder)
  try {
    onSnapshot(collection(db, 'discounts'), (snapshot) => {
      const firestoreDiscounts: any[] = [];
      snapshot.forEach((d) => {
        firestoreDiscounts.push(d.data());
      });
      if (win.applyCloudDiscounts && typeof win.applyCloudDiscounts === 'function') {
        win.applyCloudDiscounts(firestoreDiscounts);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'discounts');
    });
  } catch (err) {
    console.warn('Fel vid inställning av rabattkodslyssnare:', err);
  }

  // 4. Synka Butiksinställningar (toppbanner, hero, infoskyltar) i realtid
  try {
    onSnapshot(doc(db, 'settings', 'storefront'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (win.applyCloudStoreSettings && typeof win.applyCloudStoreSettings === 'function') {
          win.applyCloudStoreSettings(data);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/storefront');
    });
  } catch (err) {
    console.warn('Fel vid inställning av butiksinställningslyssnare:', err);
  }

  // 4b. Synka Presentaskar (settings/giftBoxes) i realtid
  try {
    onSnapshot(doc(db, 'settings', 'giftBoxes'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (win.applyCloudGiftBoxes && typeof win.applyCloudGiftBoxes === 'function') {
          win.applyCloudGiftBoxes(data);
        }
      } else if (SagomaskanFirebase.isCurrentUserAdmin()) {
        SagomaskanFirebase.saveGiftBoxPrices({ standardPrice: 49, luxuryPrice: 95 });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/giftBoxes');
    });
  } catch (err) {
    console.warn('Fel vid inställning av presentask-lyssnare:', err);
  }

  // 5. Lyssna på Admin-autentisering (endast sagomaskan@outlook.com startar admin-lyssnare)
  try {
    onAuthStateChanged(auth, (user) => {
      const isAdm = Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      const emailDisplay = document.getElementById('adminCurrentEmailDisplay');
      if (emailDisplay) {
        emailDisplay.textContent = isAdm ? (user?.email || ADMIN_EMAIL) : ADMIN_EMAIL;
      }
      if (typeof win.setAdminUnlocked === 'function') {
        win.setAdminUnlocked(isAdm);
      }

      if (isAdm) {
        startAdminListeners();
      } else {
        stopAdminListeners();
      }
    });
  } catch (err) {
    console.warn('Fel vid auth-lyssnare:', err);
  }
}

// Kör igång lyssnarna när DOM är redo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFirestoreListeners);
} else {
  setupFirestoreListeners();
}
