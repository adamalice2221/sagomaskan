import React from 'react';
import { PageRoute } from '../types';
import { Info } from 'lucide-react';
import { useData } from '../context/DataContext';

interface TermsPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const { settings, settingsLoaded } = useData();

  const sections = settings.termsSections && settings.termsSections.length > 0
    ? settings.termsSections
    : [
        {
          title: '1. Om verksamheten',
          content: 'Sagomaskan drivs som en personlig hobbyverksamhet. Alla produkter virkas för hand med omsorg och glädje. Webbplatsen fungerar som en produktkatalog och ett verktyg för att skicka en beställningsförfrågan.'
        },
        {
          title: '2. Beställningsförfrågan & ingen betalning på webbplatsen',
          content: 'En beställningsförfrågan via formuläret innebär inte ett slutfört köp eller någon direkt betalning. Jag återkommer personligen via e-post med information om produkten, eventuell tillverkningstid, frakt och hur betalning sker.'
        },
        {
          title: '3. Tillverkning & unika egenskaper',
          content: 'Eftersom varje produkt är handvirkad har varje exemplar sin egen karaktär och personlighet. Vissa produkter finns färdiga i ateljén medan andra virkas efter din beställning.'
        },
        {
          title: '4. Personlig kontakt och frågor',
          content: 'Har du frågor kring en produkt, önskemål om färg eller annat är du alltid varmt välkommen att höra av dig. Vi har en öppen och personlig dialog kring varje förfrågan.'
        }
      ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Information
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#242D27] font-medium">
          Villkor & Beställningsförfrågan
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Information om hur beställningsförfrågningar hanteras hos Sagomaskan.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 space-y-8 text-sm text-[#66726A] font-light leading-relaxed">
        {!settingsLoaded ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-[#E6DFD3]/60 animate-pulse rounded" />
              <div className="h-4 w-full bg-[#E6DFD3]/40 animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-[#E6DFD3]/40 animate-pulse rounded" />
            </div>
            <div className="space-y-2 pt-4 border-t border-[#E6DFD3]">
              <div className="h-6 w-56 bg-[#E6DFD3]/60 animate-pulse rounded" />
              <div className="h-4 w-full bg-[#E6DFD3]/40 animate-pulse rounded" />
            </div>
          </div>
        ) : (
          sections.map((sec, idx) => (
            <section key={idx} className={`space-y-3 ${idx > 0 ? 'border-t border-[#E6DFD3] pt-6' : ''}`}>
              <h2 className="font-serif text-2xl font-medium text-[#242D27]">
                {sec.title}
              </h2>
              <p className="whitespace-pre-line">{sec.content}</p>
            </section>
          ))
        )}
      </div>

      {/* Informational banner */}
      <div className="p-6 rounded-2xl bg-[#EFF4F1] border border-[#6B8E7B]/25 text-xs text-[#526E5F] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>En beställningsförfrågan innebär ingen betalning.</strong> Jag återkommer personligen med information om produkten, pris, eventuell frakt och betalning.
        </p>
      </div>

      {/* Customer Service Fast Links for Claims & Right of Withdrawal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3">
          <h3 className="font-serif text-lg font-medium text-[#242D27]">
            Ångerrätt (14 dagar)
          </h3>
          <p className="text-xs text-[#66726A] font-light leading-relaxed">
            Som konsument har du 14 dagars lagstadgad ångerrätt från mottagandet utan att behöva ange någon anledning. Gäller färdiga produkter (ej varor som specialtillverkats med personlig prägel).
          </p>
          <button
            type="button"
            onClick={() => onNavigate('angra-kop')}
            className="text-xs font-medium text-[#6B8E7B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Gå till ångeranmälan &rarr;</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3">
          <h3 className="font-serif text-lg font-medium text-[#242D27]">
            Reklamation (3 år)
          </h3>
          <p className="text-xs text-[#66726A] font-light leading-relaxed">
            Du har 3 års lagstadgad reklamationsrätt för ursprungliga fel enligt konsumentköplagen. Reklamation inom 2 månader från att felet upptäcktes räknas alltid som lämnad i rätt tid.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('reklamation')}
            className="text-xs font-medium text-[#6B8E7B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Gå till reklamationsformulär &rarr;</span>
          </button>
        </div>
      </div>

    </div>
  );
};
