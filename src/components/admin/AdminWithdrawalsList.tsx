import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  FileText,
  X,
  Save,
  MailCheck,
  AlertCircle
} from 'lucide-react';
import { Withdrawal, WithdrawalStatus } from '../../types';
import { updateWithdrawalStatus, updateWithdrawalNotes } from '../../services/withdrawalsService';

interface AdminWithdrawalsListProps {
  withdrawals: Withdrawal[];
}

export const AdminWithdrawalsList: React.FC<AdminWithdrawalsListProps> = ({ withdrawals }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'ongoing' | 'completed'>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);

  // Detail modal state
  const [currentStatus, setCurrentStatus] = useState<WithdrawalStatus>('Ny');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  const handleOpenDetail = (item: Withdrawal) => {
    setSelectedWithdrawal(item);
    setCurrentStatus(item.status);
    setInternalNotes(item.internalNotes || '');
    setNotesSaveSuccess(false);
  };

  const handleStatusChange = async (newStatus: WithdrawalStatus) => {
    if (!selectedWithdrawal) return;
    setCurrentStatus(newStatus);
    try {
      await updateWithdrawalStatus(selectedWithdrawal.id, newStatus);
      setSelectedWithdrawal({
        ...selectedWithdrawal,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Kunde inte uppdatera status för ångerärende:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedWithdrawal) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);
    try {
      await updateWithdrawalNotes(selectedWithdrawal.id, internalNotes);
      setSelectedWithdrawal({
        ...selectedWithdrawal,
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

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.customerName.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesOrder = item.orderNumber.toLowerCase().includes(q);
        const matchesItems = item.items.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesOrder && !matchesItems) return false;
      }

      // Status filter
      if (statusFilter === 'new' && item.status !== 'Ny') return false;
      if (
        statusFilter === 'ongoing' &&
        !['Behandlas', 'Retur inväntas', 'Återbetalning behandlas'].includes(item.status)
      ) {
        return false;
      }
      if (statusFilter === 'completed' && !['Återbetald', 'Avslutad'].includes(item.status)) {
        return false;
      }

      return true;
    });
  }, [withdrawals, searchQuery, statusFilter]);

  const newCount = withdrawals.filter((w) => w.status === 'Ny').length;
  const ongoingCount = withdrawals.filter((w) =>
    ['Behandlas', 'Retur inväntas', 'Återbetalning behandlas'].includes(w.status)
  ).length;

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'Ny':
        return 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE1D4]';
      case 'Behandlas':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Retur inväntas':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Återbetalning behandlas':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Återbetald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
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
            Konsumenträtt
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Ångerärenden ({withdrawals.length})
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-0.5">
            Hantera kunders inkomna ångeranmälningar, returstatus och mottagningsbevis.
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
            Alla ({withdrawals.length})
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
            placeholder="Sök order, kund eller varor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#242D27] placeholder-[#8F9992] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
          />
        </div>
      </div>

      {/* Withdrawals List */}
      {filteredWithdrawals.length === 0 ? (
        <div className="p-12 text-center bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl">
          <RotateCcw className="w-10 h-10 text-[#8C9B90] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif text-lg text-[#242D27]">Inga ångerärenden hittades</h3>
          <p className="text-xs text-[#66726A] mt-1">
            {searchQuery ? 'Inga ärenden matchade din sökning.' : 'Det finns inga registrerade ångeranmälningar i denna vy.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B] rounded-2xl p-5 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#242D27]">
                      Order {item.orderNumber}
                    </span>
                    <span className="text-xs text-[#8F9992]">•</span>
                    <span className="text-xs text-[#66726A]">
                      {new Date(item.submittedAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {item.acknowledgementSentAt && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-[#EFF4F1] text-[#526E5F] px-2 py-0.5 rounded-full">
                        <MailCheck className="w-3 h-3" />
                        <span>Mottagningsbevis skickat</span>
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium text-[#242D27]">
                    {item.customerName} <span className="text-[#66726A] font-light text-xs">({item.email})</span>
                  </div>

                  <p className="text-xs text-[#66726A] line-clamp-1 font-light">
                    <strong className="text-[#242D27] font-medium">Varor:</strong> {item.items}
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

      {/* Withdrawal Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E6DFD3]">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
                  Ångerärende
                </span>
                <h2 className="font-serif text-2xl text-[#242D27] font-medium mt-1">
                  Order {selectedWithdrawal.orderNumber}
                </h2>
                <span className="text-xs text-[#8F9992]">
                  Mottagen anmälan: {new Date(selectedWithdrawal.submittedAt).toLocaleString('sv-SE')}
                </span>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="p-1.5 rounded-full hover:bg-[#F3EFE8] text-[#66726A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crucial Note about Separate Steps */}
            <div className="p-3.5 rounded-xl bg-[#EFF4F1] border border-[#D5E4DB] text-xs text-[#2C3E33] space-y-1">
              <strong className="font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#526E5F]" />
                <span>Observera: Ångeranmälan och återbetalning är separata steg</span>
              </strong>
              <p className="font-light leading-relaxed">
                Detta formulär utgör kundens formella anmälan om att utöva ångerrätten. Återbetalning genomförs först efter att varan mottagits och kontrollerats i enlighet med våra köpvillkor.
              </p>
            </div>

            {/* Status Control */}
            <div className="p-4 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-[#242D27] block">Ärendestatus</span>
                <span className="text-[11px] text-[#66726A]">Följ returen från anmälan till avslut.</span>
              </div>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as WithdrawalStatus)}
                className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              >
                <option value="Ny">Ny</option>
                <option value="Behandlas">Behandlas</option>
                <option value="Retur inväntas">Retur inväntas</option>
                <option value="Återbetalning behandlas">Återbetalning behandlas</option>
                <option value="Återbetald">Återbetald</option>
                <option value="Avslutad">Avslutad</option>
              </select>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-[#E6DFD3] space-y-1.5">
                <span className="text-[#8F9992] uppercase tracking-wider text-[10px] font-semibold">Kunduppgifter</span>
                <div className="font-medium text-[#242D27] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>{selectedWithdrawal.customerName}</span>
                </div>
                <div className="text-[#66726A] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <a href={`mailto:${selectedWithdrawal.email}`} className="hover:underline">
                    {selectedWithdrawal.email}
                  </a>
                </div>
                {selectedWithdrawal.phone && (
                  <div className="text-[#66726A] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6B8E7B]" />
                    <span>{selectedWithdrawal.phone}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E6DFD3] space-y-1.5">
                <span className="text-[#8F9992] uppercase tracking-wider text-[10px] font-semibold">Mottagningsbevis</span>
                <div className="flex items-center gap-1.5 text-xs text-[#242D27]">
                  <MailCheck className="w-4 h-4 text-[#526E5F]" />
                  <span>
                    {selectedWithdrawal.acknowledgementSentAt ? (
                      <>Skickat ({new Date(selectedWithdrawal.acknowledgementSentAt).toLocaleDateString('sv-SE')})</>
                    ) : (
                      'Automatiskt mottagningsbevis'
                    )}
                  </span>
                </div>
                <div className="text-[#66726A] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>Anmält: {new Date(selectedWithdrawal.submittedAt).toLocaleDateString('sv-SE')}</span>
                </div>
              </div>
            </div>

            {/* Products with Right of Withdrawal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#66726A] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#6B8E7B]" />
                <span>Produkter som ångras</span>
              </label>
              <div className="p-4 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] leading-relaxed whitespace-pre-line">
                {selectedWithdrawal.items}
              </div>
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
                placeholder="Anteckna returspårning, paketmottagande, returkontroll, genomförd återbetalning etc..."
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
                onClick={() => setSelectedWithdrawal(null)}
                className="px-6 py-2.5 bg-[#F3EFE8] text-[#242D27] rounded-xl text-xs font-medium hover:bg-[#E6DFD3] transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
