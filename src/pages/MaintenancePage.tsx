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
      <header className="w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-tight text-[#242D27] font-semibold">
            Sagomaskan
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#526E5F] animate-pulse" />
            Ateljén uppdateras
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#EBF3EE] border border-[#CDE0D4] flex items-center justify-center text-[#526E5F] mb-8 shadow-xs">
          <Sparkles className="w-7 h-7 stroke-[1.5]" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] text-[#6B8E7B] font-semibold mb-3">
          Sagomaskan
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#242D27] font-medium tracking-tight leading-[1.2] mb-6">
          Vi arbetar just nu med vår webbplats.
        </h1>

        <p className="text-base sm:text-lg text-[#55625A] font-light max-w-lg leading-relaxed mb-10">
          Vi öppnar snart igen. Tack för ditt tålamod!
        </p>

        {/* Contact & Social Section */}
        <div className="w-full max-w-md p-6 rounded-2xl bg-[#F4F0E8] border border-[#E6DFD3] space-y-4 shadow-xs">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#66726A] uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-[#8C5248]" />
            <span>Behöver du nå oss under tiden?</span>
          </div>

          <p className="text-xs text-[#66726A] font-light leading-relaxed">
            Har du pågående förfrågningar eller frågor kring virkade produkter är du alltid välkommen att kontakta oss direkt.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {email && (
              <a
                href={`mailto:${email}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FFFFFF] border border-[#E0D8CA] text-xs font-medium text-[#242D27] transition-all shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-[#526E5F]" />
                <span>{email}</span>
              </a>
            )}

            {instagram && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FFFFFF] border border-[#E0D8CA] text-xs font-medium text-[#242D27] transition-all shadow-2xs"
              >
                <Instagram className="w-3.5 h-3.5 text-[#526E5F]" />
                <span>{instagram}</span>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Discreet Footer with Admin Link */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-8 border-t border-[#E6DFD3]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A958E]">
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
