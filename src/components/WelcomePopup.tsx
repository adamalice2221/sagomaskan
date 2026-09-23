import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Sparkles, Check, Copy, Heart, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';

const DISMISS_DURATION_DAYS = 14;
const DISMISS_DURATION_MS = DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
const DELAY_BEFORE_OPEN_MS = 4000;

export const WelcomePopup: React.FC = () => {
  const { settings, settingsLoaded } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if popup should be shown
  useEffect(() => {
    // Wait until settings are loaded
    if (!settingsLoaded && settings === null) return;

    // Check if popup is enabled in admin settings
    const isEnabled = settings?.welcomePopupEnabled === true;
    if (!isEnabled) {
      setIsOpen(false);
      return;
    }

    // Check if user has already subscribed
    try {
      const alreadySubscribed = localStorage.getItem('sagomaskan_welcome_popup_subscribed');
      if (alreadySubscribed === 'true') {
        return;
      }

      // Check if user recently dismissed the popup
      const dismissedTimestamp = localStorage.getItem('sagomaskan_welcome_popup_dismissed');
      if (dismissedTimestamp) {
        const timePassed = Date.now() - parseInt(dismissedTimestamp, 10);
        if (!isNaN(timePassed) && timePassed < DISMISS_DURATION_MS) {
          return;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }

    // Delay showing popup smoothly after initial page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, DELAY_BEFORE_OPEN_MS);

    return () => clearTimeout(timer);
  }, [settingsLoaded, settings?.welcomePopupEnabled]);

  // Handle closing popup (records dismissal in localStorage)
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (!isSuccess) {
      try {
        localStorage.setItem('sagomaskan_welcome_popup_dismissed', Date.now().toString());
      } catch {
        // Ignore localStorage write errors
      }
    }
  }, [isSuccess]);

  // ESC key listener & Background scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Vänligen ange en giltig e-postadress.');
      return;
    }

    if (!consent) {
      setErrorMessage('Du måste godkänna samtycket för att ta del av erbjudandet.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          consent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setErrorMessage(data?.error || 'Kunde inte registrera e-postadressen. Försök igen.');
        setLoading(false);
        return;
      }

      // Mark as subscribed in localStorage so popup never displays again
      try {
        localStorage.setItem('sagomaskan_welcome_popup_subscribed', 'true');
        // Also clean up any old dismissal timestamp
        localStorage.removeItem('sagomaskan_welcome_popup_dismissed');
      } catch {
        // Ignore localStorage error
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('[WelcomePopup] Registreringsfel:', err);
      setErrorMessage('Ett nätverksfel uppstod. Vänligen kontrollera din anslutning och försök igen.');
    } finally {
      setLoading(false);
    }
  };

  // Copy discount code
  const discountCode = settings?.welcomePopupDiscountCode?.trim() || 'VÄLKOMMEN10';
  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(discountCode);
      } else {
        const input = document.createElement('input');
        input.value = discountCode;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  const title = settings?.welcomePopupTitle?.trim() || 'Välkommen till Sagomaskan ♡';
  const discountText = settings?.welcomePopupDiscountText?.trim() || 'Få 10 % på din första beställning';
  const imageSrc = settings?.welcomePopupImageUrl?.trim() || '/hero-craft-banner.webp';

  return (
    <div
      id="welcome-popup-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <div
        id="welcome-popup-card"
        className="relative w-full max-w-2xl lg:max-w-3xl bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) */}
        <button
          type="button"
          id="welcome-popup-close-btn"
          onClick={handleClose}
          aria-label="Stäng välkomst-popup"
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-[#FAF8F5]/90 hover:bg-[#EFEAE1] text-[#66726A] hover:text-[#242D27] border border-[#E6DFD3]/80 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Warm Sagomaskan Image - hidden under 390px for compact view, preserved on 390px+ */}
        <div className="hidden min-[390px]:block relative w-full md:w-5/12 h-36 sm:h-44 md:h-auto shrink-0 overflow-hidden bg-[#F3EFE8]">
          <img
            src={imageSrc}
            alt="Sagomaskan handgjorda alster"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // Fallback to local hero banner if custom URL fails
              const target = e.currentTarget;
              if (target.src !== '/hero-craft-banner.webp' && target.src !== '/hero-craft-banner.jpg') {
                target.src = '/hero-craft-banner.webp';
              }
            }}
          />
          {/* Subtle warm overlay */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5]/95 backdrop-blur-xs border border-[#E6DFD3] text-[11px] font-medium text-[#526E5F] shadow-2xs">
            <Heart className="w-3 h-3 text-[#6B8E7B] fill-[#6B8E7B]" />
            <span>Handgjort med kärlek</span>
          </div>
        </div>

        {/* Right Side: Content & Form / Success */}
        <div className="w-full md:w-7/12 p-4 min-[390px]:p-5 sm:p-7 md:p-8 flex flex-col justify-center overflow-y-auto">
          {!isSuccess ? (
            <div className="space-y-3 min-[390px]:space-y-4 sm:space-y-5">
              {/* Badge */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 min-[390px]:px-3 py-0.5 min-[390px]:py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[10px] min-[390px]:text-[11px] font-semibold text-[#526E5F]">
                  <Sparkles className="w-3 h-3 text-[#6B8E7B]" />
                  <span>Välkomsterbjudande</span>
                </span>
              </div>

              {/* Title & Offer */}
              <div className="space-y-1">
                <h2
                  id="welcome-popup-title"
                  className="font-serif text-xl min-[390px]:text-2xl sm:text-3xl text-[#242D27] font-medium leading-tight"
                >
                  {title}
                </h2>
                <p className="text-sm min-[390px]:text-base sm:text-lg font-medium text-[#526E5F]">
                  {discountText}
                </p>
                <p className="text-xs sm:text-sm text-[#66726A] font-light leading-relaxed">
                  Få en rabattkod direkt och ta del av nyheter, handvirkad inspiration och exklusiva erbjudanden.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 min-[390px]:space-y-3.5 pt-0.5">
                <div>
                  <label htmlFor="welcome-email-input" className="sr-only">
                    Din e-postadress
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#66726A]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="welcome-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Din e-postadress"
                      className="w-full pl-10 pr-4 py-2.5 min-[390px]:py-3 rounded-xl border border-[#E6DFD3] bg-white text-xs min-[390px]:text-sm text-[#242D27] placeholder:text-[#66726A]/70 focus:outline-none focus:border-[#6B8E7B] focus:ring-2 focus:ring-[#6B8E7B]/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* GDPR Consent Checkbox */}
                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    id="welcome-consent-checkbox"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 min-[390px]:h-4 min-[390px]:w-4 rounded border-[#D4CBBF] text-[#6B8E7B] focus:ring-[#6B8E7B] cursor-pointer accent-[#6B8E7B] shrink-0"
                  />
                  <label
                    htmlFor="welcome-consent-checkbox"
                    className="text-[11px] min-[390px]:text-xs text-[#66726A] font-light leading-snug min-[390px]:leading-relaxed cursor-pointer select-none"
                  >
                    Ja, jag vill få Sagomaskans nyheter och erbjudanden via e-post.
                  </label>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-600 bg-red-50/80 border border-red-200 p-2 min-[390px]:p-2.5 rounded-lg leading-tight animate-in fade-in">
                    {errorMessage}
                  </p>
                )}

                {/* Primary Button */}
                <button
                  type="submit"
                  id="welcome-popup-submit-btn"
                  disabled={loading}
                  className="w-full py-2.5 min-[390px]:py-3 px-6 rounded-xl bg-[#6B8E7B] hover:bg-[#587565] disabled:bg-[#A5B7AC] text-white font-medium text-xs min-[390px]:text-sm transition-all duration-200 shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Hämtar rabatt...</span>
                    </span>
                  ) : (
                    <>
                      <span>Få min rabatt</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Discrete close action */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-[11px] min-[390px]:text-xs text-[#8C9890] hover:text-[#66726A] hover:underline cursor-pointer transition-colors"
                  >
                    Nej tack, jag fortsätter utan rabatt
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Success View */
            <div className="space-y-4 min-[390px]:space-y-5 py-2 text-center sm:text-left animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-10 h-10 min-[390px]:w-12 min-[390px]:h-12 rounded-2xl bg-[#EBF3EE] text-[#6B8E7B] border border-[#CDE0D4] shadow-2xs">
                <Heart className="w-5 h-5 min-[390px]:w-6 min-[390px]:h-6 fill-[#6B8E7B]" />
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-xl min-[390px]:text-2xl sm:text-3xl text-[#242D27] font-medium leading-tight">
                  Din rabatt är redo! ♡
                </h2>
                <p className="text-xs sm:text-sm text-[#66726A] font-light leading-relaxed">
                  Tack för att du anmälde dig! Använd koden nedan i kassan för att ta del av ditt välkomsterbjudande:
                </p>
              </div>

              {/* Discount Code Box */}
              <div className="bg-[#F3EFE8] border-2 border-dashed border-[#D4CBBF] rounded-2xl p-3.5 min-[390px]:p-4 sm:p-5 text-center space-y-2.5 min-[390px]:space-y-3">
                <div className="text-[10px] min-[390px]:text-xs uppercase tracking-widest text-[#66726A] font-semibold">
                  Din rabattkod
                </div>
                <div className="font-mono text-xl min-[390px]:text-2xl sm:text-3xl font-bold tracking-wider text-[#242D27] select-all">
                  {discountCode}
                </div>
                <button
                  type="button"
                  id="welcome-popup-copy-btn"
                  onClick={handleCopyCode}
                  className={`inline-flex items-center justify-center gap-2 px-4 min-[390px]:px-5 py-2 min-[390px]:py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${
                    copied
                      ? 'bg-[#526E5F] text-white'
                      : 'bg-[#6B8E7B] hover:bg-[#587565] text-white active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Kopierad till urklipp!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Kopiera kod</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-1 min-[390px]:pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 min-[390px]:py-3 px-6 rounded-xl bg-[#242D27] hover:bg-[#38433C] text-white font-medium text-xs min-[390px]:text-sm transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Börja upptäcka hantverken</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
