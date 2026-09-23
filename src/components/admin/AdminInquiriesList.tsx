import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  Calendar,
  Package,
  X,
  Inbox,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Inquiry, AdminTab } from '../../types';

interface AdminInquiriesListProps {
  inquiries: Inquiry[];
  onNavigateTab: (tab: AdminTab, contextId?: string) => void;
}

export const AdminInquiriesList: React.FC<AdminInquiriesListProps> = ({
  inquiries,
  onNavigateTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'ongoing' | 'completed'>('all');

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      // Sökning på namn, e-post eller order-/förfrågningsnummer
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (inquiry.customerName || '').toLowerCase().includes(q);
        const matchesEmail = (inquiry.email || '').toLowerCase().includes(q);
        const matchesNumber = (inquiry.inquiryNumber || inquiry.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesNumber) return false;
      }

      // Statusflikar
      if (statusFilter === 'new' && inquiry.status !== 'Ny') return false;
      if (
        statusFilter === 'ongoing' &&
        !['Kontaktad', 'Bekräftad', 'Under arbete'].includes(inquiry.status)
      ) {
        return false;
      }
      if (
        statusFilter === 'completed' &&
        !['Klar', 'Avslutad', 'Avböjd', 'Avbruten'].includes(inquiry.status)
      ) {
        return false;
      }

      return true;
    });
  }, [inquiries, searchQuery, statusFilter]);

  const newCount = useMemo(() => inquiries.filter((i) => i.status === 'Ny').length, [inquiries]);
  const ongoingCount = useMemo(
    () => inquiries.filter((i) => ['Kontaktad', 'Bekräftad', 'Under arbete'].includes(i.status)).length,
    [inquiries]
  );
  const completedCount = useMemo(
    () => inquiries.filter((i) => ['Klar', 'Avslutad', 'Avböjd', 'Avbruten'].includes(i.status)).length,
    [inquiries]
  );

  const hasActiveSearch = Boolean(searchQuery.trim());

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            KUNDKONTAKT
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Beställningsförfrågningar ({inquiries.length})
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-0.5">
            Hantera personlig kontakt, bekräftelser och produktstatus för inkomna förfrågningar.
          </p>
        </div>
      </div>

      {/* 2 & 3. TABS OCH SÖKFÄLT */}
      <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Statusflikar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#242D27] text-[#FAF8F5] shadow-2xs'
                  : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
              }`}
            >
              Alla ({inquiries.length})
            </button>

            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                statusFilter === 'new'
                  ? 'bg-[#526E5F] text-[#FAF8F5] shadow-2xs'
                  : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
              }`}
            >
              <span>Nya</span>
              {newCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === 'new'
                    ? 'bg-[#FAF8F5] text-[#526E5F]'
                    : 'bg-[#EBF3EE] text-[#526E5F]'
                }`}>
                  {newCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('ongoing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ongoing'
                  ? 'bg-[#242D27] text-[#FAF8F5] shadow-2xs'
                  : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
              }`}
            >
              Pågående ({ongoingCount})
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-[#242D27] text-[#FAF8F5] shadow-2xs'
                  : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
              }`}
            >
              Avslutade ({completedCount})
            </button>
          </div>

          {/* Sökfält */}
          <div className="relative min-w-full md:min-w-[280px]">
            <Search className="w-3.5 h-3.5 text-[#8C9B90] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sök namn, e-post eller nummer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-8 pr-8 py-2 text-xs text-[#242D27] placeholder:text-[#8C9B90] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C9B90] hover:text-[#242D27] p-1 cursor-pointer"
                title="Rensa sökning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Aktiv sökning/filtrering indikator */}
        {(hasActiveSearch || statusFilter !== 'all') && (
          <div className="pt-2 border-t border-[#E6DFD3]/60 flex items-center justify-between text-xs text-[#66726A]">
            <div className="flex items-center gap-1.5">
              <span>Visar <strong>{filteredInquiries.length}</strong> av {inquiries.length} förfrågningar</span>
              {hasActiveSearch && (
                <span className="font-light">(matchar "{searchQuery}")</span>
              )}
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-[11px] text-[#8C5248] hover:text-[#5C3029] font-medium underline underline-offset-2 cursor-pointer"
            >
              Återställ filter
            </button>
          </div>
        )}
      </div>

      {/* 4–7. LISTA MED FÖRFRÅGNINGSKORT */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EFE8] text-[#8C9B90] flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#242D27] font-medium">
            Inga förfrågningar hittades
          </h3>
          <p className="text-xs text-[#66726A] font-light max-w-sm mx-auto">
            Inga beställningsförfrågningar matchar din sökning eller valda status.
          </p>
          {(hasActiveSearch || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all cursor-pointer mt-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>Rensa filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInquiries.map((inquiry) => {
            const formattedDate = inquiry.createdAt
              ? new Date(inquiry.createdAt).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Nyligen';

            const itemCount = inquiry.items ? inquiry.items.length : 0;

            return (
              <div
                key={inquiry.id}
                onClick={() => onNavigateTab('view-inquiry', inquiry.id)}
                className="bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] hover:bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                {/* Vänster del: Nummer, Kundnamn, E-post, Metadata, Meddelande */}
                <div className="space-y-2 flex-1 min-w-0">
                  
                  {/* Rad 1: Förfrågningsnummer och Kundnamn */}
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="font-mono text-xs font-semibold text-[#242D27] bg-[#F3EFE8] px-2 py-0.5 rounded-md border border-[#E6DFD3]/80">
                      {inquiry.inquiryNumber || `#${inquiry.id.slice(0, 6)}`}
                    </span>
                    <span className="font-serif text-base sm:text-lg font-medium text-[#242D27] group-hover:text-[#526E5F] transition-colors">
                      {inquiry.customerName || 'Okänd kund'}
                    </span>
                  </div>

                  {/* Rad 2: E-postadress */}
                  <div className="text-xs text-[#66726A] font-light">
                    {inquiry.email || 'Ingen e-post'}
                  </div>

                  {/* Rad 3: Datum, Antal produkter, Pris */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#66726A] font-light pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8C9B90]" />
                      <span>{formattedDate}</span>
                    </span>
                    <span className="text-[#8C9B90]">&bull;</span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-[#8C9B90]" />
                      <span>
                        {itemCount} {itemCount === 1 ? 'produkt' : 'produkter'}
                      </span>
                    </span>
                    <span className="text-[#8C9B90]">&bull;</span>
                    <span className="font-medium text-[#242D27]">
                      {inquiry.estimatedTotal || 0} kr
                    </span>
                  </div>

                  {/* Rad 4: Kundens meddelande */}
                  {inquiry.message && (
                    <p className="text-xs text-[#66726A] italic font-serif line-clamp-2 pt-1 border-t border-[#E6DFD3]/50 mt-1.5 leading-relaxed">
                      "{inquiry.message}"
                    </p>
                  )}
                </div>

                {/* Höger del: Statusknapp och pil */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6DFD3]/60">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                      inquiry.status === 'Ny'
                        ? 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4]'
                        : ['Kontaktad', 'Bekräftad', 'Under arbete'].includes(inquiry.status)
                        ? 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]'
                        : inquiry.status === 'Klar' || inquiry.status === 'Avslutad'
                        ? 'bg-[#EAE6DF] text-[#242D27] border-[#DED4C5]'
                        : 'bg-[#F7F4F0] text-[#8C7A70] border-[#E6DFD3]'
                    }`}
                  >
                    {inquiry.status}
                  </span>

                  <ChevronRight className="w-4 h-4 text-[#8C9B90] group-hover:text-[#242D27] transition-transform group-hover:translate-x-0.5" />
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
