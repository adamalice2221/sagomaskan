import {
  collection,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsletterSubscriber } from '../types';

export const NEWSLETTER_COLLECTION = 'newsletterSubscribers';

export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return {
        success: false,
        message: 'Vänligen ange en giltig e-postadress.'
      };
    }

    const newSubscriber: Omit<NewsletterSubscriber, 'id'> = {
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      source: 'homepage_newsletter_section'
    };

    await addDoc(collection(db, NEWSLETTER_COLLECTION), newSubscriber);

    return {
      success: true,
      message: 'Tack för att du vill följa med! Du är nu anmäld till nyhetsbrevet.'
    };
  } catch (error) {
    console.error('Kunde inte spara nyhetsbrevsprenumeration:', error);
    return {
      success: false,
      message: 'Något gick fel vid anmälan. Vänligen försök igen om en liten stund.'
    };
  }
}
