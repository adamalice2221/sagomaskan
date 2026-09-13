export interface SendInquiryEmailItem {
  productName: string;
  priceAtTimeOfInquiry: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  image?: string;
}

export interface SendInquiryEmailPayload {
  inquiryId: string;
  inquiryNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  message?: string;
  items: SendInquiryEmailItem[];
  estimatedTotal: number;
  discountCode?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  subtotalBeforeDiscount?: number;
  totalAfterDiscount?: number;
}

export interface SendEmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Sends a confirmation email to the customer using the server-side Resend API.
 * Never throws an unhandled error so that the customer's completed inquiry is never interrupted.
 */
export async function sendInquiryConfirmationEmail(
  payload: SendInquiryEmailPayload
): Promise<SendEmailResponse> {
  try {
    const response = await fetch('/api/resend/send-inquiry-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || `Serverfel (${response.status})`;
      console.warn('[EmailService] Kundbekräftelse via Resend kunde inte skickas:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (data && data.success) {
      console.log(`[EmailService] Bekräftelsemejl skickat till ${payload.email} (Resend ID: ${data.emailId || 'OK'})`);
      return {
        success: true,
        emailId: data.emailId,
      };
    }

    console.warn('[EmailService] Resend returnerade ett felmeddelande:', data?.error);
    return {
      success: false,
      error: data?.error || 'Kunde inte skicka e-post',
    };
  } catch (err: any) {
    console.error('[EmailService] Nätverksfel vid anrop till /api/resend/send-inquiry-email:', err);
    return {
      success: false,
      error: err?.message || 'Nätverksfel vid sändning av bekräftelsemejl',
    };
  }
}
