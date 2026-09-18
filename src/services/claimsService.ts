import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Claim, ClaimStatus, ClaimAttachment } from '../types';

const CLAIMS_COLLECTION = 'claims';
const LOCAL_STORAGE_CLAIMS_KEY = 'sagomaskan_claims_v1';
const LOCAL_STORAGE_COUNTER_KEY = 'sagomaskan_claims_counter_v1';

// Seed sample claim if empty so admin has initial reference
const SAMPLE_CLAIMS: Claim[] = [
  {
    id: 'sample-claim-1',
    claimNumber: 'REK-2026-0001',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Ny',
    adminNotes: '',
    firstName: 'Sofia',
    lastName: 'Lindqvist',
    company: '',
    email: 'sofia.lindqvist@example.se',
    phone: '070-123 45 67',
    address: 'Björkvägen 14',
    postalCode: '114 21',
    city: 'Stockholm',
    orderNumber: '#4821',
    purchaseDate: '2026-02-14',
    productName: 'Handvirkad Babyfilt Mose',
    articleNumber: 'FILT-MOS-01',
    claimType: 'Defekt/skadad produkt',
    description: 'En söm i kanten har släppt efter varsam handtvätt enligt skötselråden. I övrigt är filten fantastisk.',
    discoveredDate: '2026-02-28',
    desiredResolution: 'Reparation',
    attachments: [
      {
        id: 'att-1',
        name: 'skada_kant.jpg',
        size: 342000,
        type: 'image/jpeg',
        dataUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
        category: 'product_damage',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    confirmedAccurate: true
  },
  {
    id: 'sample-claim-2',
    claimNumber: 'REK-2026-0002',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'Under behandling',
    adminNotes: 'Kontaktat kunden via mejl. Vi skickar en ersättningsskallra snarast.',
    firstName: 'Marcus',
    lastName: 'Ekström',
    company: 'Ekström Konsult',
    email: 'marcus.ekstrom@example.com',
    phone: '073-987 65 43',
    address: 'Storgatan 88',
    postalCode: '411 38',
    city: 'Göteborg',
    orderNumber: '#3910',
    purchaseDate: '2026-02-01',
    productName: 'Virkad Skallra Kanin Lovis',
    articleNumber: 'SKAL-KAN-02',
    claimType: 'Felaktig produkt',
    description: 'Fick färg Linnebeige istället för Skogsgrön som vi beställt.',
    discoveredDate: '2026-02-05',
    desiredResolution: 'Ersättningsprodukt',
    attachments: [],
    confirmedAccurate: true
  }
];

// Helper: Read local storage
function getLocalClaims(): Claim[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLAIMS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_CLAIMS_KEY, JSON.stringify(SAMPLE_CLAIMS));
      return SAMPLE_CLAIMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return SAMPLE_CLAIMS;
  }
}

// Helper: Save local storage
function saveLocalClaims(claims: Claim[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CLAIMS_KEY, JSON.stringify(claims));
    window.dispatchEvent(new CustomEvent('claims-updated'));
  } catch (err) {
    console.warn('Kunde inte spara reklamation till localStorage:', err);
  }
}

// Generate sequential claim number: REK-2026-XXXX
export function generateNextClaimNumber(): string {
  const currentYear = new Date().getFullYear();
  let counter = 3;
  try {
    const storedCounter = localStorage.getItem(LOCAL_STORAGE_COUNTER_KEY);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    } else {
      const existing = getLocalClaims();
      counter = existing.length + 1;
    }
  } catch {
    counter = Math.floor(100 + Math.random() * 900);
  }

  localStorage.setItem(LOCAL_STORAGE_COUNTER_KEY, counter.toString());
  const padded = counter.toString().padStart(4, '0');
  return `REK-${currentYear}-${padded}`;
}

/**
 * Creates and submits a new Claim.
 * Persists to both Firestore and LocalStorage for complete resiliency.
 */
