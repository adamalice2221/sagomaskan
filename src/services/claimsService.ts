import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Claim, ClaimStatus } from '../types';

export const CLAIMS_COLLECTION = 'claims';

export interface CreateClaimPayload {
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  product: string;
  description: string;
  discoveredAt: string;
  imageUrls: string[];
  additionalInfo?: string;
}

/**
 * Creates a new customer claim.
 */
export async function createClaim(payload: CreateClaimPayload): Promise<string> {
  try {
    const cleanOrderNumber = payload.orderNumber.trim().slice(0, 100);
    const cleanCustomerName = payload.customerName.trim().slice(0, 150);
    const cleanEmail = payload.email.trim().toLowerCase().slice(0, 150);
    const cleanPhone = payload.phone?.trim().slice(0, 50) || '';
    const cleanProduct = payload.product.trim().slice(0, 200);
    const cleanDescription = payload.description.trim().slice(0, 3000);
    const cleanDiscoveredAt = payload.discoveredAt.trim().slice(0, 100);
    const cleanAdditionalInfo = payload.additionalInfo?.trim().slice(0, 2000) || '';
    const safeImages = Array.isArray(payload.imageUrls) ? payload.imageUrls.slice(0, 5) : [];

    const newClaimData: Omit<Claim, 'id'> = {
      orderNumber: cleanOrderNumber,
      customerName: cleanCustomerName,
      email: cleanEmail,
      phone: cleanPhone,
      product: cleanProduct,
      description: cleanDescription,
      discoveredAt: cleanDiscoveredAt,
      imageUrls: safeImages,
      additionalInfo: cleanAdditionalInfo,
      status: 'Ny',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      internalNotes: ''
    };

    const docRef = await addDoc(collection(db, CLAIMS_COLLECTION), newClaimData);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, CLAIMS_COLLECTION);
  }
}

/**
 * Subscribes to real-time claims updates (for admin panel).
 */
export function subscribeClaims(callback: (claims: Claim[]) => void): () => void {
  const q = query(collection(db, CLAIMS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const claims: Claim[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Claim, 'id'>)
      }));
      callback(claims);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, CLAIMS_COLLECTION);
    }
  );
}

/**
 * Updates status of a claim.
 */
export async function updateClaimStatus(id: string, status: ClaimStatus): Promise<void> {
  try {
    const claimDoc = doc(db, CLAIMS_COLLECTION, id);
    await updateDoc(claimDoc, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CLAIMS_COLLECTION}/${id}`);
  }
}

/**
 * Updates internal notes for a claim.
 */
export async function updateClaimNotes(id: string, internalNotes: string): Promise<void> {
  try {
    const claimDoc = doc(db, CLAIMS_COLLECTION, id);
    await updateDoc(claimDoc, {
      internalNotes: internalNotes.slice(0, 3000),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CLAIMS_COLLECTION}/${id}`);
  }
}

/**
 * Compresses an uploaded image client-side to ensure small storage footprint (< 250 KB).
 */
export async function compressClaimImage(file: File, maxWidth = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use image/jpeg with quality 0.7 for optimal size and compatibility
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Kunde inte läsa bildfilen.'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Kunde inte läsa filen.'));
    reader.readAsDataURL(file);
  });
}
