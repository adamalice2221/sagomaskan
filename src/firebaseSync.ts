import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction
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
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updateProfile,
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

function mapFirebaseAuthError(err: any): Error {
  const code = String(err?.code || '');
  switch (code) {
    case 'auth/operation-not-allowed':
      return new Error(
        'E-post- och lösenordsinloggning är ännu inte aktiverad i Firebase Console (Authentication → Sign-in method → Email/Password).'
      );
    case 'auth/email-already-in-use':
      return new Error('Det finns redan ett konto registrerat med den här e-postadressen. Logga gärna in istället.');
    case 'auth/invalid-email':
      return new Error('Vänligen ange en giltig e-postadress.');
    case 'auth/weak-password':
      return new Error('Lösenordet måste innehålla minst 6 tecken.');
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return new Error('Felaktig e-postadress eller lösenord. Kontrollera uppgifterna eller skapa ett nytt konto.');
    case 'auth/too-many-requests':
      return new Error('För många försök. Vänta en stund och försök igen.');
    case 'auth/requires-recent-login':
      return new Error('Av säkerhetsskäl behöver du logga ut och logga in igen innan du kan byta lösenord.');
    case 'auth/network-request-failed':
      return new Error('Kunde inte nå Firebase just nu. Kontrollera din internetuppkoppling.');
    default:
      return err instanceof Error ? err : new Error(String(err || 'Autentiseringsfel'));
  }
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function makeNewsletterSubscriberId(email: string): string {
  const cleanEmail = String(email || '').trim().toLowerCase();
  return `sub_${fnv1aHex(cleanEmail)}`;
}

function sanitizeCartItems(rawCart: any): Array<{ productId: string; quantity: number }> {
  if (!Array.isArray(rawCart)) return [];
  const merged = new Map<string, number>();
  rawCart.forEach((item: any) => {
    if (!item || typeof item !== 'object') return;
    const pid = String(item.productId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 0)));
    if (pid && qty > 0) {
      merged.set(pid, Math.min(99, (merged.get(pid) || 0) + qty));
    }
  });
  return Array.from(merged.entries())
    .slice(0, 100)
    .map(([productId, quantity]) => ({ productId, quantity }));
}

function sanitizeGiftBoxSelection(rawSel: any): { type: 'none' | 'standard' | 'luxury'; greeting: string } {
  const rawType = String(rawSel?.type || 'none');
  const type: 'none' | 'standard' | 'luxury' =
    rawType === 'standard' || rawType === 'luxury' ? rawType : 'none';
  const greeting = typeof rawSel?.greeting === 'string' ? rawSel.greeting.substring(0, 500) : '';
  return { type, greeting };
}

function sanitizeWatchedProducts(rawList: any): string[] {
  if (!Array.isArray(rawList)) return [];
  return Array.from(
    new Set(
      rawList
        .map((id: any) => String(id || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128))
        .filter(Boolean)
    )
  ).slice(0, 200);
}

