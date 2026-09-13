import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  Package
} from 'lucide-react';
import { Inquiry, InquiryStatus, AdminTab } from '../../types';

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
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = inquiry.customerName.toLowerCase().includes(q);
        const matchesEmail = inquiry.email.toLowerCase().includes(q);
        const matchesNumber = (inquiry.inquiryNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesNumber) return false;
      }

      // Status tab
      if (statusFilter === 'new' && inquiry.status !== 'Ny') return false;
      if (
        statusFilter === 'ongoing' &&
        !['Kontaktad', 'Bekräftad', 'Under arbete'].includes(inquiry.status)
      )
        return false;
      if (
        statusFilter === 'completed' &&
        !['Klar', 'Avslutad', 'Avböjd'].includes(inquiry.status)
      )
        return false;

      return true;
    });
  }, [inquiries, searchQuery, statusFilter]);

  const newCount = inquiries.filter((i) => i.status === 'Ny').length;
  const ongoingCount = inquiries.filter((i) =>
    ['Kontaktad', 'Bekräftad', 'Under arbete'].includes(i.status)
  ).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Kundkontakt
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Beställningsförfrågningar ({inquiries.length})
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-0.5">
            Hantera personlig kontakt, bekräftelser och produktstatus för inkomna förfrågningar.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl p-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-[#242D27] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            Alla ({inquiries.length})
          </button>

          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'new'
                ? 'bg-[#526E5F] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            <span>Nya</span>
            {newCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#FAF8F5] text-[#526E5F] text-[10px] rounded-full font-bold">
                {newCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('ongoing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'ongoing'
                ? 'bg-[#242D27] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            Pågående ({ongoingCount})
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'completed'
                ? 'bg-[#242D27] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            Avslutade
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#8C9B90] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Sök namn, e-post eller nummer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-12 text-center space-y-2">
          <p className="text-sm text-[#66726A] font-light">
            Inga förfrågningar matchar dina valda filter.
          </p>
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

            return (
              <div
                key={inquiry.id}
                onClick={() => onNavigateTab('view-inquiry', inquiry.id)}
                className="bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-serif text-base font-semibold text-[#242D27]">
                      {inquiry.inquiryNumber || '#Förfrågan'}
                    </span>
                    <span className="text-sm font-medium text-[#242D27]">
                      {inquiry.customerName}
                    </span>
                    <span className="text-xs text-[#66726A] font-light">
                      &bull; {inquiry.email}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#66726A] font-light">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#8C9B90]" />
                      {formattedDate}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-[#8C9B90]" />
                      {inquiry.items?.length || 0} produkt(er)
                    </span>
                    <span>&bull;</span>
                    <span className="font-medium text-[#242D27]">
                      {inquiry.estimatedTotal} kr
                    </span>
                  </div>

                  {inquiry.message && (
                    <p className="text-xs text-[#66726A] italic line-clamp-1 pt-1 font-serif">
                      "{inquiry.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6DFD3]">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      inquiry.status === 'Ny'
                        ? 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4]'
                        : inquiry.status === 'Bekräftad' || inquiry.status === 'Under arbete'
                        ? 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]'
                        : inquiry.status === 'Klar'
                        ? 'bg-[#E6DFD3] text-[#242D27] border-[#DED4C5]'
                        : 'bg-[#F3EFE8] text-[#66726A] border-[#E6DFD3]'
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
