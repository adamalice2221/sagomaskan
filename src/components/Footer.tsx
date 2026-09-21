import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { PageRoute } from '../types';
import { useData } from '../context/DataContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, settingsLoaded } = useData();

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
      <footer id="main-footer" className="bg-[#F3EFE8] text-[#242D27] border-t border-[#E6DFD3] pt-16 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-5 gap-x-3 sm:gap-x-6 md:gap-x-10 lg:gap-x-12 gap-y-10 lg:gap-y-12 mb-16">
            <div className="col-span-3 md:col-span-1 lg:col-span-2 space-y-4">
              <div className="h-8 bg-[#E6DFD3]/50 animate-pulse rounded-md w-48 max-w-full" />
              <div className="h-4 bg-[#E6DFD3]/40 animate-pulse rounded-md w-64 max-w-full" />
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
    <footer id="main-footer" className="bg-[#F3EFE8] text-[#242D27] border-t border-[#E6DFD3] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Mobile (Brand full-width, then 3 columns), Tablet (2 cols), Desktop (5 cols) */}
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-5 gap-x-3 sm:gap-x-6 md:gap-x-10 lg:gap-x-12 gap-y-10 lg:gap-y-12 mb-16">
          
          {/* Brand Presentation (full width on mobile, 1 col on md, 2 cols on lg) */}
          <div className="col-span-3 md:col-span-1 lg:col-span-2 space-y-4">
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
                  className="p-2 rounded-full bg-[#FAF8F5] text-[#242D27] hover:text-[#6B8E7B] hover:bg-[#FAF8F5]/80 transition-colors shadow-xs"
                  aria-label={`Följ ${brandName} på Instagram`}
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {emailAddress && (
                <a
                  href={`mailto:${emailAddress}`}
                  className="p-2 rounded-full bg-[#FAF8F5] text-[#242D27] hover:text-[#6B8E7B] hover:bg-[#FAF8F5]/80 transition-colors shadow-xs"
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
