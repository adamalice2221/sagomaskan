import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Save,
  Package
} from 'lucide-react';
import { Inquiry, InquiryStatus } from '../../types';
import { updateInquiryStatus } from '../../services/db';

interface AdminInquiryDetailProps {
  inquiry: Inquiry;
  onBack: () => void;
  onStatusUpdated: () => void;
}

const STATUSES: InquiryStatus[] = [
  'Ny',
  'Kontaktad',
  'Bekräftad',
  'Under arbete',
  'Klar',
  'Avslutad',
  'Avböjd'
];

export const AdminInquiryDetail: React.FC<AdminInquiryDetailProps> = ({
  inquiry,
  onBack,
  onStatusUpdated
}) => {
  const [currentStatus, setCurrentStatus] = useState<InquiryStatus>(inquiry.status);
  const [adminNotes, setAdminNotes] = useState(inquiry.adminNotes || '');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleStatusChange = async (newStatus: InquiryStatus) => {
    setCurrentStatus(newStatus);
    setSavingStatus(true);
    try {
      await updateInquiryStatus(inquiry.id, newStatus, adminNotes);
      showNotice(`Status ändrad till ${newStatus}`);
      onStatusUpdated();
    } catch (e) {
      showNotice('Kunde inte uppdatera status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateInquiryStatus(inquiry.id, currentStatus, adminNotes);
      showNotice('Anteckningar sparades.');
      onStatusUpdated();
    } catch (e) {
      showNotice('Kunde inte spara anteckningar.');
    } finally {
      setSavingNotes(false);
    }
  };

  const formattedDate = inquiry.createdAt
    ? new Date(inquiry.createdAt).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Nyligen';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#F3EFE8] hover:bg-[#E6DFD3] text-[#242D27] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
                Förfrågan
              </span>
              <span className="text-xs font-semibold text-[#242D27]">
                {inquiry.inquiryNumber}
              </span>
            </div>
            <h1 className="font-serif text-3xl text-[#242D27] font-medium">
              {inquiry.customerName}
            </h1>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#66726A] font-medium">Status:</span>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value as InquiryStatus)}
            disabled={savingStatus}
            className="bg-[#FAF8F5] border-2 border-[#6B8E7B] text-[#242D27] font-medium rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)}>&times;</button>
        </div>
      )}

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer Information */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 space-y-4">
          <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3]">
            Kunduppgifter
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 text-[#242D27]">
              <User className="w-4 h-4 text-[#8C9B90] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#66726A] block text-[10px] uppercase font-semibold">Namn</span>
                <span className="font-medium text-sm">{inquiry.customerName}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-[#242D27]">
              <Mail className="w-4 h-4 text-[#8C9B90] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#66726A] block text-[10px] uppercase font-semibold">E-post</span>
                <a href={`mailto:${inquiry.email}`} className="text-[#526E5F] underline">
                  {inquiry.email}
                </a>
              </div>
            </div>

            {inquiry.phone && (
              <div className="flex items-start gap-3 text-[#242D27]">
                <Phone className="w-4 h-4 text-[#8C9B90] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#66726A] block text-[10px] uppercase font-semibold">Telefon</span>
                  <a href={`tel:${inquiry.phone}`} className="text-[#526E5F]">
                    {inquiry.phone}
                  </a>
                </div>
              </div>
            )}

            {(inquiry.address || inquiry.city) && (
              <div className="flex items-start gap-3 text-[#242D27]">
                <MapPin className="w-4 h-4 text-[#8C9B90] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#66726A] block text-[10px] uppercase font-semibold">Leveransadress</span>
                  <div>{inquiry.address}</div>
                  <div>{inquiry.postalCode} {inquiry.city}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 text-[#242D27]">
              <Calendar className="w-4 h-4 text-[#8C9B90] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#66726A] block text-[10px] uppercase font-semibold">Mottagen</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Message & Admin Notes */}
        <div className="space-y-6">
          
          {/* Customer Message */}
          <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 space-y-3">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#8C9B90]" />
              <span>Kundens meddelande</span>
            </h2>

            {inquiry.message ? (
              <p className="font-serif italic text-sm text-[#242D27] leading-relaxed bg-[#FAF8F5] p-4 rounded-2xl border border-[#E6DFD3]">
                "{inquiry.message}"
              </p>
            ) : (
              <p className="text-xs text-[#66726A] font-light italic">
                Inget personligt meddelande bifogades.
              </p>
            )}
          </div>

          {/* Admin Private Notes */}
          <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8C9B90]" />
                <span>Interna anteckningar</span>
              </h2>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{savingNotes ? 'Sparar...' : 'Spara'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Skriv interna anteckningar (t.ex. datum för kontakt, garnfärg, preliminär leveranstid)..."
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] leading-relaxed"
            />
            <span className="text-[10px] text-[#66726A] font-light">
              Syns endast för administratör i Sagomaskan Admin.
            </span>
          </div>

        </div>

      </div>

      {/* Requested Products Table */}
      <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 space-y-4 shadow-xs">
        <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3]">
          Önskade produkter ({inquiry.items?.length || 0})
        </h2>

        <div className="divide-y divide-[#E6DFD3]">
          {inquiry.items?.map((item, idx) => (
            <div key={idx} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-14 h-14 rounded-2xl object-cover bg-[#E6DFD3] border border-[#DED4C5]"
                  />
                )}
                <div>
                  <h3 className="font-medium text-sm text-[#242D27]">
                    {item.productName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#66726A] font-light mt-0.5">
                    {item.selectedColor && (
                      <span>Färg: <strong>{item.selectedColor}</strong></span>
                    )}
                    {item.selectedSize && (
                      <span>&bull; Storlek: <strong>{item.selectedSize}</strong></span>
                    )}
                    <span>&bull; Antal: <strong>{item.quantity} st</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-[#242D27]">
                  {item.priceAtTimeOfInquiry * item.quantity} kr
                </div>
                <div className="text-[10px] text-[#66726A] font-light">
                  {item.priceAtTimeOfInquiry} kr / st (pris vid förfrågan)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total sum & discount breakdown */}
        <div className="pt-4 border-t-2 border-[#E6DFD3] space-y-2">
          {inquiry.discountCode ? (
            <div className="space-y-1.5 pb-3 border-b border-[#E6DFD3] text-xs">
              <div className="flex items-center justify-between text-[#66726A]">
                <span>Ordinarie varuvärde</span>
                <span className="font-medium text-[#242D27]">
                  {inquiry.subtotalBeforeDiscount || inquiry.estimatedTotal} kr
                </span>
              </div>

              <div className="flex items-center justify-between text-[#526E5F] font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="font-mono uppercase bg-[#EBF3EE] border border-[#CDE0D4] px-1.5 py-0.5 rounded text-[11px]">
                    {inquiry.discountCode}
                  </span>
                  <span>
                    ({inquiry.discountType === 'percentage' ? `${inquiry.discountValue} %` : `${inquiry.discountValue} kr rabatt`})
                  </span>
                </span>
                <span>−{inquiry.discountAmount} kr</span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-sm pt-1">
            <div>
              <span className="font-serif text-base text-[#242D27] font-medium block">
                Beräknat totalvärde (exkl. ev. frakt)
              </span>
              {inquiry.discountCode && (
                <span className="text-[11px] text-[#526E5F] font-medium">
                  Rabatt tillämpad
                </span>
              )}
            </div>
            <span className="font-serif text-2xl text-[#242D27] font-semibold">
              {inquiry.totalAfterDiscount ?? inquiry.estimatedTotal} kr
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
