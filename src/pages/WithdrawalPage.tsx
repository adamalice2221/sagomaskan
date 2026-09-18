import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Clock,
  Package,
  AlertCircle,
  HelpCircle,
  MailCheck
} from 'lucide-react';
import { createWithdrawal } from '../services/withdrawalsService';

interface WithdrawalPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

export const WithdrawalPage: React.FC<WithdrawalPageProps> = ({ onNavigateHome, onNavigateShop }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    id: string;
    orderNumber: string;
    emailSent: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!orderNumber.trim()) {
      setErrorMessage('Vänligen fyll i ditt ordernummer.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Vänligen fyll i ditt namn.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Vänligen ange en giltig e-postadress.');
      return;
    }
    if (!items.trim()) {
      setErrorMessage('Vänligen ange vilken eller vilka produkter ångern gäller.');
      return;
    }
    if (!confirmed) {
      setErrorMessage('Du behöver bekräfta att du vill utöva din ångerrätt genom att kryssa i rutan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createWithdrawal({
        orderNumber: orderNumber.trim(),
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        items: items.trim()
      });

      setSubmittedResult({
        id: result.id,
        orderNumber: orderNumber.trim(),
        emailSent: result.emailSent
      });
    } catch (err: any) {
      console.error('Fel vid ångeranmälan:', err);
      setErrorMessage('Ett oväntat fel uppstod när anmälan skulle skickas. Vänligen försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submittedResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#EBF3EE] text-[#526E5F] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
              Mottagen ångeranmälan
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium">
              Din ångeranmälan har skickats
            </h1>
            <p className="text-sm sm:text-base text-[#66726A] font-light max-w-lg mx-auto leading-relaxed">
              Vi har tagit emot ditt meddelande om att du vill ångra ditt köp för beställning <strong className="text-[#242D27]">{submittedResult.orderNumber}</strong>. Ett digitalt mottagningsbevis har skickats till <strong className="text-[#242D27]">{email}</strong>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between text-[#66726A]">
              <span>Referensnummer:</span>
              <span className="font-mono font-medium text-[#242D27]">{submittedResult.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[#66726A]">
              <span>Ordernummer:</span>
              <span className="font-medium text-[#242D27]">{submittedResult.orderNumber}</span>
            </div>
            <div className="flex justify-between text-[#66726A]">
              <span>Mottagningsbevis:</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#526E5F]">
                <MailCheck className="w-3.5 h-3.5" />
                <span>Skickat</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#EFF4F1] border border-[#D5E4DB] max-w-md mx-auto text-left text-xs text-[#2C3E33] space-y-1">
            <strong className="block font-medium">Nästa steg:</strong>
            <p className="font-light leading-relaxed">
              Observera att ångeranmälan och återbetalning är separata steg. Vi återkommer snarast med returinstruktioner. När vi mottagit och kontrollerat din retur hanteras eventuell återbetalning i enlighet med våra köpvillkor.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNavigateShop}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-colors"
            >
              Tillbaka till butiken
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#E6DFD3] text-[#242D27] text-xs font-medium hover:bg-[#F3EFE8] transition-colors"
            >
              Till startsidan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Konsumenträtt & information
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#242D27] font-medium">
          Ångra köp
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Du har som regel 14 dagars ångerrätt när du handlar på nätet. Du behöver inte ange någon anledning till att du vill ångra ditt köp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left: Information about right of withdrawal (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <h3 className="font-serif text-xl font-medium text-[#242D27] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#6B8E7B]" />
              <span>Hur ångerrätten fungerar</span>
            </h3>

            <div className="space-y-4 text-xs text-[#66726A]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-[#242D27] block font-medium">14 dagars ångerfrist</strong>
                  <span className="font-light leading-relaxed">
                    Ångerfristen börjar löpa dagen efter att du eller ett ombud tog emot eller hämtade ut varan.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-[#242D27] block font-medium">Ingen anledning krävs</strong>
                  <span className="font-light leading-relaxed">
                    Du har full frihet att ångra ditt köp utan att behöva motivera varför.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-[#242D27] block font-medium">Varans skick & returfrakt</strong>
                  <span className="font-light leading-relaxed">
                    Varan ska returneras i oförändrat skick och väl förpackad. Som kund står du normalt själv för returfrakten.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-1">
                <strong className="text-[#242D27] block font-medium">Standardvaror vs specialtillverkning</strong>
                <span className="font-light leading-relaxed">
                  Färdiga hantverksprodukter omfattas alltid av den vanliga 14-dagars ångerrätten. Undantag från ångerrätten gäller endast för varor som har specialtillverkats enligt dina personliga anvisningar eller försetts med en tydlig personlig prägel (t.ex. ett broderat namn eller ett måttanpassat motiv som tagits fram enbart för dig).
                </span>
              </div>
            </div>
          </div>

          {/* Konsumentverket standard form notice */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 space-y-3 shadow-xs">
            <h4 className="font-serif text-base font-medium text-[#242D27]">
              Konsumentverkets standardblankett
            </h4>
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Vårt digitala formulär här intill är det snabbaste sättet att anmäla ångrat köp. Om du föredrar att använda Konsumentverkets officiella standardblankett för ångerrätt kan du ladda ner den direkt från Konsumentverket.
            </p>
            <a
              href="https://publikationer.konsumentverket.se/kontrakt-och-mallar/standardblankett-for-angerratt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B8E7B] hover:underline pt-1"
            >
              <span>Konsumentverkets standardblankett (extern länk)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right: Digital Withdrawal Form (7 cols) */}
        <div className="md:col-span-7 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-serif text-xl font-medium text-[#242D27] flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#6B8E7B]" />
                <span>Digital ångeranmälan</span>
              </h3>
              <p className="text-xs text-[#66726A] font-light mt-1">
                Fyll i uppgifterna nedan så skickar vi omedelbart ett mottagningsbevis till din e-post.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Number */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Ordernummer *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="T.ex. #SAG-1234"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Ditt namn *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="För- och efternamn"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  E-postadress *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@exempel.se"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Telefonnummer <span className="text-[#8F9992] font-normal">(valfritt)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="070-123 45 67"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>

            {/* Which items */}
            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1">
                Vilken eller vilka produkter gäller ångern? *
              </label>
              <textarea
                required
                rows={3}
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="Ange produktnamn eller artikel (t.ex. Virkad skallra i björk/bomull, 1 st)..."
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Confirmation checkbox */}
            <div className="p-4 rounded-xl bg-[#F3EFE8]/70 border border-[#E6DFD3]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-[#D4CDC1] text-[#6B8E7B] focus:ring-[#6B8E7B]"
                />
                <span className="text-xs text-[#242D27] font-medium leading-relaxed">
                  Jag meddelar härmed att jag vill använda min ångerrätt för ovanstående köp. *
                </span>
              </label>
            </div>

            {/* Information note */}
            <p className="text-[11px] text-[#8F9992] leading-relaxed">
              Vi samlar endast in uppgifter som behövs för att administrera ditt årende och uppfylla lagstadgade krav om mottagningsbevis enligt distansavtalslagen.
            </p>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#242D27] text-[#FAF8F5] rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#6B8E7B] disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Skickar ångeranmälan...</span>
                  </>
                ) : (
                  <span>Skicka ångeranmälan</span>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
