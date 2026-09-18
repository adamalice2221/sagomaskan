import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  Image as ImageIcon,
  FileText,
  X,
  ExternalLink,
  Save,
  MessageSquare
} from 'lucide-react';
import { Claim, ClaimStatus } from '../../types';
import { updateClaimStatus, updateClaimNotes } from '../../services/claimsService';

interface AdminClaimsListProps {
  claims: Claim[];
}

export const AdminClaimsList: React.FC<AdminClaimsListProps> = ({ claims }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'ongoing' | 'resolved'>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Editing state inside detail view
  const [currentStatus, setCurrentStatus] = useState<ClaimStatus>('Ny');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Sync state when selectedClaim changes
  const handleOpenDetail = (claim: Claim) => {
    setSelectedClaim(claim);
    setCurrentStatus(claim.status);
    setInternalNotes(claim.internalNotes || '');
    setNotesSaveSuccess(false);
  };

  const handleStatusChange = async (newStatus: ClaimStatus) => {
    if (!selectedClaim) return;
    setCurrentStatus(newStatus);
    try {
      await updateClaimStatus(selectedClaim.id, newStatus);
      setSelectedClaim({
        ...selectedClaim,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Kunde inte uppdatera status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedClaim) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);
    try {
      await updateClaimNotes(selectedClaim.id, internalNotes);
      setSelectedClaim({
        ...selectedClaim,
        internalNotes,
        updatedAt: new Date().toISOString()
      });
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Kunde inte spara interna anteckningar:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = claim.customerName.toLowerCase().includes(q);
        const matchesEmail = claim.email.toLowerCase().includes(q);
        const matchesOrder = claim.orderNumber.toLowerCase().includes(q);
        const matchesProduct = claim.product.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesOrder && !matchesProduct) return false;
      }

      // Status filter
      if (statusFilter === 'new' && claim.status !== 'Ny') return false;
      if (
        statusFilter === 'ongoing' &&
        !['Under behandling', 'Behöver mer information', 'Godkänd', 'Åtgärdad'].includes(claim.status)
      ) {
        return false;
      }
      if (statusFilter === 'resolved' && !['Avslagen', 'Avslutad'].includes(claim.status)) {
        return false;
      }

      return true;
    });
  }, [claims, searchQuery, statusFilter]);

  const newCount = claims.filter((c) => c.status === 'Ny').length;
  const ongoingCount = claims.filter((c) =>
    ['Under behandling', 'Behöver mer information', 'Godkänd', 'Åtgärdad'].includes(c.status)
  ).length;

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'Ny':
        return 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE1D4]';
      case 'Under behandling':
      case 'Behöver mer information':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Godkänd':
      case 'Åtgärdad':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Avslagen':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Avslutad':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Kundservice
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Reklamationer ({claims.length})
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-0.5">
            Hantera anmälda produktfel, granska bifogade bilder och uppdatera ärendestatus.
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
            Alla ({claims.length})
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
            onClick={() => setStatusFilter('resolved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'resolved'
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
            placeholder="Sök order, kund eller produkt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#242D27] placeholder-[#8F9992] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
          />
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl">
          <AlertCircle className="w-10 h-10 text-[#8C9B90] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif text-lg text-[#242D27]">Inga reklamationer hittades</h3>
          <p className="text-xs text-[#66726A] mt-1">
            {searchQuery ? 'Inga ärenden matchade din sökning.' : 'Det finns inga registrerade reklamationer i denna vy.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => handleOpenDetail(claim)}
              className="bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B] rounded-2xl p-5 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#242D27]">
                      Order {claim.orderNumber}
                    </span>
                    <span className="text-xs text-[#8F9992]">•</span>
                    <span className="text-xs text-[#66726A]">
                      {new Date(claim.createdAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {claim.imageUrls && claim.imageUrls.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-[#EFF4F1] text-[#526E5F] px-2 py-0.5 rounded-full">
                        <ImageIcon className="w-3 h-3" />
                        <span>{claim.imageUrls.length} {claim.imageUrls.length === 1 ? 'bild' : 'bilder'}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium text-[#242D27]">
                    {claim.customerName} — <span className="text-[#66726A] font-normal">{claim.product}</span>
                  </div>

                  <p className="text-xs text-[#66726A] line-clamp-1 font-light">
                    {claim.description}
                  </p>
                </div>

                {/* Right action */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-medium text-[#6B8E7B] group-hover:underline flex items-center gap-1">
                    <span>Hantera ärende</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E6DFD3]">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
                  Reklamationsärende
                </span>
                <h2 className="font-serif text-2xl text-[#242D27] font-medium mt-1">
                  Order {selectedClaim.orderNumber}
                </h2>
                <span className="text-xs text-[#8F9992]">
                  Mottaget: {new Date(selectedClaim.createdAt).toLocaleString('sv-SE')}
                </span>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="p-1.5 rounded-full hover:bg-[#F3EFE8] text-[#66726A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Control */}
            <div className="p-4 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-[#242D27] block">Ärendestatus</span>
                <span className="text-[11px] text-[#66726A]">Ändra status för att följa ärendets gång.</span>
              </div>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as ClaimStatus)}
                className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              >
                <option value="Ny">Ny</option>
                <option value="Under behandling">Under behandling</option>
                <option value="Behöver mer information">Behöver mer information</option>
                <option value="Godkänd">Godkänd</option>
                <option value="Avslagen">Avslagen</option>
                <option value="Åtgärdad">Åtgärdad</option>
                <option value="Avslutad">Avslutad</option>
              </select>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-[#E6DFD3] space-y-1.5">
                <span className="text-[#8F9992] uppercase tracking-wider text-[10px] font-semibold">Kunduppgifter</span>
                <div className="font-medium text-[#242D27] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>{selectedClaim.customerName}</span>
                </div>
                <div className="text-[#66726A] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <a href={`mailto:${selectedClaim.email}`} className="hover:underline">
                    {selectedClaim.email}
                  </a>
                </div>
                {selectedClaim.phone && (
                  <div className="text-[#66726A] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6B8E7B]" />
                    <span>{selectedClaim.phone}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E6DFD3] space-y-1.5">
                <span className="text-[#8F9992] uppercase tracking-wider text-[10px] font-semibold">Produkt & Upptäckt</span>
                <div className="font-medium text-[#242D27] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>{selectedClaim.product}</span>
                </div>
                <div className="text-[#66726A] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>Upptäcktes: {selectedClaim.discoveredAt}</span>
                </div>
              </div>
            </div>

            {/* Defect Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#66726A]">
                Beskrivning av felet
              </label>
              <div className="p-4 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] leading-relaxed whitespace-pre-line">
                {selectedClaim.description}
              </div>
            </div>

            {/* Additional info if present */}
            {selectedClaim.additionalInfo && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#66726A]">
                  Övrig information
                </label>
                <div className="p-3.5 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#66726A] leading-relaxed whitespace-pre-line">
                  {selectedClaim.additionalInfo}
                </div>
              </div>
            )}

            {/* Images Gallery */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#66726A] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#6B8E7B]" />
                <span>Bifogade bilder ({selectedClaim.imageUrls?.length || 0})</span>
              </label>
              {selectedClaim.imageUrls && selectedClaim.imageUrls.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {selectedClaim.imageUrls.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setModalImage(img)}
                      className="aspect-square rounded-xl overflow-hidden border border-[#E6DFD3] cursor-pointer hover:opacity-90 hover:scale-102 transition-all bg-[#F3EFE8] group relative"
                    >
                      <img src={img} alt={`Bild ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8F9992] italic">Inga bilder bifogades av kunden.</p>
              )}
            </div>

            {/* Internal Notes */}
            <div className="space-y-2 pt-2 border-t border-[#E6DFD3]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#66726A] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>Interna handläggningsanteckningar (visas ej för kund)</span>
                </label>
                {notesSaveSuccess && (
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Sparat!
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Skriv interna anteckningar om åtgärd, dialog med kund, leverantör, etc..."
                className="w-full bg-white border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-[#242D27] text-[#FAF8F5] rounded-xl text-xs font-medium hover:bg-[#6B8E7B] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Sparar...' : 'Spara anteckningar'}</span>
                </button>
              </div>
            </div>

            {/* Modal Close Button */}
            <div className="pt-4 border-t border-[#E6DFD3] flex justify-end">
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-6 py-2.5 bg-[#F3EFE8] text-[#242D27] rounded-xl text-xs font-medium hover:bg-[#E6DFD3] transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Image Lightbox */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={modalImage} alt="Full bild" className="max-w-full max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
