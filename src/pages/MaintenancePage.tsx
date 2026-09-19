import React from 'react';
import { Mail, Instagram, Sparkles, Shield, Heart } from 'lucide-react';
import { useData } from '../context/DataContext';

interface MaintenancePageProps {
  onAdminLogin?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onAdminLogin }) => {
  const { settings } = useData();

  const email = settings.email || 'hello@sagomaskan.se';
  const instagram = settings.instagram || '@sagomaskan';
  const instagramUrl = settings.footerInstagramUrl || `https://instagram.com/${instagram.replace('@', '')}`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242D27] flex flex-col justify-between selection:bg-[#6B8E7B]/20 selection:text-[#242D27]">
      {/* Top Subtle Header */}
      <header className="w-full max-w-4xl mx-auto px-5 sm:px-6 py-5 sm:py-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xl sm:text-2xl tracking-tight text-[#242D27] font-semibold">
            Sagomaskan
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#526E5F] animate-pulse" />
            Ateljén uppdateras
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-6 py-6 sm:py-12 flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-[#EBF3EE] border border-[#CDE0D4] flex items-center justify-center text-[#526E5F] mb-4 sm:mb-8 shadow-xs">
          <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.5]" />
        </div>

        {/* Small Brand Eyebrow */}
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#6B8E7B] font-semibold mb-2 sm:mb-3">
          Sagomaskan
        </span>

        {/* Main Heading */}
        <h1 className="font-serif text-[30px] sm:text-4xl lg:text-5xl text-[#242D27] font-medium tracking-tight leading-[1.15] sm:leading-[1.2] max-w-lg mb-3 sm:mb-6">
          Sagomaskan öppnar snart igen
        </h1>

        {/* Subheading */}
        <div className="text-[16px] sm:text-lg text-[#55625A] font-light max-w-lg leading-snug sm:leading-relaxed space-y-1.5 sm:space-y-2 mb-6 sm:mb-10">
          <p>Jag gör just nu de sista detaljerna.</p>
          <p>Tack för att du väntar!</p>
        </div>

        {/* Contact & Social Section Card */}
        <div className="w-full max-w-md p-4 sm:p-6 rounded-2xl bg-[#F4F0E8] border border-[#E6DFD3] space-y-3 sm:space-y-4 shadow-xs">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-[#66726A] uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-[#8C5248] shrink-0" />
            <span>Behöver du nå oss under tiden?</span>
          </div>

          <p className="text-xs text-[#66726A] font-light leading-relaxed [text-wrap:balance] max-w-sm mx-auto">
            Har du pågående förfrågningar eller frågor kring virkade produkter är du alltid välkommen att kontakta oss direkt.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            {email && (
              <a
                href={`mailto:${email}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FFFFFF] active:bg-[#F3EFE8] border border-[#E0D8CA] text-xs font-medium text-[#242D27] transition-all shadow-2xs break-all"
              >
                <Mail className="w-3.5 h-3.5 text-[#526E5F] shrink-0" />
                <span className="truncate max-w-[240px] sm:max-w-none">{email}</span>
              </a>
            )}

            {instagram && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FFFFFF] active:bg-[#F3EFE8] border border-[#E0D8CA] text-xs font-medium text-[#242D27] transition-all shadow-2xs"
              >
                <Instagram className="w-3.5 h-3.5 text-[#526E5F] shrink-0" />
                <span>{instagram}</span>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Discreet Footer with Admin Link */}
      <footer className="w-full max-w-4xl mx-auto px-5 sm:px-6 py-5 sm:py-8 border-t border-[#E6DFD3]/60 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#8A958E]">
        <p>© {new Date().getFullYear()} Sagomaskan. Handgjorda virkade alster.</p>

        {onAdminLogin && (
          <button
            onClick={onAdminLogin}
            className="inline-flex items-center gap-1.5 text-xs text-[#8A958E] hover:text-[#242D27] transition-colors cursor-pointer"
          >
            <Shield className="w-3 h-3 text-[#A0ACA4]" />
            <span>Administratörsinloggning</span>
          </button>
        )}
      </footer>
    </div>
  );
};
