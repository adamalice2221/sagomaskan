import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Paperclip,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { Claim, ClaimStatus } from '../../types';

interface AdminClaimsListProps {
  claims: Claim[];
  onSelectClaim: (claimId: string) => void;
  onUpdateClaimStatus: (claimId: string, status: ClaimStatus) => void;
}

export const AdminClaimsList: React.FC<AdminClaimsListProps> = ({
  claims,
  onSelectClaim,
  onUpdateClaimStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Alla');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Metrics
  const totalCount = claims.length;
  const newCount = claims.filter((c) => c.status === 'Ny').length;
  const inProgressCount = claims.filter(
    (c) => c.status === 'Under behandling' || c.status === 'Väntar på kund'
  ).length;
  const resolvedCount = claims.filter((c) => c.status === 'Godkänd' || c.status === 'Avslutad').length;

  // Filtered & Sorted
  const filteredClaims = useMemo(() => {
    return claims
      .filter((c) => {
        // Status filter
        if (statusFilter !== 'Alla' && c.status !== statusFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNumber = c.claimNumber.toLowerCase().includes(q);
          const matchName = `${c.firstName} ${c.lastName}`.toLowerCase().includes(q);
          const matchEmail = c.email.toLowerCase().includes(q);
          const matchPhone = c.phone.toLowerCase().includes(q);
          const matchOrder = c.orderNumber.toLowerCase().includes(q);
          const matchProduct = c.productName.toLowerCase().includes(q);
          const matchCompany = (c.company || '').toLowerCase().includes(q);
          return (
            matchNumber ||
            matchName ||
            matchEmail ||
            matchPhone ||
            matchOrder ||
            matchProduct ||
            matchCompany
          );
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [claims, statusFilter, searchQuery, sortBy]);

  const getStatusBadgeClass = (status: ClaimStatus) => {
    switch (status) {
      case 'Ny':
        return 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4]';
      case 'Under behandling':
        return 'bg-[#FFF8E6] text-[#8C6D1F] border-[#F3E2B8]';
      case 'Väntar på kund':
        return 'bg-[#F0F4F8] text-[#2C5282] border-[#C3DAFE]';
      case 'Godkänd':
        return 'bg-[#EBF3EE] text-[#2E6B47] border-[#C4E3D1]';
      case 'Avslutad':
        return 'bg-[#F3EFE8] text-[#66726A] border-[#E6DFD3]';
      default:
        return 'bg-[#FAF8F5] text-[#242D27] border-[#E6DFD3]';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#242D27] font-semibold flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#6B8E7B]" />
            <span>Reklamationer</span>
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-1">
            Övervaka, utred och handlägg inkomna reklamationsärenden från kunder.
          </p>
        </div>

        {/* Snabbstatus badge */}
        {newCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FDF3F2] border border-[#E8C5C0] text-xs font-semibold text-[#8C5248]">
            <span className="w-2 h-2 rounded-full bg-[#8C5248] animate-pulse" />
            <span>{newCount} nya ärenden att hantera</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 sm:p-5">
          <div className="text-[11px] font-semibold text-[#66726A] uppercase tracking-wider">
            Totalt
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#242D27] mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-[#66726A] font-light mt-0.5">
            Registrerade ärenden
          </div>
        </div>

        <div className="bg-[#FDF3F2] border border-[#E8C5C0] rounded-2xl p-4 sm:p-5">
          <div className="text-[11px] font-semibold text-[#8C5248] uppercase tracking-wider">
            Nya
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#8C5248] mt-1">
            {newCount}
          </div>
          <div className="text-[11px] text-[#8C5248] font-light mt-0.5">
            Kräver åtgärd
          </div>
        </div>

        <div className="bg-[#FFFDF5] border border-[#EFE5C6] rounded-2xl p-4 sm:p-5">
          <div className="text-[11px] font-semibold text-[#8C6D1F] uppercase tracking-wider">
            Under behandling
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#8C6D1F] mt-1">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-[#8C6D1F] font-light mt-0.5">
            Pågående utredningar
          </div>
        </div>

        <div className="bg-[#F5F8F6] border border-[#D5E5DA] rounded-2xl p-4 sm:p-5">
          <div className="text-[11px] font-semibold text-[#3B664C] uppercase tracking-wider">
            Åtgärdade
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3B664C] mt-1">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-[#3B664C] font-light mt-0.5">
            Godkända el. avslutade
          </div>
        </div>
      </div>

      {/* Kontroller: Sök & Filter */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Sökfält */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#66726A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök ärende, kund, e-post, order..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] focus:outline-none focus:border-[#6B8E7B] focus:ring-1 focus:ring-[#6B8E7B]"
          />
        </div>

        {/* Filter & Sortering */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Statusfilter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#66726A] font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] focus:outline-none focus:border-[#6B8E7B] cursor-pointer"
            >
              <option value="Alla">Alla statusar ({totalCount})</option>
              <option value="Ny">Ny ({newCount})</option>
              <option value="Under behandling">Under behandling</option>
              <option value="Väntar på kund">Väntar på kund</option>
              <option value="Godkänd">Godkänd</option>
              <option value="Avslutad">Avslutad</option>
            </select>
          </div>

          {/* Sortering */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] focus:outline-none focus:border-[#6B8E7B] cursor-pointer"
            >
              <option value="newest">Senast inkomna</option>
              <option value="oldest">Äldst först</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reklamationslista / Tabell */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl overflow-hidden shadow-xs">
        {filteredClaims.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#66726A] mx-auto opacity-40" />
            <h3 className="font-serif text-lg font-medium text-[#242D27]">
              Inga reklamationer matchar din filtrering
            </h3>
            <p className="text-xs text-[#66726A] font-light max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'Alla'
                ? 'Prova att rensa sökningen eller ändra statusfiltret.'
                : 'Det finns inga inkomna reklamationsärenden ännu.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6DFD3]">
            {filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 sm:p-6 hover:bg-[#F3EFE8]/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer"
                onClick={() => onSelectClaim(claim.id)}
              >
                {/* Kolumn 1: Ärendenummer & Datum */}
                <div className="space-y-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base sm:text-lg font-bold text-[#242D27]">
                      {claim.claimNumber}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#66726A] font-light">
                    <Calendar className="w-3 h-3 text-[#6B8E7B]" />
                    <span>
                      {new Date(claim.createdAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Kolumn 2: Kund & Order */}
                <div className="space-y-1 min-w-[220px]">
                  <div className="text-xs font-semibold text-[#242D27]">
                    {claim.firstName} {claim.lastName}
                    {claim.company && (
                      <span className="text-[11px] font-normal text-[#66726A] ml-1">
                        ({claim.company})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#66726A] font-light truncate max-w-[240px]">
                    {claim.email} • {claim.phone}
                  </div>
                  <div className="text-[11px] text-[#242D27] font-medium">
                    Order: <span className="font-mono">{claim.orderNumber}</span> • {claim.productName}
                  </div>
                </div>

                {/* Kolumn 3: Typ & Åtgärd */}
                <div className="space-y-1 min-w-[200px]">
                  <div className="text-xs text-[#242D27]">
                    <span className="text-[#66726A]">Typ:</span>{' '}
                    <span className="font-medium">{claim.claimType}</span>
                  </div>
                  <div className="text-[11px] text-[#66726A]">
                    <span>Önskar:</span>{' '}
                    <span className="font-medium text-[#242D27]">{claim.desiredResolution}</span>
                  </div>
                  {claim.attachments.length > 0 && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-[#526E5F] font-medium">
                      <Paperclip className="w-3 h-3" />
                      <span>{claim.attachments.length} bilaga(or)</span>
                    </div>
                  )}
                </div>

                {/* Kolumn 4: Statusväljare & Öppna-knapp */}
                <div
                  className="flex items-center gap-3 self-end lg:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={claim.status}
                    onChange={(e) =>
                      onUpdateClaimStatus(claim.id, e.target.value as ClaimStatus)
                    }
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E6DFD3] text-xs font-medium text-[#242D27] focus:outline-none focus:border-[#6B8E7B] cursor-pointer"
                  >
                    <option value="Ny">Ny</option>
                    <option value="Under behandling">Under behandling</option>
                    <option value="Väntar på kund">Väntar på kund</option>
                    <option value="Godkänd">Godkänd</option>
                    <option value="Avslutad">Avslutad</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => onSelectClaim(claim.id)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Öppna</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
