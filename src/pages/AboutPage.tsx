import React from 'react';
import { ArrowRight, Heart, Scissors, Sparkles, MessageSquare, Info, Palette } from 'lucide-react';
import { PageRoute } from '../types';
import { useData } from '../context/DataContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface AboutPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { settings, settingsLoaded } = useData();

  const storyParagraphs = settings.aboutStoryParagraphs && settings.aboutStoryParagraphs.length > 0
    ? settings.aboutStoryParagraphs
    : [
        'Jag tycker om att skapa saker som känns personliga, mysiga och gjorda för att användas och uppskattas länge.',
        'Sagomaskan drivs som en personlig hobbyverksamhet. Här hittar du inga maskintillverkade produkter eller massupplagor. Från det första varvet till den sista fästa tråden görs allt för hand med virknål, garn och tålamod.',
        'Vissa produkter finns färdiga i ett fåtal exemplar, medan andra virkas efter att du har skickat in din förfrågan. Du är alltid välkommen att ställa frågor om färgval eller önskemål.'
      ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      
      {/* 3. Hero / Intro */}
      <section className="text-center max-w-2xl mx-auto space-y-4 pt-2 sm:pt-4">
        {/* Handcrafted yarn stitch accent */}
        <div className="inline-flex items-center justify-center gap-2 text-[#6B8E7B] mb-1" aria-hidden="true">
          <span className="w-6 h-[1.5px] bg-[#6B8E7B]/30 rounded-full" />
          <svg className="w-10 h-3 text-[#6B8E7B]" viewBox="0 0 40 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 6c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
          </svg>
          <span className="w-6 h-[1.5px] bg-[#6B8E7B]/30 rounded-full" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#242D27] font-medium tracking-tight leading-tight">
          Om mig
        </h1>

        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Bakom Sagomaskan finns en passion för att skapa med garn, färg och fantasi. Varje produkt virkas för hand och får sin egen lilla personlighet.
        </p>
      </section>

      {/* 4. Huvudsektion – Min berättelse (Two columns on desktop, stacked on mobile) */}
      <section className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          
          {/* Left Column: Personal Story */}
          <div className="md:col-span-7 space-y-5 text-sm sm:text-base text-[#66726A] font-light leading-relaxed order-2 md:order-1">
            <div className="space-y-2 border-b border-[#E6DFD3]/70 pb-4">
              <div className="inline-flex items-center gap-2 text-[#6B8E7B]">
                <Scissors className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Handgjort hantverk</span>
                <span className="text-[#E6DFD3]">•</span>
                <span className="inline-flex items-center text-xs text-[#D9A88F]">
                  <Heart className="w-3 h-3 fill-current inline-block" />
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#242D27] font-medium leading-snug">
                Skapat för hand med omsorg och glädje
              </h2>
            </div>
            
            {!settingsLoaded ? (
              <div className="space-y-3 pt-1">
                <div className="h-4 bg-[#E6DFD3]/50 animate-pulse rounded w-full" />
                <div className="h-4 bg-[#E6DFD3]/40 animate-pulse rounded w-11/12" />
                <div className="h-4 bg-[#E6DFD3]/40 animate-pulse rounded w-4/5" />
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {storyParagraphs.map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href={getPageUrl('shop')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('shop');
                  }
                }}
                className="px-6 py-3.5 bg-[#242D27] text-[#FAF8F5] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#6B8E7B] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Utforska produkterna</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={getPageUrl('contact')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('contact');
                  }
                }}
                className="px-6 py-3.5 bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#F3EFE8] hover:border-[#6B8E7B]/40 active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer"
              >
                Kontakta mig
              </a>
            </div>
          </div>

          {/* Right Column: Visual Area with soft rounded organic card presentation */}
          <div className="md:col-span-5 order-1 md:order-2 flex flex-col items-center">
            <div className="relative w-full max-w-sm sm:max-w-none">
              {/* Soft decorative background glow */}
              <div className="absolute -inset-2 bg-[#EFF4F1] rounded-3xl -z-10 opacity-70 transform rotate-1" />
              
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E6DFD3] bg-[#F3EFE8] aspect-4/5 sm:aspect-square md:aspect-4/5 flex items-center justify-center shadow-xs">
                {settings?.aboutImageUrl ? (
                  <img
                    src={settings.aboutImageUrl}
                    alt="Om Sagomaskan hantverk"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-[#66726A] space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#6B8E7B] shadow-2xs border border-[#E6DFD3]/70">
                      <Scissors className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-serif text-lg text-[#242D27] font-medium">Handgjort med omsorg</p>
                      <p className="text-xs text-[#66726A] font-light">Maska för maska med garn & virknål</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-center text-[#66726A] mt-3 italic">
              Handvirkat med omsorg, maska för maska
            </p>
          </div>

        </div>
      </section>

      {/* 6. Liten "Det jag tycker om"-sektion (3 mjuka kort: Skapa, Färger, Fantasi) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Kreativ passion
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#242D27] font-medium">
            Det hantverket bygger på
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {/* Kort 1: Skapa */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs hover:border-[#6B8E7B]/50 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shadow-2xs">
              <Scissors className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg sm:text-xl font-medium text-[#242D27]">
              Skapa
            </h4>
            <p className="text-xs sm:text-sm text-[#66726A] font-light leading-relaxed">
              Varje produkt virkas från grunden för hand med virknål, tålamod och stor omsorg om detaljerna.
            </p>
          </div>

          {/* Kort 2: Färger */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs hover:border-[#6B8E7B]/50 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shadow-2xs">
              <Palette className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg sm:text-xl font-medium text-[#242D27]">
              Färger
            </h4>
            <p className="text-xs sm:text-sm text-[#66726A] font-light leading-relaxed">
              Mjuka och harmoniska färgkombinationer som ger varje virkad skapelse ett varmt och mysigt uttryck.
            </p>
          </div>

          {/* Kort 3: Fantasi */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs hover:border-[#6B8E7B]/50 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg sm:text-xl font-medium text-[#242D27]">
              Fantasi
            </h4>
            <p className="text-xs sm:text-sm text-[#66726A] font-light leading-relaxed">
              Kreativa figurer och skapelser med egen charm och personlighet, tänkta att glädja och hålla länge.
            </p>
          </div>
        </div>
      </section>

      {/* Information about ordering process (Soft, calm notice card) */}
      <section className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#EFF4F1]/80 border border-[#6B8E7B]/30 text-xs sm:text-sm text-[#526E5F] flex items-start gap-3.5 shadow-2xs">
        <Info className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <p className="font-medium text-[#242D27] text-sm sm:text-base font-serif">
            Hur beställningsförfrågan fungerar
          </p>
          <p className="font-light">
            Eftersom Sagomaskan är en hobbyverksamhet sker inga direkta köp i webbshoppen. Du lägger dina önskade produkter i din förfrågelista och skickar en beställningsförfrågan. Jag återkommer personligen med information om produkten, pris, eventuell frakt och hur betalning sker.
          </p>
        </div>
      </section>

      {/* 7. Avslutande sektion (Centered with subtle heart divider line) */}
      <section className="text-center max-w-xl mx-auto space-y-4 py-4 sm:py-6">
        {/* Subtle decorative line with small heart in center */}
        <div className="flex items-center justify-center gap-3 text-[#E6DFD3]" aria-hidden="true">
          <span className="h-[1px] w-12 sm:w-20 bg-[#E6DFD3]" />
          <Heart className="w-3.5 h-3.5 text-[#6B8E7B] fill-[#6B8E7B]/20" />
          <span className="h-[1px] w-12 sm:w-20 bg-[#E6DFD3]" />
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#242D27]">
            Välkommen till min kreativa värld
          </h3>
          <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed">
            Tack för att du kikar in och delar kärleken till handgjort hantverk och virkade detaljer.
          </p>
        </div>
      </section>

    </div>
  );
};