function buildCleanCustomerDoc(customerId: string, customer: any): Record<string, any> | null {
  const cleanId = String(customerId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
  if (!cleanId) return null;
  const cleanName = String(customer?.name || '').trim().substring(0, 120);
  const cleanEmail = String(customer?.email || '').trim().toLowerCase().substring(0, 160);
  if (cleanName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return null;

  const nowIso = new Date().toISOString();
  const rawFavs = Array.isArray(customer?.favorites)
    ? Array.from(new Set(customer.favorites.map((id: any) => String(id).substring(0, 128)).filter(Boolean))).slice(0, 200)
    : [];
  const rawActivity = Array.isArray(customer?.activityLog)
    ? customer.activityLog
        .filter((entry: any) => entry && typeof entry === 'object')
        .slice(0, 25)
        .map((entry: any) => ({
          label: String(entry.label || '').substring(0, 160),
          timestamp: String(entry.timestamp || nowIso).substring(0, 64)
        }))
    : [];

  const cleanDiscountCode = String(customer?.appliedDiscountCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_\-]/g, '')
    .substring(0, 50);

  const cleanCustomer: Record<string, any> = {
    id: cleanId,
    name: cleanName,
    email: cleanEmail,
    phone: String(customer?.phone || '').trim().substring(0, 40),
    address: String(customer?.address || '').trim().substring(0, 200),
    zip: String(customer?.zip || '').trim().substring(0, 20),
    city: String(customer?.city || '').trim().substring(0, 100),
    favorites: rawFavs,
    favoritesCount: rawFavs.length,
    newsletterSubscribed: Boolean(customer?.newsletterSubscribed),
    watchedProducts: sanitizeWatchedProducts(customer?.watchedProducts),
    cart: sanitizeCartItems(customer?.cart),
    giftBoxSelection: sanitizeGiftBoxSelection(customer?.giftBoxSelection),
    appliedDiscountCode: cleanDiscountCode,
    createdAt: String(customer?.createdAt || nowIso).substring(0, 64),
    lastLoginAt: String(customer?.lastLoginAt || customer?.updatedAt || nowIso).substring(0, 64),
    updatedAt: String(customer?.updatedAt || nowIso).substring(0, 64),
    activityLog: rawActivity
  };
  if (customer?.newsletterUpdatedAt) {
    cleanCustomer.newsletterUpdatedAt = String(customer.newsletterUpdatedAt).substring(0, 64);
  }
  if (customer?.previousLoginAt) {
    cleanCustomer.previousLoginAt = String(customer.previousLoginAt).substring(0, 64);
  }
  return cleanCustomer;
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
    customerEmail: (customer.email || 'kund@exempel.se').toLowerCase(),
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
      saveCustomer: (customer: any) => Promise<void>;
      deleteCustomer: (customerId: string) => Promise<void>;
      registerCustomer: (payload: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        address?: string;
        zip?: string;
        city?: string;
        favorites?: string[];
        watchedProducts?: string[];
        cart?: Array<{ productId: string; quantity: number }>;
        giftBoxSelection?: { type: string; greeting: string };
        appliedDiscountCode?: string;
        newsletterSubscribed?: boolean;
        activityLog?: Array<{ label: string; timestamp: string }>;
        createdAt?: string;
      }) => Promise<Record<string, any>>;
      signInCustomer: (
        email: string,
        password: string,
        localState?:
          | string[]
          | {
              favorites?: string[];
              watchedProducts?: string[];
              cart?: Array<{ productId: string; quantity: number }>;
              giftBoxSelection?: { type: string; greeting: string };
              appliedDiscountCode?: string;
            }
      ) => Promise<{ customer: Record<string, any>; orders: any[] }>;
      signOutCustomer: () => Promise<void>;
      changeCustomerPassword: (currentPassword: string, newPassword: string) => Promise<void>;
      sendCustomerPasswordReset: (email: string) => Promise<void>;
      getCurrentCustomerUid: () => string | null;
      syncCustomerShoppingState: (state: {
        cart?: Array<{ productId: string; quantity: number }>;
        giftBoxSelection?: { type: string; greeting: string };
        appliedDiscountCode?: string;
        watchedProducts?: string[];
      }) => Promise<void>;
      allocateNextOrderNumber: (minBaseline?: number) => Promise<number>;
      saveNewsletterSubscriber: (
        email: string,
        source?: string,
        subscribed?: boolean
      ) => Promise<Record<string, any> | null>;
      deleteNewsletterSubscriber: (subscriberId: string) => Promise<void>;
      saveStockWatch: (payload: {
        productId: string;
        productName: string;
        name?: string;
        email: string;
      }) => Promise<Record<string, any> | null>;
      updateStockWatchStatus: (watchId: string, status: 'active' | 'notified') => Promise<void>;
      deleteStockWatch: (watchId: string) => Promise<void>;
      saveDiscount: (discount: any) => Promise<void>;
      deleteDiscount: (discountCode: string) => Promise<void>;
      saveStoreSettings: (settings: any) => Promise<void>;
      getGiftBoxPrices: () => Promise<any>;
      saveGiftBoxPrices: (settings: any) => Promise<void>;
      signInAdminWithGoogle: () => Promise<User>;
      signOutAdmin: () => Promise<void>;
      isCurrentUserAdmin: () => boolean;
      getAdminIdToken: () => Promise<string | null>;
      isReady: boolean;
    };
  }
}

