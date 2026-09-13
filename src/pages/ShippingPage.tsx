import React from 'react';
import { Scissors, Heart, Clock, MessageSquare, Info } from 'lucide-react';
import { PageRoute } from '../types';
import { useData } from '../context/DataContext';

interface ShippingPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const ShippingPage: React.FC<ShippingPageProps> = ({ onNavigate }) => {
  const { settings, settingsLoaded } = useData();

  const sections = settings.shippingSections && settings.shippingSections.length > 0
    ? settings.shippingSections
    : [
        {
          title: 'Hur leveransen går till',
          content: 'Efter att du skickat in din beställningsförfrågan går jag igenom om produkten finns färdig eller om den behöver virkas efter dina önskemål.\n\nJag återkommer till dig via e-post med information om beräknad tillverkningstid, aktuell fraktkostnad baserat på paketets storlek samt betalningsinformation.\n\nVarje paket packas varsamt så att dina handvirkade alster kommer fram hela, rena och fina.'
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
          Leverans & Hantverk
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Sagomaskan är en personlig hobbyverksamhet där varje föremål virkas för hand med omsorg och glädje.
        </p>
      </div>

      {/* 4 True Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center mx-auto">
            <Scissors className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-medium text-[#242D27]">
            Handgjort
          </h3>
          <p className="text-xs text-[#66726A] font-light">
            Varje produkt virkas för hand.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center mx-auto">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-medium text-[#242D27]">
            Skapat med omsorg
          </h3>
          <p className="text-xs text-[#66726A] font-light">
            Jag lägger tid och omsorg på varje beställning.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-medium text-[#242D27]">
            På beställning
          </h3>
          <p className="text-xs text-[#66726A] font-light">
            Vissa produkter virkas efter din beställning.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-medium text-[#242D27]">
            Personlig kontakt
          </h3>
          <p className="text-xs text-[#66726A] font-light">
            Du får personlig kontakt genom hela beställningsprocessen.
          </p>
        </div>
      </div>

      {/* Process explanation */}
      {!settingsLoaded ? (
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="h-6 w-48 bg-[#E6DFD3]/60 animate-pulse rounded" />
          <div className="h-4 w-full bg-[#E6DFD3]/40 animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-[#E6DFD3]/40 animate-pulse rounded" />
        </div>
      ) : (
        sections.map((section, idx) => (
          <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-2xl text-[#242D27] font-medium border-b border-[#E6DFD3] pb-4">
              {section.title}
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-[#66726A] font-light leading-relaxed whitespace-pre-line">
              <p>{section.content}</p>
            </div>
          </div>
        ))
      )}

      {/* Informational reassurance notice */}
      <div className="p-6 rounded-2xl bg-[#EFF4F1] border border-[#6B8E7B]/25 text-xs text-[#526E5F] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Ingen bindande betalning vid förfrågan:</strong> En beställningsförfrågan innebär ingen betalning. Jag återkommer personligen med information om produkten, pris, eventuell frakt och betalning innan du bestämmer dig.
        </p>
      </div>

    </div>
  );
};
