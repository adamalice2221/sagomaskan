import React, { useState } from 'react';
import { Instagram, Mail, CheckCircle2 } from 'lucide-react';
import { PageRoute } from '../types';
import { useData } from '../context/DataContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
  isHomePage?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, settingsLoaded } = useData();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMessage('Vänligen ange en giltig e-postadress.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, consent: true }),
      });
    } catch {
      // Graceful fallback if offline or server is unreachable
    }

    try {
      const existing = JSON.parse(localStorage.getItem('sagomaskan_subscribers') || '[]');
      if (!existing.includes(trimmed)) {
        existing.push(trimmed);
        localStorage.setItem('sagomaskan_subscribers', JSON.stringify(existing));
      }
    } catch {
      // ignore storage errors
    }

    setIsSubscribed(true);
    setEmail('');
    setIsSubmitting(false);
  };

  const resolveLinkUrl = (target: string): { url: string; isExternal: boolean; route?: PageRoute } => {
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:')) {
      return { url: target, isExternal: true };
    }
    const route = target as PageRoute;
    return { url: getPageUrl(route), isExternal: false, route };
  };

  const brandName = settings.footerBrandName || 'SAGOMASKAN';
  const tagline = settings.footerTagline || 'VIRKADE PRODUKTER';
  const description = settings.footerDescription || 'Handgjorda virkade produkter, skapade med omsorg och glädje.';

  const pageLinks = settings.footerPageLinks || [
    { label: 'Hem', href: 'home', enabled: true },
    { label: 'Shop', href: 'shop', enabled: true },
    { label: 'Om mig', href: 'about', enabled: true },
    { label: 'Kontakt', href: 'contact', enabled: true },
  ];

  const defaultInfoLinks = [
    { label: 'Frakt & leverans', href: 'shipping', enabled: true },
    { label: 'Köpvillkor', href: 'terms', enabled: true },
    { label: 'Ångra köp', href: 'angra-kop', enabled: true },
    { label: 'Reklamation', href: 'reklamation', enabled: true },
    { label: 'FAQ', href: 'faq', enabled: true },
  ];

  const configuredInfoLinks = settings.footerInfoLinks || defaultInfoLinks;
  const hasReklamation = configuredInfoLinks.some((l) => l.href === 'reklamation');
  const hasAngraKop = configuredInfoLinks.some((l) => l.href === 'angra-kop');
  const infoLinks = [
    ...configuredInfoLinks,
    ...(!hasAngraKop ? [{ label: 'Ångra köp', href: 'angra-kop', enabled: true }] : []),
    ...(!hasReklamation ? [{ label: 'Reklamation', href: 'reklamation', enabled: true }] : []),
  ];

  const instagramLabel = settings.footerInstagramLabel || 'Instagram';
  const instagramUrl = settings.footerInstagramUrl || 'https://instagram.com/sagomaskan';
  const instagramEnabled = settings.footerInstagramEnabled !== false;

  const emailLabel = settings.footerEmailLabel || 'E-post';
  const emailAddress = settings.footerEmail || settings.email || 'hello@sagomaskan.se';

  const contactLabel = settings.footerContactLabel || 'Kontakt';
  const contactUrl = settings.footerContactUrl || 'contact';
  const contactEnabled = settings.footerContactEnabled !== false;

  const copyright = settings.footerCopyright || '© Sagomaskan. Alla rättigheter reserverade.';
  const signature = settings.footerSignature || 'Små maskor – stora leenden. ♡';
  const showAdminLink = settings.footerShowAdminLink === true;

  if (!settingsLoaded) {
    return (
      <footer id="main-footer" className="bg-[#F3EFE8] text-[#242D27] border-t border-[#E6DFD3] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-5 gap-x-3 sm:gap-x-6 md:gap-x-10 lg:gap-x-12 gap-y-10 lg:gap-y-12 mb-16">
            <div className="col-span-3 md:col-span-1 lg:col-span-2 space-y-4">
              <div className="h-8 bg-[#E6DFD3]/50 animate-pulse rounded-md w-48 max-w-full" />
              <div className="h-4 bg-[#E6DFD3]/40 animate-pulse rounded-md w-64 max-w-full" />
              <div className="h-10 bg-[#E6DFD3]/30 rounded-xl w-full max-w-sm animate-pulse mt-4" />
            </div>
            <div className="col-span-1 space-y-3 min-w-0">
              <div className="h-5 bg-[#E6DFD3]/50 animate-pulse rounded-md w-16 max-w-full" />
              <div className="h-4 bg-[#E6DFD3]/30 animate-pulse rounded-md w-20 max-w-full" />
              <div className="h-4 bg-[#E6DFD3]/30 animate-pulse rounded-md w-14 max-w-full" />
            </div>
            <div className="col-span-1 space-y-3 min-w-0">
              <div className="h-5 bg-[#E6DFD3]/50 animate-pulse rounded-md w-16 max-w-full" />
              <div className="h-4 bg-[#E6DFD3]/30 animate-pulse rounded-md w-20 max-w-full" />
            </div>
            <div className="col-span-1 space-y-3 min-w-0">
              <div className="h-5 bg-[#E6DFD3]/50 animate-pulse rounded-md w-16 max-w-full" />
              <div className="h-4 bg-[#E6DFD3]/30 animate-pulse rounded-md w-20 max-w-full" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const instagramHandle = settings.instagram || '@sagomaskan';

  return (
    <footer id="main-footer" className="bg-[#F3EFE8] text-[#242D27] border-t border-[#E6DFD3] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        
        {/* Main Grid: Mobile (Brand full-width, then 3 columns), Tablet (2 cols), Desktop (5 cols) */}
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-5 gap-x-3 sm:gap-x-6 md:gap-x-10 lg:gap-x-12 gap-y-10 lg:gap-y-12 mb-16">
          
          {/* Brand Presentation & Integrated Newsletter in Left Column */}
          <div className="col-span-3 md:col-span-1 lg:col-span-2 space-y-5">
            <a
              href={getPageUrl('home')}
              onClick={(e) => {
                if (!isModifiedClick(e)) {
                  e.preventDefault();
                  onNavigate('home');
                }
              }}
              className="inline-block group focus:outline-none cursor-pointer"
            >
              {settings.logoImageUrl ? (
                <img src={settings.logoImageUrl} alt={brandName} className="h-10 sm:h-12 object-contain mb-1" />
              ) : (
                <span className="font-serif text-2xl tracking-[0.2em] uppercase font-medium block group-hover:text-[#6B8E7B] transition-colors">
                  {brandName}
                </span>
              )}
              {tagline && (
                <p className="text-[10px] tracking-[0.25em] text-[#66726A] uppercase">
                  {settings.logoTagline ?? tagline}
                </p>
              )}
            </a>
            
            {description && (
              <p className="text-sm text-[#66726A] max-w-sm leading-relaxed font-light">
                {description}
              </p>
            )}

            <div className="flex items-center space-x-4 pt-1">
              {instagramEnabled && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-[#FAF8F5] text-[#242D27] hover:text-[#6B8E7B] hover:bg-[#FAF8F5]/80 transition-colors shadow-xs cursor-pointer"
                  aria-label={`Följ ${brandName} på Instagram`}
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {emailAddress && (
                <a
                  href={`mailto:${emailAddress}`}
                  className="p-2 rounded-full bg-[#FAF8F5] text-[#242D27] hover:text-[#6B8E7B] hover:bg-[#FAF8F5]/80 transition-colors shadow-xs cursor-pointer"
                  aria-label={`Skicka e-post till ${brandName}`}
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {instagramHandle && (
                <span className="text-xs text-[#66726A] font-light">
                  {instagramHandle}
                </span>
              )}
            </div>

            {/* Newsletter Section Integrated in Left Column under Social Icons */}
            <div className="pt-2 space-y-2.5 max-w-sm">
              <div className="space-y-1">
                <h4 className="font-serif text-sm sm:text-base text-[#242D27] font-medium leading-snug">
                  Prenumerera på vårt nyhetsbrev för nyheter och erbjudanden
                </h4>
                <p className="text-xs text-[#66726A] font-light leading-relaxed">
                  Få inspiration och uppdateringar om nya handvirkade kreationer och hantverkstips.
                </p>
              </div>

              {isSubscribed ? (
                <div
                  id="newsletter-success-message"
                  className="inline-flex items-center gap-2 bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] px-4 py-2.5 rounded-xl text-xs shadow-2xs font-medium animate-in fade-in"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#6B8E7B] shrink-0" />
                  <span>Tack för att du prenumererar! Välkommen till Sagomaskan. ♡</span>
                </div>
              ) : (
                <form
                  id="footer-newsletter-form"
                  onSubmit={handleSubscribe}
                  className="pt-1 w-full space-y-2"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0">
                    <input
                      type="email"
                      id="newsletter-email-input"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="Din e-postadress"
                      aria-label="E-postadress för nyhetsbrev"
                      required
                      className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl sm:rounded-r-none border border-[#D4CBBF] bg-[#FAF8F5] text-xs text-[#242D27] placeholder:text-[#66726A]/70 focus:outline-none focus:border-[#6B8E7B] focus:ring-1 focus:ring-[#6B8E7B] shadow-2xs transition-colors"
                    />
                    <button
                      type="submit"
                      id="newsletter-subscribe-btn"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl sm:rounded-l-none bg-[#6B8E7B] hover:bg-[#587565] disabled:bg-[#A5B7AC] text-white text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-xs whitespace-nowrap active:scale-[0.99] min-h-[38px]"
                    >
                      {isSubmitting ? 'Skickar...' : 'Prenumerera'}
                    </button>
                  </div>
                  {errorMessage && (
                    <p className="text-xs text-red-600 bg-red-50/80 border border-red-200 p-2 rounded-lg text-left font-light animate-in fade-in">
                      {errorMessage}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Kolumn 1 - Sidor */}
          <div className="col-span-1 space-y-4 min-w-0">
            <h4 className="text-xs tracking-widest uppercase font-semibold text-[#242D27]">
              Sidor
            </h4>
            <ul className="space-y-2.5 text-sm">
              {pageLinks
                .filter((link) => link.enabled !== false)
                .map((link, idx) => {
                  const resolved = resolveLinkUrl(link.href);
                  return (
                    <li key={idx}>
                      <a
                        href={resolved.url}
                        target={resolved.isExternal ? '_blank' : undefined}
                        rel={resolved.isExternal ? 'noreferrer' : undefined}
                        onClick={(e) => {
                          if (!resolved.isExternal && resolved.route && !isModifiedClick(e)) {
                            e.preventDefault();
                            onNavigate(resolved.route);
                          }
                        }}
                        className="text-[#66726A] hover:text-[#242D27] transition-colors focus:outline-none cursor-pointer block leading-snug"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Kolumn 2 - Information */}
          <div className="col-span-1 space-y-4 min-w-0">
            <h4 className="text-xs tracking-widest uppercase font-semibold text-[#242D27]">
              Information
            </h4>
            <ul className="space-y-2.5 text-sm">
              {infoLinks
                .filter((link) => link.enabled !== false)
                .map((link, idx) => {
                  const resolved = resolveLinkUrl(link.href);
                  return (
                    <li key={idx}>
                      <a
                        href={resolved.url}
                        target={resolved.isExternal ? '_blank' : undefined}
                        rel={resolved.isExternal ? 'noreferrer' : undefined}
                        onClick={(e) => {
                          if (!resolved.isExternal && resolved.route && !isModifiedClick(e)) {
                            e.preventDefault();
                            onNavigate(resolved.route);
                          }
                        }}
                        className="text-[#66726A] hover:text-[#242D27] transition-colors focus:outline-none cursor-pointer block leading-snug"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Kolumn 3 - Kontakt & Följ */}
          <div className="col-span-1 space-y-4 min-w-0">
            <h4 className="text-xs tracking-widest uppercase font-semibold text-[#242D27]">
              Kontakt & Följ
            </h4>
            <ul className="space-y-2.5 text-sm">
              {instagramEnabled && (
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#66726A] hover:text-[#242D27] transition-colors inline-flex items-center gap-1.5 min-w-0"
                  >
                    <Instagram className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{instagramLabel}</span>
                  </a>
                </li>
              )}
              {contactEnabled && (
                <li>
                  <a
                    href={getPageUrl('contact')}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        onNavigate('contact');
                      }
                    }}
                    className="text-[#66726A] hover:text-[#242D27] transition-colors focus:outline-none inline-flex items-center gap-1.5 cursor-pointer min-w-0"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{contactLabel}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E6DFD3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#66726A]">
          <div className="flex items-center gap-4">
            <p>{copyright}</p>
            {showAdminLink && (
              <a
                href={getPageUrl('admin')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('admin');
                  }
                }}
                className="text-[11px] text-[#8C9B90] hover:text-[#242D27] underline transition-colors cursor-pointer"
              >
                Admin
              </a>
            )}
          </div>
          
          {signature && (
            <p className="font-serif italic text-sm text-[#242D27] flex items-center gap-1.5">
              <span>{signature}</span>
            </p>
          )}
        </div>

      </div>
    </footer>
  );
};
