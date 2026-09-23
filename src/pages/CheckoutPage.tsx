import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Heart,
  Info,
  Send,
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDiscount } from '../context/DiscountContext';
import { InquiryCustomerInfo, OrderInquiry, PageRoute } from '../types';
import { createInquiry } from '../services/db';
import { sendInquiryConfirmationEmail } from '../services/emailService';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface CheckoutPageProps {
  onNavigate: (page: PageRoute) => void;
  onOrderPlaced: (inquiry: OrderInquiry) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigate,
  onOrderPlaced
}) => {
  const { items, subtotal, clearCart } = useCart();
  const {
    appliedCode,
    appliedDiscount,
    discountResult,
    discountInput,
    setDiscountInput,
    applyDiscount,
    removeDiscount,
    discountError,
    clearDiscountError,
    isApplying
  } = useDiscount();

  const [customer, setCustomer] = useState<InquiryCustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!customer.name.trim()) {
      errors.name = 'Vänligen ange ditt namn';
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      errors.email = 'Vänligen ange en giltig e-postadress';
    }
    if (!customer.address.trim()) {
      errors.address = 'Vänligen ange din gatuadress';
    }
    if (!customer.postalCode.trim()) {
      errors.postalCode = 'Vänligen ange ditt postnummer';
    }
    if (!customer.city.trim()) {
      errors.city = 'Vänligen ange din ort';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (items.length === 0) {
      onNavigate('shop');
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        priceAtTimeOfInquiry: item.product.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        image: item.product.image || item.product.images?.[0]
      }));

      const isDiscountValid = Boolean(appliedCode && discountResult?.valid);
      const discountToPass = isDiscountValid ? appliedCode! : undefined;
      const generatedInquiryNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Save inquiry in Firestore first (atomic transaction if discount is used)
      const inquiryId = await createInquiry({
        inquiryNumber: generatedInquiryNumber,
        customerName: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone?.trim() || '',
        address: customer.address.trim(),
        postalCode: customer.postalCode.trim(),
        city: customer.city.trim(),
        message: customer.message?.trim() || '',
        items: itemsPayload,
        estimatedTotal: isDiscountValid ? discountResult!.totalAfterDiscount : subtotal,
        discountCode: discountToPass,
        adminNotes: ''
      });

      if (!inquiryId) {
        throw new Error('Inget giltigt ID returnerades från databasen vid skapande av förfrågan.');
      }

      // 2. Send confirmation email via Resend in the background.
      // If email sending fails or RESEND_API_KEY is missing, the inquiry remains completely safe in Firestore.
      try {
        const emailItems = items.map((item) => ({
          productName: item.product.name,
          priceAtTimeOfInquiry: item.product.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          image: item.product.image || item.product.images?.[0]
        }));

        const emailResult = await sendInquiryConfirmationEmail({
          inquiryId,
          inquiryNumber: generatedInquiryNumber,
          customerName: customer.name.trim(),
          email: customer.email.trim(),
          phone: customer.phone?.trim() || '',
          address: customer.address.trim(),
          postalCode: customer.postalCode.trim(),
          city: customer.city.trim(),
          message: customer.message?.trim() || '',
          items: emailItems,
          estimatedTotal: isDiscountValid ? discountResult!.totalAfterDiscount : subtotal,
          discountCode: discountToPass,
          discountType: appliedDiscount?.discountType,
          discountValue: appliedDiscount?.discountValue,
          discountAmount: isDiscountValid ? discountResult?.discountAmount : undefined,
          subtotalBeforeDiscount: isDiscountValid ? discountResult?.subtotalBeforeDiscount : subtotal,
          totalAfterDiscount: isDiscountValid ? discountResult?.totalAfterDiscount : subtotal,
        });

        if (emailResult.success) {
          console.log(`[Checkout] Bekräftelsemejl skickat till ${customer.email.trim()} (Resend ID: ${emailResult.emailId})`);
        } else {
          console.warn('[Checkout] Bekräftelsemejl kunde inte skickas, men förfrågan är sparad:', emailResult.error);
        }
      } catch (emailErr) {
        console.warn('[Checkout] Oväntat fel vid sändning av bekräftelsemejl (förfrågan är sparad i Firestore):', emailErr);
      }

      const newInquiry: OrderInquiry = {
        id: inquiryId,
        inquiryNumber: generatedInquiryNumber,
        customer: { ...customer },
        items: [...items],
        estimatedTotal: isDiscountValid ? discountResult!.totalAfterDiscount : subtotal,
        discountCode: isDiscountValid ? appliedCode! : undefined,
        discountType: isDiscountValid ? appliedDiscount?.discountType : undefined,
        discountValue: isDiscountValid ? appliedDiscount?.discountValue : undefined,
        discountAmount: isDiscountValid ? discountResult?.discountAmount : undefined,
        subtotalBeforeDiscount: isDiscountValid ? discountResult?.subtotalBeforeDiscount : subtotal,
        totalAfterDiscount: isDiscountValid ? discountResult?.totalAfterDiscount : subtotal,
        createdAt: new Date().toISOString(),
        status: 'received'
      };

      clearCart();
      removeDiscount();
      setIsSubmitting(false);
      onOrderPlaced(newInquiry);
      onNavigate('order-confirmation');
    } catch (err: any) {
      console.error('Inquiry submission error:', err);
      setIsSubmitting(false);
      setSubmitError(
        'Det gick inte att skicka din beställningsförfrågan just nu. Kontrollera dina uppgifter och försök igen. Om problemet kvarstår, kontakta mig.'
      );
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="font-serif text-2xl text-[#242D27]">
          Din förfrågelista är tom
        </p>
        <p className="text-sm text-[#66726A] font-light">
          Utforska shoppen och välj handgjorda virkade produkter du vill skicka en beställningsförfrågan om.
        </p>
        <a
          href={getPageUrl('shop')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('shop');
            }
          }}
          className="inline-block px-6 py-2.5 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors cursor-pointer"
        >
          Utforska shoppen
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Back button */}
      <a
        href={getPageUrl('cart')}
        onClick={(e) => {
          if (!isModifiedClick(e)) {
            e.preventDefault();
            onNavigate('cart');
          }
        }}
        className="inline-flex items-center gap-2 text-xs font-medium text-[#66726A] hover:text-[#242D27] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tillbaka till förfrågelistan</span>
      </a>

      {/* Header */}
      <div className="border-b border-[#E6DFD3] pb-5 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium tracking-tight">
          Beställningsförfrågan
        </h1>
        <p className="text-sm sm:text-base text-[#66726A] font-light max-w-2xl leading-relaxed">
          Fyll i dina uppgifter så återkommer jag personligen med svar om tillverkning, leverans och betalning.
        </p>
      </div>

      {submitError && (
        <div
          id="checkout-error-banner"
          className="p-4 rounded-xl bg-[#FDF2F0] border border-[#8C5248]/30 text-sm text-[#8C5248] flex items-start gap-3"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-[#8C5248] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#8C5248]">
              Kunde inte skicka förfrågan
            </p>
            <p className="leading-relaxed">
              {submitError}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitInquiry} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Inquiry Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            
            {/* Friendly explanation notice */}
            <div className="p-4 rounded-xl bg-[#EFF4F1] border border-[#6B8E7B]/30 text-xs text-[#526E5F] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold text-[#242D27]">
                  Viktig information om din förfrågan
                </p>
                <p>
                  Detta är en beställningsförfrågan. Ingen betalning genomförs på webbplatsen. Jag återkommer personligen med information om beställningen, pris, eventuell frakt och betalning.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Namn */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Namn *
                </label>
                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleInputChange}
                  placeholder="För- och efternamn"
                  className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] ${
                    validationErrors.name ? 'border-[#8C5248]' : 'border-[#E6DFD3]'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-[11px] text-[#8C5248] mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* E-post & Telefon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#242D27] mb-1">
                    E-post *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customer.email}
                    onChange={handleInputChange}
                    placeholder="din.epost@exempel.se"
                    className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] ${
                      validationErrors.email ? 'border-[#8C5248]' : 'border-[#E6DFD3]'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242D27] mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={customer.phone}
                    onChange={handleInputChange}
                    placeholder="T.ex. 070 123 45 67 (valfritt)"
                    className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                  />
                </div>
              </div>

              {/* Adress */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Adress *
                </label>
                <input
                  type="text"
                  name="address"
                  value={customer.address}
                  onChange={handleInputChange}
                  placeholder="Gatuadress och ev. lägenhetsnummer"
                  className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] ${
                    validationErrors.address ? 'border-[#8C5248]' : 'border-[#E6DFD3]'
                  }`}
                />
                {validationErrors.address && (
                  <p className="text-[11px] text-[#8C5248] mt-1">{validationErrors.address}</p>
                )}
              </div>

              {/* Postnummer & Ort */}
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#242D27] mb-1">
                    Postnummer *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={customer.postalCode}
                    onChange={handleInputChange}
                    placeholder="123 45"
                    className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] ${
                      validationErrors.postalCode ? 'border-[#8C5248]' : 'border-[#E6DFD3]'
                    }`}
                  />
                  {validationErrors.postalCode && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{validationErrors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242D27] mb-1">
                    Ort *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={customer.city}
                    onChange={handleInputChange}
                    placeholder="Din ort"
                    className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] ${
                      validationErrors.city ? 'border-[#8C5248]' : 'border-[#E6DFD3]'
                    }`}
                  />
                  {validationErrors.city && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{validationErrors.city}</p>
                  )}
                </div>
              </div>

              {/* Eventuella önskemål / meddelande */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Eventuella önskemål / meddelande
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={customer.message}
                  onChange={handleInputChange}
                  placeholder="Skriv gärna om du har särskilda färgönskemål, önskat datum för dop/födelsedag eller andra frågor."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Sammanfattning av förfrågan & Knapp (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#F3EFE8]/70 border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-6 sticky top-28">
            
            <h3 className="font-serif text-xl font-medium text-[#242D27] pb-3 border-b border-[#E6DFD3]">
              Sammanfattning av förfrågan
            </h3>

            {/* List of chosen products */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize || ''}`}
                  className="flex items-center justify-between text-xs py-2.5 border-b border-[#E6DFD3]/60 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.product.image || item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-[#FAF8F5] border border-[#E6DFD3] shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-medium text-[#242D27] truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[#66726A]">
                        Färg: <span className="font-medium text-[#242D27]">{item.selectedColor}</span>
                        {item.selectedSize && (
                          <> • Storlek: <span className="font-medium text-[#242D27]">{item.selectedSize}</span></>
                        )}
                        {' '}• {item.quantity} st
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#242D27] shrink-0 pl-2">
                    {item.product.price * item.quantity} kr
                  </span>
                </div>
              ))}
            </div>

            {/* Rabattkod i Checkout */}
            <div className="pt-3 border-t border-[#E6DFD3] space-y-2">
              <label htmlFor="checkout-discount-input" className="block text-xs font-semibold text-[#242D27]">
                Rabattkod
              </label>
              {appliedCode && discountResult?.valid ? (
                <div className="p-3 bg-[#EBF3EE] border border-[#CDE0D4] rounded-xl space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#526E5F] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Koden <strong className="font-mono">{appliedCode}</strong> är aktiv</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="text-xs text-[#8C5248] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Ta bort</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#526E5F]">
                    {appliedDiscount?.discountType === 'percentage'
                      ? `${appliedDiscount.discountValue} % rabatt tillämpad`
                      : `${appliedDiscount?.discountValue} kr rabatt tillämpad`}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#8C9B90] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="checkout-discount-input"
                        type="text"
                        placeholder="Ange rabattkod"
                        value={discountInput}
                        onChange={(e) => {
                          setDiscountInput(e.target.value.toUpperCase());
                          clearDiscountError();
                        }}
                        className="w-full uppercase font-mono font-medium bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-8 pr-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => applyDiscount()}
                      disabled={isApplying || !discountInput.trim()}
                      className="px-4 py-2 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#344038] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                    >
                      {isApplying ? '...' : 'Använd'}
                    </button>
                  </div>
                  {discountError && (
                    <p className="text-[11px] text-[#8C5248] font-medium pt-0.5 animate-fadeIn">
                      {discountError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Beräknad summa & prisöversikt */}
            <div className="pt-3 border-t border-[#E6DFD3] space-y-2">
              <div className="flex justify-between text-[#66726A] text-xs">
                <span>Beräknad varusumma</span>
                <span className="font-medium text-[#242D27]">{subtotal} kr</span>
              </div>

              {appliedCode && discountResult?.valid && discountResult.discountAmount > 0 ? (
                <div className="flex justify-between text-[#526E5F] font-medium text-xs">
                  <span className="flex items-center gap-1">
                    <span>Rabatt</span>
                    <span className="font-mono text-[11px] bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#CDE0D4]">
                      {appliedCode}
                    </span>
                  </span>
                  <span>−{discountResult.discountAmount} kr</span>
                </div>
              ) : null}

              <div className="flex justify-between text-[#66726A] text-xs">
                <span>Eventuell frakt</span>
                <span>Specificeras i svarsmejl</span>
              </div>

              <div className="pt-2 border-t border-[#E6DFD3] flex justify-between items-baseline">
                <div>
                  <span className="font-serif text-lg font-medium text-[#242D27] block">
                    Beräknad summa
                  </span>
                  {appliedCode && discountResult?.valid && (
                    <span className="text-[11px] text-[#526E5F] font-medium">Efter rabatt</span>
                  )}
                </div>
                <span className="text-2xl font-bold text-[#242D27]">
                  {appliedCode && discountResult?.valid
                    ? discountResult.totalAfterDiscount
                    : subtotal} kr
                </span>
              </div>
              <p className="text-[11px] text-[#66726A] font-light leading-relaxed">
                Pris inkl. material. Eventuell fraktkostnad specificeras i svarsmejlet.
              </p>
            </div>

            {/* Submit Button */}
            <div className="space-y-3 pt-2">
              {submitError && (
                <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#8C5248]/30 text-xs text-[#8C5248] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8C5248] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{submitError}</p>
                </div>
              )}
              <button
                id="submit-inquiry-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#242D27] text-[#FAF8F5] rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#6B8E7B] transition-all shadow-sm active:scale-[0.99] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span>Skickar förfrågan...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#FAF8F5]" />
                    <span>Skicka beställningsförfrågan</span>
                  </>
                )}
              </button>

              {/* Exact required notice under button */}
              <p className="text-xs text-center text-[#66726A] leading-relaxed font-light px-2">
                Detta är en beställningsförfrågan. Ingen betalning genomförs på webbplatsen. Jag återkommer personligen med information om beställningen, pris, eventuell frakt och betalning.
              </p>
            </div>

            {/* Trust and personal touch */}
            <div className="pt-4 border-t border-[#E6DFD3] text-xs text-[#66726A] space-y-1.5 font-light">
              <p className="flex items-center gap-1.5 text-[#242D27] font-medium">
                <Heart className="w-3.5 h-3.5 text-[#6B8E7B] fill-[#6B8E7B]" />
                <span>Handgjort på beställning</span>
              </p>
              <p>
                Jag återkommer personligen via e-post efter mottagen förfrågan.
              </p>
            </div>

          </div>
        </div>

      </form>

    </div>
  );
};
