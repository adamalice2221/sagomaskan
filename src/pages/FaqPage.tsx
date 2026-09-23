import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { PageRoute } from '../types';
import { useData } from '../context/DataContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface FaqPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const { settings, settingsLoaded } = useData();
  const [openIds, setOpenIds] = useState<string[]>(['0', 'forfragan-funkar', 'handgjorda']);
  const [activeFilter, setActiveFilter] = useState<string>('alla');

  // Scroll detection for category pill row on mobile
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollWidth - scrollLeft - clientWidth > 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = categoryScrollRef.current;
    if (!el) return;

    const frameId = requestAnimationFrame(checkScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', checkScroll);
    return () => {
      cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const faqs = settings.faqItems && settings.faqItems.length > 0
    ? settings.faqItems
    : [];

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqs.filter(
    (faq) => activeFilter === 'alla' || !faq.category || faq.category === activeFilter
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Frågor & Svar
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#242D27] font-medium">
          Vanliga frågor
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Här har jag samlat svar på de vanligaste frågorna om mina handgjorda produkter, leveranser och skötselråd.
        </p>
      </div>

      {/* Category tabs */}
      <div className="relative max-w-full overflow-hidden sm:overflow-visible border-b border-[#E6DFD3] pb-4">
        {/* Left subtle fade indicator when scrolled right */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-4 w-8 sm:hidden bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent z-10 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Horizontal Scrollable Categories Container (Single row on mobile, wrapped/centered on sm+) */}
        <div
          ref={categoryScrollRef}
          onScroll={checkScroll}
          className="flex sm:flex-wrap items-center sm:justify-center gap-2 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 px-1"
        >
          {[
            { id: 'alla', label: 'Alla frågor' },
            { id: 'forfragan', label: 'Beställningsförfrågan' },
            { id: 'produkter', label: 'Produkter & Hantverk' },
            { id: 'betalning', label: 'Betalning' },
            { id: 'leverans', label: 'Leverans' },
            { id: 'skotsel', label: 'Skötselråd' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#242D27] text-[#FAF8F5] shadow-xs'
                  : 'bg-[#F3EFE8] text-[#66726A] hover:bg-[#E6DFD3] hover:text-[#242D27]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right subtle fade indicator when more categories can be swiped to */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-4 w-10 sm:hidden bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent z-10 transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-4">
        {!settingsLoaded ? (
          <div className="space-y-4">
            <div className="p-6 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl animate-pulse flex items-center justify-between">
              <div className="h-5 w-64 bg-[#E6DFD3]/60 rounded" />
              <div className="h-6 w-6 bg-[#E6DFD3]/60 rounded-full" />
            </div>
            <div className="p-6 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl animate-pulse flex items-center justify-between">
              <div className="h-5 w-48 bg-[#E6DFD3]/60 rounded" />
              <div className="h-6 w-6 bg-[#E6DFD3]/60 rounded-full" />
            </div>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#66726A] bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl">
            Inga frågor matchade det valda filterkriteriet.
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const faqKey = faq.id || `faq-${index}`;
            const isOpen = openIds.includes(faqKey) || openIds.includes(String(index));
            return (
              <div
                key={faqKey}
                className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faqKey)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-[#F3EFE8]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                >
                  <span className="font-serif text-lg sm:text-xl font-medium text-[#242D27] leading-snug">
                    {faq.question}
                  </span>
                  <span
                    className={`p-1.5 rounded-full bg-[#F3EFE8] text-[#242D27] transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#EFF4F1] text-[#6B8E7B]' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-[#66726A] font-light leading-relaxed border-t border-[#E6DFD3]/60 bg-[#FAF8F5] whitespace-pre-line">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Help Prompt */}
      <div className="p-8 bg-[#F3EFE8]/70 border border-[#E6DFD3] rounded-2xl text-center space-y-4">
        <h3 className="font-serif text-xl font-medium text-[#242D27]">
          Hittade du inte svaret du letade efter?
        </h3>
        <p className="text-xs text-[#66726A] max-w-md mx-auto font-light leading-relaxed">
          Tveka inte att skriva till mig. Jag svarar gärna personligen på alla dina funderingar!
        </p>
        <a
          href={getPageUrl('contact')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('contact');
            }
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Kontakta mig direkt</span>
        </a>
      </div>

    </div>
  );
};