async function fetchCustomerOrdersFromFirestore(uid: string, email?: string | null): Promise<any[]> {
  const resultsMap = new Map<string, any>();
  try {
    const qByUid = query(collection(db, 'orders'), where('customerId', '==', uid));
    const snapUid = await getDocs(qByUid);
    snapUid.forEach((d) => {
      const normalized = normalizeCloudOrder(d.data());
      if (normalized && normalized.id) {
        resultsMap.set(String(normalized.id), normalized);
      }
    });
  } catch (err) {
    console.warn('Kunde inte hämta kundordrar via UID:', err);
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanEmail && auth.currentUser?.emailVerified) {
    try {
      const qByEmail = query(collection(db, 'orders'), where('customerEmail', '==', cleanEmail));
      const snapEmail = await getDocs(qByEmail);
      snapEmail.forEach((d) => {
        const normalized = normalizeCloudOrder(d.data());
        if (normalized && normalized.id) {
          resultsMap.set(String(normalized.id), normalized);
        }
      });
    } catch (_) {}
  }

  return Array.from(resultsMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
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
    return Boolean(cur && cur.email && cur.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && cur.emailVerified !== false);
  },

  getCurrentCustomerUid(): string | null {
    const cur = auth.currentUser;
    if (!cur) return null;
    if (SagomaskanFirebase.isCurrentUserAdmin()) return null;
    return cur.uid;
  },

  async getAdminIdToken(): Promise<string | null> {
    const cur = auth.currentUser;
    if (!cur) return null;
    try {
      return await cur.getIdToken();
    } catch {
      return null;
    }
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

  async signOutAdmin(): Promise<void> {
    await signOut(auth);
    console.log('Admin utloggad');
  },

  async registerCustomer(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    zip?: string;
    city?: string;
    favorites?: string[];
    watchedProducts?: string[];
    cart?: Array<{ productId: string; quantity: number }>;
    giftBoxSelection?: { type: string; greeting: string };
    appliedDiscountCode?: string;
    newsletterSubscribed?: boolean;
    activityLog?: Array<{ label: string; timestamp: string }>;
    createdAt?: string;
  }): Promise<Record<string, any>> {
    const cleanName = String(payload?.name || '').trim().substring(0, 120);
    const cleanEmail = String(payload?.email || '').trim().toLowerCase().substring(0, 160);
    const password = String(payload?.password || '');

    if (cleanName.length < 2) {
      throw new Error('Vänligen ange både för- och efternamn.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      throw new Error('Vänligen ange en giltig e-postadress.');
    }
    if (password.length < 6) {
      throw new Error('Lösenordet måste innehålla minst 6 tecken.');
    }

    authFlowInProgress = true;
    try {
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err) {
      throw mapFirebaseAuthError(err);
    }

    const user = userCredential.user;
    try {
      await updateProfile(user, { displayName: cleanName });
    } catch (_) {}

    const nowIso = new Date().toISOString();
    const customerDoc = buildCleanCustomerDoc(user.uid, {
      id: user.uid,
      name: cleanName,
      email: cleanEmail,
      phone: payload.phone || '',
      address: payload.address || '',
      zip: payload.zip || '',
      city: payload.city || '',
      favorites: Array.isArray(payload.favorites) ? payload.favorites : [],
      watchedProducts: Array.isArray(payload.watchedProducts) ? payload.watchedProducts : [],
      cart: Array.isArray(payload.cart) ? payload.cart : [],
      giftBoxSelection: payload.giftBoxSelection || { type: 'none', greeting: '' },
      appliedDiscountCode: payload.appliedDiscountCode || '',
      newsletterSubscribed: Boolean(payload.newsletterSubscribed),
      createdAt: payload.createdAt || nowIso,
      lastLoginAt: nowIso,
      updatedAt: nowIso,
      activityLog:
        Array.isArray(payload.activityLog) && payload.activityLog.length > 0
          ? payload.activityLog
          : [
              { label: 'Första inloggning genomförd', timestamp: nowIso },
              { label: 'Konto skapat hos Sagomaskan', timestamp: nowIso }
            ]
    });

    if (!customerDoc) {
      throw new Error('Kunde inte skapa giltig kundprofil.');
    }

    const path = `customers/${user.uid}`;
    try {
      await setDoc(doc(db, 'customers', user.uid), customerDoc);
      console.log('✅ Kundkonto skapat i Firebase Auth & Firestore:', user.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }

    startCustomerListeners(user.uid, cleanEmail);
    return customerDoc;
    } finally {
      authFlowInProgress = false;
    }
  },

  async signInCustomer(
    email: string,
    password: string,
    localState:
      | string[]
      | {
          favorites?: string[];
          watchedProducts?: string[];
          cart?: Array<{ productId: string; quantity: number }>;
          giftBoxSelection?: { type: string; greeting: string };
          appliedDiscountCode?: string;
        } = []
  ): Promise<{ customer: Record<string, any>; orders: any[] }> {
    const cleanEmail = String(email || '').trim().toLowerCase().substring(0, 160);
    if (!cleanEmail || !password) {
      throw new Error('Vänligen fyll i både e-postadress och lösenord.');
    }

    authFlowInProgress = true;
    try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err) {
      throw mapFirebaseAuthError(err);
    }

    const user = userCredential.user;
    const path = `customers/${user.uid}`;
    const nowIso = new Date().toISOString();

    let existingProfile: Record<string, any> | null = null;
    try {
      let snap;
      try {
        snap = await getDocFromServer(doc(db, 'customers', user.uid));
      } catch (_) {
        snap = await getDoc(doc(db, 'customers', user.uid));
      }
      if (snap.exists()) {
        existingProfile = snap.data() as Record<string, any>;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }

    const stateObj = Array.isArray(localState) ? { favorites: localState } : (localState || {});
    const localFavorites = Array.isArray(stateObj.favorites) ? stateObj.favorites : [];
    const localWatched = Array.isArray(stateObj.watchedProducts) ? stateObj.watchedProducts : [];
    const localCart = sanitizeCartItems(stateObj.cart);
    const localGiftBox = sanitizeGiftBoxSelection(stateObj.giftBoxSelection);
    const localDiscount = String(stateObj.appliedDiscountCode || '').trim().toUpperCase();

    const prevFavs = Array.isArray(existingProfile?.favorites) ? existingProfile!.favorites.map(String) : [];
    const mergedFavs = Array.from(new Set([...prevFavs, ...localFavorites.map(String)])).slice(0, 200);

    const prevWatched = sanitizeWatchedProducts(existingProfile?.watchedProducts);
    const mergedWatched = Array.from(new Set([...prevWatched, ...sanitizeWatchedProducts(localWatched)])).slice(0, 200);

    const cloudCart = sanitizeCartItems(existingProfile?.cart);
    const cartMap = new Map<string, number>();
    cloudCart.forEach((item) => cartMap.set(item.productId, item.quantity));
    localCart.forEach((item) => {
      cartMap.set(item.productId, Math.max(cartMap.get(item.productId) || 0, item.quantity));
    });
    const mergedCart = Array.from(cartMap.entries())
      .slice(0, 100)
      .map(([productId, quantity]) => ({ productId, quantity }));

    const cloudGiftBox = sanitizeGiftBoxSelection(existingProfile?.giftBoxSelection);
    const mergedGiftBox = cloudGiftBox.type !== 'none' ? cloudGiftBox : localGiftBox;

    const mergedDiscount =
      String(existingProfile?.appliedDiscountCode || '').trim().toUpperCase() || localDiscount;

    const prevLog = Array.isArray(existingProfile?.activityLog) ? existingProfile!.activityLog : [];
    const updatedLog = [{ label: 'Inloggning genomförd', timestamp: nowIso }, ...prevLog].slice(0, 25);

    const fallbackName =
      existingProfile?.name ||
      user.displayName ||
      cleanEmail.split('@')[0] ||
      'Kund';

    const mergedCustomer = buildCleanCustomerDoc(user.uid, {
      ...(existingProfile || {}),
      id: user.uid,
      name: fallbackName.length >= 2 ? fallbackName : 'Sagomaskan Kund',
      email: (existingProfile?.email || user.email || cleanEmail).toLowerCase(),
      favorites: mergedFavs,
      watchedProducts: mergedWatched,
      cart: mergedCart,
      giftBoxSelection: mergedGiftBox,
      appliedDiscountCode: mergedDiscount,
      createdAt: existingProfile?.createdAt || nowIso,
      previousLoginAt: existingProfile?.lastLoginAt || existingProfile?.createdAt || nowIso,
      lastLoginAt: nowIso,
      updatedAt: nowIso,
      activityLog: updatedLog
    });

    if (!mergedCustomer) {
      throw new Error('Kunde inte läsa kundprofilen från Firebase.');
    }

    try {
      await setDoc(doc(db, 'customers', user.uid), mergedCustomer);
      console.log('✅ Kund inloggad och profil synkad från Firebase:', user.uid);
    } catch (err) {
      handleFirestoreError(err, existingProfile ? OperationType.UPDATE : OperationType.CREATE, path);
    }

    const orders = await fetchCustomerOrdersFromFirestore(user.uid, user.email || cleanEmail);
    startCustomerListeners(user.uid, user.email || cleanEmail);

    return { customer: mergedCustomer, orders };
    } finally {
      authFlowInProgress = false;
    }
  },

  async signOutCustomer(): Promise<void> {
    stopCustomerListeners();
    try {
      await signOut(auth);
      console.log('Kund utloggad från Firebase Auth');
    } catch (err) {
      console.warn('Utloggning från Firebase Auth misslyckades:', err);
    }
  },

  async changeCustomerPassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Du behöver vara inloggad för att byta lösenord.');
    }
    if (!currentPassword || !newPassword) {
      throw new Error('Vänligen fyll i både nuvarande och nytt lösenord.');
    }
    if (newPassword.length < 6) {
      throw new Error('Det nya lösenordet måste vara minst 6 tecken långt.');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (err) {
      throw mapFirebaseAuthError(err);
    }

    // Uppdatera aktivitetslogg i Firestore
    const path = `customers/${user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'customers', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const nowIso = new Date().toISOString();
        const prevLog = Array.isArray(data.activityLog) ? data.activityLog : [];
        const nextDoc = buildCleanCustomerDoc(user.uid, {
          ...data,
          updatedAt: nowIso,
          activityLog: [{ label: 'Lösenord uppdaterat', timestamp: nowIso }, ...prevLog].slice(0, 25)
        });
        if (nextDoc) {
          await setDoc(doc(db, 'customers', user.uid), nextDoc);
        }
      }
    } catch (err) {
      console.warn('Lösenord uppdaterat i Auth, men kunde inte logga i Firestore:', err);
    }
  },

  async sendCustomerPasswordReset(email: string): Promise<void> {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      throw new Error('Vänligen ange en giltig e-postadress.');
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      throw mapFirebaseAuthError(err);
    }
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

      const uniqueUrls = Array.from(new Set(urlsToDelete.filter(Boolean)));
      for (const imgUrl of uniqueUrls) {
        await SagomaskanFirebase.deleteProductImageFromStorage(imgUrl);
      }

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
      const customerEmail = String(custObj.email || order.customerEmail || '').trim().toLowerCase().substring(0, 160);
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

      const curUser = auth.currentUser;
      const isAdm = SagomaskanFirebase.isCurrentUserAdmin();
      const resolvedCustomerId = isAdm
        ? (order.customerId ? String(order.customerId) : null)
        : (curUser ? curUser.uid : null);

      const cleanOrder: any = {
        id: String(order.id),
        orderNumber: String(order.orderNumber || order.id),
        customerId: resolvedCustomerId,
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
    const curUser = auth.currentUser;
    if (!curUser) return Array.isArray(localOrders) ? localOrders : [];
    try {
      const cloudOrders = await fetchCustomerOrdersFromFirestore(curUser.uid, curUser.email);
      const mergedMap = new Map<string, any>();
      (Array.isArray(localOrders) ? localOrders : []).forEach((ord) => {
        if (ord && ord.id) mergedMap.set(String(ord.id), ord);
      });
      cloudOrders.forEach((ord) => {
        if (ord && ord.id) {
          const prev = mergedMap.get(String(ord.id)) || {};
          mergedMap.set(String(ord.id), normalizeCloudOrder({ ...prev, ...ord }));
        }
      });
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } catch (_) {
      return Array.isArray(localOrders) ? localOrders : [];
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

  async saveCustomer(customer: any) {
    if (!customer || !customer.id) return;
    const curUser = auth.currentUser;
    const cleanId = String(customer.id).trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    if (!cleanId) return;
    if (!curUser || (curUser.uid !== cleanId && !SagomaskanFirebase.isCurrentUserAdmin())) {
      return;
    }

    const cleanCustomer = buildCleanCustomerDoc(cleanId, customer);
    if (!cleanCustomer) return;

    const path = `customers/${cleanId}`;
    try {
      await setDoc(doc(db, 'customers', cleanId), cleanCustomer);
      console.log('✅ Kundkonto sparat i Firestore:', cleanId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteCustomer(customerId: string) {
    const cleanId = String(customerId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    if (!cleanId) return;
    const path = `customers/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'customers', cleanId));
      console.log('Kundkonto borttaget ur Firestore:', cleanId);
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
  },

  async syncCustomerShoppingState(state: {
    cart?: Array<{ productId: string; quantity: number }>;
    giftBoxSelection?: { type: string; greeting: string };
    appliedDiscountCode?: string;
    watchedProducts?: string[];
  }): Promise<void> {
    const uid = SagomaskanFirebase.getCurrentCustomerUid();
    if (!uid || !state || typeof state !== 'object') return;
    const path = `customers/${uid}`;
    const patch: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (state.cart !== undefined) {
      patch.cart = sanitizeCartItems(state.cart);
    }
    if (state.giftBoxSelection !== undefined) {
      patch.giftBoxSelection = sanitizeGiftBoxSelection(state.giftBoxSelection);
    }
    if (state.appliedDiscountCode !== undefined) {
      patch.appliedDiscountCode = String(state.appliedDiscountCode || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_\-]/g, '')
        .substring(0, 50);
    }
    if (state.watchedProducts !== undefined) {
      patch.watchedProducts = sanitizeWatchedProducts(state.watchedProducts);
    }
    try {
      await setDoc(doc(db, 'customers', uid), patch, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async allocateNextOrderNumber(minBaseline = 1000): Promise<number> {
    const path = 'counters/orders';
    const counterRef = doc(db, 'counters', 'orders');
    try {
      const nextNum = await runTransaction(db, async (tx) => {
        const snap = await tx.get(counterRef);
        const nowIso = new Date().toISOString();
        if (!snap.exists()) {
          const initialNext = Math.min(9999999, Math.max(1001, Math.floor(Number(minBaseline) || 1000) + 1));
          tx.set(counterRef, { nextNumber: initialNext, updatedAt: nowIso });
          return initialNext;
        }
        const currentVal = Math.max(1000, Math.floor(Number(snap.data()?.nextNumber) || 1000));
        const incremented = Math.min(9999999, currentVal + 1);
        tx.set(counterRef, { nextNumber: incremented, updatedAt: nowIso });
        return incremented;
      });
      console.log('✅ Globalt ordernummer allokerat i Firebase:', nextNum);
      return nextNum;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  async saveNewsletterSubscriber(
    email: string,
    source = 'footer',
    subscribed = true
  ): Promise<Record<string, any> | null> {
    const cleanEmail = String(email || '').trim().toLowerCase().substring(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return null;
    const subId = makeNewsletterSubscriberId(cleanEmail);
    const path = `newsletterSubscribers/${subId}`;
    const nowIso = new Date().toISOString();
    const docData = {
      id: subId,
      email: cleanEmail,
      source: String(source || 'footer').trim().substring(0, 40) || 'footer',
      subscribed: Boolean(subscribed),
      subscribedAt: nowIso,
      updatedAt: nowIso
    };
    try {
      await setDoc(doc(db, 'newsletterSubscribers', subId), docData);
      console.log('✅ Nyhetsbrevsprenumerant sparad i Firestore:', subId);
      return docData;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return null;
    }
  },

  async deleteNewsletterSubscriber(subscriberId: string): Promise<void> {
    const cleanId = String(subscriberId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    if (!cleanId) return;
    const path = `newsletterSubscribers/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'newsletterSubscribers', cleanId));
      console.log('Nyhetsbrevsprenumerant borttagen ur Firestore:', cleanId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveStockWatch(payload: {
    productId: string;
    productName: string;
    name?: string;
    email: string;
  }): Promise<Record<string, any> | null> {
    const cleanProdId = String(payload?.productId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    const cleanEmail = String(payload?.email || '').trim().toLowerCase().substring(0, 160);
    if (!cleanProdId || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return null;

    const watchId = `watch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const path = `stockWatches/${watchId}`;
    const nowIso = new Date().toISOString();
    const curUid = SagomaskanFirebase.getCurrentCustomerUid();
    const docData = {
      id: watchId,
      productId: cleanProdId,
      productName: String(payload?.productName || 'Produkt').trim().substring(0, 150) || 'Produkt',
      customerId: curUid || null,
      name: String(payload?.name || 'Kund').trim().substring(0, 100) || 'Kund',
      email: cleanEmail,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso
    };
    try {
      await setDoc(doc(db, 'stockWatches', watchId), docData);
      console.log('✅ Produktbevakning sparad i Firestore:', watchId);
      return docData;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return null;
    }
  },

  async updateStockWatchStatus(watchId: string, status: 'active' | 'notified'): Promise<void> {
    const cleanId = String(watchId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    if (!cleanId) return;
    const cleanStatus = status === 'notified' ? 'notified' : 'active';
    const path = `stockWatches/${cleanId}`;
    try {
      await setDoc(
        doc(db, 'stockWatches', cleanId),
        { status: cleanStatus, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteStockWatch(watchId: string): Promise<void> {
    const cleanId = String(watchId || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 128);
    if (!cleanId) return;
    const path = `stockWatches/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'stockWatches', cleanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
};

window.SagomaskanFirebase = SagomaskanFirebase;

// Prenumerationshanterare för skyddade admin-lyssnare (Ordrar, Meddelanden, Kunder, Nyhetsbrev & Produktbevakningar)
let unsubscribeOrders: (() => void) | null = null;
let unsubscribeMessages: (() => void) | null = null;
let unsubscribeCustomers: (() => void) | null = null;
let unsubscribeNewsletterSubscribers: (() => void) | null = null;
let unsubscribeStockWatches: (() => void) | null = null;

// Prenumerationshanterare för inloggad kunds egen profil & ordrar
let unsubscribeCustomerProfile: (() => void) | null = null;
let unsubscribeCustomerOrders: (() => void) | null = null;
let activeCustomerListenerUid: string | null = null;
let authFlowInProgress = false;

function startCustomerListeners(uid: string, email?: string | null) {
  if (!uid) return;
  if (activeCustomerListenerUid === uid && unsubscribeCustomerProfile) return;
  stopCustomerListeners();
  activeCustomerListenerUid = uid;
  const win = window as any;

  try {
    unsubscribeCustomerProfile = onSnapshot(
      doc(db, 'customers', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (win.applyCloudCustomerProfile && typeof win.applyCloudCustomerProfile === 'function') {
            win.applyCloudCustomerProfile(data);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `customers/${uid}`);
      }
    );
  } catch (err) {
    console.warn('Kunde inte starta kundprofils-lyssnare:', err);
  }

  try {
    const qOrders = query(collection(db, 'orders'), where('customerId', '==', uid));
    unsubscribeCustomerOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const custOrders: any[] = [];
        snapshot.forEach((d) => {
          custOrders.push(normalizeCloudOrder(d.data()));
        });
        custOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (win.applyCloudCustomerOrders && typeof win.applyCloudCustomerOrders === 'function') {
          win.applyCloudCustomerOrders(custOrders);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      }
    );
  } catch (err) {
    console.warn('Kunde inte starta kundorder-lyssnare:', err);
  }

  if (email && auth.currentUser?.emailVerified) {
    fetchCustomerOrdersFromFirestore(uid, email).then((allOrders) => {
      if (win.applyCloudCustomerOrders && typeof win.applyCloudCustomerOrders === 'function') {
        win.applyCloudCustomerOrders(allOrders);
      }
    }).catch(() => {});
  }
}

function stopCustomerListeners() {
  activeCustomerListenerUid = null;
  if (unsubscribeCustomerProfile) {
    unsubscribeCustomerProfile();
    unsubscribeCustomerProfile = null;
  }
  if (unsubscribeCustomerOrders) {
    unsubscribeCustomerOrders();
    unsubscribeCustomerOrders = null;
  }
}

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

  // 3. Synka Registrerade Kunder i realtid (endast för inloggad admin)
  if (!unsubscribeCustomers) {
    try {
      unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
        const firestoreCustomers: any[] = [];
        snapshot.forEach((d) => {
          firestoreCustomers.push(d.data());
        });
        firestoreCustomers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (win.applyCloudCustomers && typeof win.applyCloudCustomers === 'function') {
          win.applyCloudCustomers(firestoreCustomers);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'customers');
      });
      console.log('✅ Admin kund-lyssnare aktiverad');
    } catch (err) {
      console.warn('Fel vid kundlyssnare:', err);
    }
  }
  // 4. Synka Nyhetsbrevsprenumeranter i realtid (endast för inloggad admin)
  if (!unsubscribeNewsletterSubscribers) {
    try {
      unsubscribeNewsletterSubscribers = onSnapshot(collection(db, 'newsletterSubscribers'), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push(d.data());
        });
        list.sort((a, b) => new Date(b.updatedAt || b.subscribedAt || 0).getTime() - new Date(a.updatedAt || a.subscribedAt || 0).getTime());
        if (win.applyCloudNewsletterSubscribers && typeof win.applyCloudNewsletterSubscribers === 'function') {
          win.applyCloudNewsletterSubscribers(list);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'newsletterSubscribers');
      });
      console.log('✅ Admin nyhetsbrevs-lyssnare aktiverad');
    } catch (err) {
      console.warn('Fel vid nyhetsbrevslyssnare:', err);
    }
  }

  // 5. Synka Produktbevakningar ("Bevaka") i realtid (endast för inloggad admin)
  if (!unsubscribeStockWatches) {
    try {
      unsubscribeStockWatches = onSnapshot(collection(db, 'stockWatches'), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push(d.data());
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (win.applyCloudStockWatches && typeof win.applyCloudStockWatches === 'function') {
          win.applyCloudStockWatches(list);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'stockWatches');
      });
      console.log('✅ Admin produktbevaknings-lyssnare aktiverad');
    } catch (err) {
      console.warn('Fel vid produktbevakningslyssnare:', err);
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
  if (unsubscribeCustomers) {
    unsubscribeCustomers();
    unsubscribeCustomers = null;
    console.log('Admin kund-lyssnare stoppad');
  }
  if (unsubscribeNewsletterSubscribers) {
    unsubscribeNewsletterSubscribers();
    unsubscribeNewsletterSubscribers = null;
    console.log('Admin nyhetsbrevs-lyssnare stoppad');
  }
  if (unsubscribeStockWatches) {
    unsubscribeStockWatches();
    unsubscribeStockWatches = null;
    console.log('Admin produktbevaknings-lyssnare stoppad');
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

  // 5. Lyssna på Admin- och Kund-autentisering
  try {
    onAuthStateChanged(auth, async (user) => {
      const isAdm = Boolean(
        user &&
          user.email &&
          user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
          user.emailVerified !== false
      );
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

      if (user && !isAdm) {
        if (authFlowInProgress) return;
        try {
          const snap = await getDoc(doc(db, 'customers', user.uid));
          if (snap.exists()) {
            if (win.applyCloudCustomerProfile && typeof win.applyCloudCustomerProfile === 'function') {
              win.applyCloudCustomerProfile(snap.data());
            }
          } else if (user.email) {
            const nowIso = new Date().toISOString();
            const created = buildCleanCustomerDoc(user.uid, {
              id: user.uid,
              name: user.displayName && user.displayName.length >= 2 ? user.displayName : user.email.split('@')[0] || 'Kund',
              email: user.email,
              createdAt: nowIso,
              lastLoginAt: nowIso,
              updatedAt: nowIso,
              activityLog: [{ label: 'Konto synkat från Firebase', timestamp: nowIso }]
            });
            if (created) {
              await setDoc(doc(db, 'customers', user.uid), created);
              if (win.applyCloudCustomerProfile && typeof win.applyCloudCustomerProfile === 'function') {
                win.applyCloudCustomerProfile(created);
              }
            }
          }
          startCustomerListeners(user.uid, user.email);
        } catch (err) {
          console.warn('Kunde inte återställa kundsession från Firebase:', err);
        }
      } else if (!user) {
        stopCustomerListeners();
        if (win.clearCloudCustomerSession && typeof win.clearCloudCustomerSession === 'function') {
          win.clearCloudCustomerSession();
        }
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
