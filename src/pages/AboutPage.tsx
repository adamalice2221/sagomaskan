import React from 'react';
import { ArrowRight, Heart, Scissors, Clock, MessageSquare, Info } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
      
      {/* Hero presentation */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Om Sagomaskan
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#242D27] leading-tight font-medium">
          Varje maska är handgjord
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light max-w-2xl mx-auto leading-relaxed">
          Bakom Sagomaskan finns en passion för att skapa med garn, färg och fantasi. Varje produkt virkas för hand och får sin egen lilla personlighet.
        </p>
      </div>

      {/* Craft Narrative section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-5 relative">
          <div className="rounded-2xl overflow-hidden border border-[#E6DFD3] shadow-lg bg-[#F3EFE8] h-80 sm:h-96 flex items-center justify-center">
            {settings?.aboutImageUrl ? (
              <img
                src={settings.aboutImageUrl}
                alt="Om Sagomaskan hantverk"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-[#66726A] space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#6B8E7B]">
                  <Scissors className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Handgjort med omsorg</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-center text-[#66726A] mt-2 italic">
            Handvirkat med omsorg, maska för maska
          </p>
        </div>

        <div className="md:col-span-7 space-y-5 text-sm sm:text-base text-[#66726A] font-light leading-relaxed">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#242D27] font-medium">
            Skapat för hand med omsorg och glädje
          </h2>
          
          {!settingsLoaded ? (
            <div className="space-y-3">
              <div className="h-4 bg-[#E6DFD3]/50 animate-pulse rounded w-full" />
              <div className="h-4 bg-[#E6DFD3]/40 animate-pulse rounded w-11/12" />
              <div className="h-4 bg-[#E6DFD3]/40 animate-pulse rounded w-4/5" />
            </div>
          ) : (
            storyParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href={getPageUrl('shop')}
              onClick={(e) => {
                if (!isModifiedClick(e)) {
                  e.preventDefault();
                  onNavigate('shop');
                }
              }}
              className="px-6 py-3 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
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
              className="px-6 py-3 bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] text-xs font-medium rounded-xl hover:bg-[#F3EFE8] transition-colors cursor-pointer"
            >
              Kontakta mig
            </a>
          </div>
        </div>
      </div>

      {/* Values Section: Neutral and genuine */}
      <div className="border-t border-[#E6DFD3] pt-16 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Värderingar
          </p>
          <h3 className="font-serif text-3xl text-[#242D27]">
            Det hantverket bygger på
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-medium text-[#242D27]">
              Handgjort
            </h4>
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Varje produkt virkas för hand.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-medium text-[#242D27]">
              Skapat med omsorg
            </h4>
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Jag lägger tid och omsorg på varje beställning.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-medium text-[#242D27]">
              På beställning
            </h4>
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Vissa produkter virkas efter din beställning.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-medium text-[#242D27]">
              Personlig kontakt
            </h4>
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Du får personlig kontakt genom hela beställningsprocessen.
            </p>
          </div>
        </div>
      </div>

      {/* Information about ordering process */}
      <div className="p-6 rounded-2xl bg-[#EFF4F1] border border-[#6B8E7B]/25 text-xs text-[#526E5F] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-medium text-[#242D27]">
            Hur beställningsförfrågan fungerar
          </p>
          <p>
            Eftersom Sagomaskan är en hobbyverksamhet sker inga direkta köp i webbshoppen. Du lägger dina önskade produkter i din förfrågelista och skickar en beställningsförfrågan. Jag återkommer personligen med information om produkten, pris, eventuell frakt och hur betalning sker.
          </p>
        </div>
      </div>

    </div>
  );
};