export async function createClaim(
  data: Omit<Claim, 'id' | 'claimNumber' | 'createdAt' | 'status'> & { claimNumber?: string }
): Promise<Claim> {
  const now = new Date().toISOString();
  const claimNumber = data.claimNumber || generateNextClaimNumber();
  const id = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newClaim: Claim = {
    ...data,
    id,
    claimNumber,
    status: 'Ny',
    createdAt: now,
    updatedAt: now,
    adminNotes: ''
  };

  // 1. Save locally first (never fails)
  const currentLocal = getLocalClaims();
  saveLocalClaims([newClaim, ...currentLocal]);

  // 2. Try Firestore persistence
  try {
    const docRef = doc(db, CLAIMS_COLLECTION, id);
    await setDoc(docRef, JSON.parse(JSON.stringify(newClaim)));
  } catch (firestoreError) {
    console.warn('Firestore kunde inte ta emot reklamationen direkt (sparades lokalt):', firestoreError);
  }

  return newClaim;
}

/**
 * Subscribes to claims in real time.
 * Merges Firestore documents with locally saved claims so no submissions are missed.
 */
export function subscribeClaims(callback: (claims: Claim[]) => void): () => void {
  let isUnsubscribed = false;

  const pushMerged = (firestoreClaims: Claim[] = []) => {
    const local = getLocalClaims();
    const map = new Map<string, Claim>();

    // Add local first
    local.forEach((c) => map.set(c.id, c));
    // Overwrite/add with Firestore data
    firestoreClaims.forEach((c) => map.set(c.id, c));

    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(combined);
  };

  // Initial local push
  pushMerged([]);

  // Local storage change listener
  const handleLocalChange = () => {
    if (!isUnsubscribed) {
      pushMerged([]);
    }
  };
  window.addEventListener('claims-updated', handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Firestore listener
  let unsubscribeFirestore = () => {};
  try {
    const q = query(collection(db, CLAIMS_COLLECTION));
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (isUnsubscribed) return;
        const firestoreList: Claim[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push({
            ...(docSnap.data() as Claim),
            id: docSnap.id
          });
        });
        pushMerged(firestoreList);
      },
      (err) => {
        console.warn('Firestore claims subscription notice:', err?.message || err);
        // On permission or network issue, fallback cleanly to local state
        pushMerged([]);
      }
    );
  } catch (err) {
    console.warn('Kunde inte starta Firestore lyssnare för reklamationer:', err);
  }

  return () => {
    isUnsubscribed = true;
    window.removeEventListener('claims-updated', handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    unsubscribeFirestore();
  };
}

/**
 * Updates status of a claim.
 */
export async function updateClaimStatus(id: string, newStatus: ClaimStatus): Promise<void> {
  const now = new Date().toISOString();

  // Local update
  const local = getLocalClaims();
  const updated = local.map((c) =>
    c.id === id ? { ...c, status: newStatus, updatedAt: now } : c
  );
  saveLocalClaims(updated);

  // Firestore update
  try {
    const docRef = doc(db, CLAIMS_COLLECTION, id);
    await updateDoc(docRef, { status: newStatus, updatedAt: now });
  } catch (err) {
    console.warn('Firestore kunde inte uppdatera reklamationsstatus:', err);
  }
}

/**
 * Updates admin internal notes on a claim.
 */
export async function updateClaimNotes(id: string, notes: string): Promise<void> {
  const now = new Date().toISOString();

  // Local update
  const local = getLocalClaims();
  const updated = local.map((c) =>
    c.id === id ? { ...c, adminNotes: notes, updatedAt: now } : c
  );
  saveLocalClaims(updated);

  // Firestore update
  try {
    const docRef = doc(db, CLAIMS_COLLECTION, id);
    await updateDoc(docRef, { adminNotes: notes, updatedAt: now });
  } catch (err) {
    console.warn('Firestore kunde inte uppdatera anteckningar:', err);
  }
}

/**
 * Deletes a claim.
 */
export async function deleteClaim(id: string): Promise<void> {
  const local = getLocalClaims();
  saveLocalClaims(local.filter((c) => c.id !== id));

  try {
    const docRef = doc(db, CLAIMS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}

/**
 * Finds a claim by its case number (e.g. "REK-2026-0001").
 */
export function findClaimByNumber(claimNumber: string): Claim | undefined {
  const clean = claimNumber.trim().toUpperCase();
  const local = getLocalClaims();
  return local.find((c) => c.claimNumber.toUpperCase() === clean);
}
