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
import { Withdrawal, WithdrawalStatus } from '../types';

export const WITHDRAWALS_COLLECTION = 'withdrawals';

export interface CreateWithdrawalPayload {
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  items: string;
}

/**
 * Creates a new customer withdrawal notification (ångeranmälan) and dispatches acknowledgement.
 */
export async function createWithdrawal(payload: CreateWithdrawalPayload): Promise<{ id: string; emailSent: boolean }> {
  try {
    const cleanOrderNumber = payload.orderNumber.trim().slice(0, 100);
    const cleanCustomerName = payload.customerName.trim().slice(0, 150);
    const cleanEmail = payload.email.trim().toLowerCase().slice(0, 150);
    const cleanPhone = payload.phone?.trim().slice(0, 50) || '';
    const cleanItems = payload.items.trim().slice(0, 1000);
    const nowIso = new Date().toISOString();

    const newWithdrawalData: Omit<Withdrawal, 'id'> = {
      orderNumber: cleanOrderNumber,
      customerName: cleanCustomerName,
      email: cleanEmail,
      phone: cleanPhone,
      items: cleanItems,
      status: 'Ny',
      submittedAt: nowIso,
      updatedAt: nowIso,
      acknowledgementSentAt: null,
      internalNotes: ''
    };

    const docRef = await addDoc(collection(db, WITHDRAWALS_COLLECTION), newWithdrawalData);
    const id = docRef.id;

    // Send acknowledgement email via Resend endpoint
    let emailSent = false;
    try {
      const response = await fetch('/api/resend/send-withdrawal-acknowledgement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: cleanOrderNumber,
          customerName: cleanCustomerName,
          email: cleanEmail,
          phone: cleanPhone,
          items: cleanItems,
          submittedAt: new Date(nowIso).toLocaleString('sv-SE')
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          emailSent = true;
          // Mark acknowledgement sent
          await updateDoc(doc(db, WITHDRAWALS_COLLECTION, id), {
            acknowledgementSentAt: new Date().toISOString()
          });
        }
      }
    } catch (emailErr) {
      console.warn('Kunde inte skicka automatiskt mottagningsbevis för ångeranmälan:', emailErr);
    }

    return { id, emailSent };
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, WITHDRAWALS_COLLECTION);
  }
}

/**
 * Subscribes to real-time withdrawals updates (for admin panel).
 */
export function subscribeWithdrawals(callback: (withdrawals: Withdrawal[]) => void): () => void {
  const q = query(collection(db, WITHDRAWALS_COLLECTION), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const withdrawals: Withdrawal[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Withdrawal, 'id'>)
      }));
      callback(withdrawals);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, WITHDRAWALS_COLLECTION);
    }
  );
}

/**
 * Updates status of a withdrawal case.
 */
export async function updateWithdrawalStatus(id: string, status: WithdrawalStatus): Promise<void> {
  try {
    const docRef = doc(db, WITHDRAWALS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${WITHDRAWALS_COLLECTION}/${id}`);
  }
}

/**
 * Updates internal notes for a withdrawal case.
 */
export async function updateWithdrawalNotes(id: string, internalNotes: string): Promise<void> {
  try {
    const docRef = doc(db, WITHDRAWALS_COLLECTION, id);
    await updateDoc(docRef, {
      internalNotes: internalNotes.slice(0, 3000),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${WITHDRAWALS_COLLECTION}/${id}`);
  }
}
