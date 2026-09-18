import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  Save,
  ExternalLink,
  X,
  AlertCircle
} from 'lucide-react';
import { Claim, ClaimStatus, ClaimAttachment } from '../../types';

interface AdminClaimDetailProps {
  claim: Claim;
  onBack: () => void;
  onUpdateStatus: (claimId: string, status: ClaimStatus) => void;
  onSaveNotes: (claimId: string, notes: string) => Promise<void> | void;
  onDeleteClaim?: (claimId: string) => void;
}

export const AdminClaimDetail: React.FC<AdminClaimDetailProps> = ({
  claim,
  onBack,
  onUpdateStatus,
  onSaveNotes,
  onDeleteClaim
}) => {
  const [internalNotes, setInternalNotes] = useState(claim.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ClaimAttachment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveNotesClick = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveNotes(claim.id, internalNotes);
      setNotesSavedNotice(true);
      setTimeout(() => setNotesSavedNotice(false), 3000);
    } catch (err) {
      console.error('Kunde inte spara interna anteckningar:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
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

  const mailtoSubject = encodeURIComponent(`Angående reklamation ${claim.claimNumber} - Sagomaskan`);
  const mailtoBody = encodeURIComponent(
    `Hej ${claim.firstName},\n\nTack för din kontakt gällande reklamation ${claim.claimNumber} för order ${claim.orderNumber}.\n\n`
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">

      {/* Tillbaka & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#66726A] hover:text-[#242D27] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tillbaka till reklamationer</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#6B8E7B]" />
            <span>Skriv ut ärende</span>
          </button>

          {onDeleteClaim && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6DFD3] text-xs font-medium text-[#8C5248] hover:bg-[#FDF3F2] transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ta bort</span>
            </button>
          )}
        </div>
      </div>

      {/* Ärendehuvud */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-[#242D27]">
              {claim.claimNumber}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                claim.status
              )}`}
            >
              {claim.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#66726A] font-light">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#6B8E7B]" />
              Inskickat: {new Date(claim.createdAt).toLocaleString('sv-SE')}
            </span>
            {claim.updatedAt && claim.updatedAt !== claim.createdAt && (
              <span>• Senast uppdaterad: {new Date(claim.updatedAt).toLocaleString('sv-SE')}</span>
            )}
          </div>
        </div>

        {/* Statusändrare */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white border border-[#E6DFD3] p-3 rounded-2xl">
          <span className="text-xs font-medium text-[#242D27]">Ändra status:</span>
          <select
            value={claim.status}
            onChange={(e) => onUpdateStatus(claim.id, e.target.value as ClaimStatus)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs font-semibold text-[#242D27] focus:outline-none focus:border-[#6B8E7B] cursor-pointer"
          >
            <option value="Ny">Ny</option>
            <option value="Under behandling">Under behandling</option>
            <option value="Väntar på kund">Väntar på kund</option>
            <option value="Godkänd">Godkänd</option>
            <option value="Avslutad">Avslutad</option>
          </select>
        </div>
      </div>

      {/* Grid med detaljer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* KORT 1: KUNDUPPGIFTER */}
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
          <h2 className="font-serif text-lg font-medium text-[#242D27] pb-2 border-b border-[#E6DFD3] flex items-center justify-between">
            <span>Kunduppgifter</span>
            <a
              href={`mailto:${claim.email}?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="text-xs font-sans font-medium text-[#526E5F] hover:underline inline-flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Skicka e-post</span>
            </a>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#66726A] block">Namn:</span>
              <span className="font-semibold text-sm text-[#242D27]">
                {claim.firstName} {claim.lastName}
              </span>
              {claim.company && (
                <span className="text-xs text-[#66726A] block">Företag: {claim.company}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#66726A] block">E-postadress:</span>
                <a
                  href={`mailto:${claim.email}`}
                  className="font-medium text-[#242D27] hover:underline"
                >
                  {claim.email}
                </a>
              </div>
              <div>
                <span className="text-[#66726A] block">Telefon:</span>
                <a
                  href={`tel:${claim.phone}`}
                  className="font-medium text-[#242D27] hover:underline"
                >
                  {claim.phone}
                </a>
              </div>
            </div>

            <div>
              <span className="text-[#66726A] block">Leveransadress:</span>
              <span className="font-medium text-[#242D27] block">
                {claim.address}
              </span>
              <span className="font-medium text-[#242D27] block">
                {claim.postalCode} {claim.city}
              </span>
            </div>
          </div>
        </div>

        {/* KORT 2: ORDER- OCH KÖPUPPGIFTER */}
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
          <h2 className="font-serif text-lg font-medium text-[#242D27] pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#6B8E7B]" />
            <span>Order- och köpuppgifter</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#66726A] block">Ordernummer / Faktura:</span>
                <span className="font-mono font-bold text-sm text-[#242D27]">
                  {claim.orderNumber}
                </span>
              </div>
              <div>
                <span className="text-[#66726A] block">Köpdatum:</span>
                <span className="font-medium text-[#242D27]">
                  {claim.purchaseDate}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[#66726A] block">Berörd produkt / tjänst:</span>
              <span className="font-medium text-[#242D27] text-sm">
                {claim.productName}
              </span>
            </div>

            {claim.articleNumber && (
              <div>
                <span className="text-[#66726A] block">Artikelnummer:</span>
                <span className="font-mono text-[#242D27]">{claim.articleNumber}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* KORT 3: REKLAMATIONSDETALJER & BESKRIVNING */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <h2 className="font-serif text-xl font-medium text-[#242D27] pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#6B8E7B]" />
          <span>Reklamation & Felbeskrivning</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-[#E6DFD3]">
            <span className="text-[#66726A] block text-[11px] uppercase tracking-wider">
              Typ av reklamation
            </span>
            <span className="font-semibold text-sm text-[#242D27] mt-0.5 block">
              {claim.claimType}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E6DFD3]">
            <span className="text-[#66726A] block text-[11px] uppercase tracking-wider">
              Upptäcktes datum
            </span>
            <span className="font-semibold text-sm text-[#242D27] mt-0.5 block">
              {claim.discoveredDate}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E6DFD3]">
            <span className="text-[#66726A] block text-[11px] uppercase tracking-wider">
              Önskad åtgärd
            </span>
            <span className="font-semibold text-sm text-[#526E5F] mt-0.5 block">
              {claim.desiredResolution}
            </span>
          </div>
        </div>

        {/* Textbeskrivning */}
        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-semibold text-[#242D27]">
            Kundens beskrivning av problemet:
          </span>
          <div className="p-5 rounded-2xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] leading-relaxed whitespace-pre-wrap font-light">
            {claim.description}
          </div>
        </div>
      </div>

      {/* KORT 4: BILAGOR */}
      {claim.attachments && claim.attachments.length > 0 && (
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="font-serif text-xl font-medium text-[#242D27] pb-2 border-b border-[#E6DFD3] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-[#6B8E7B]" />
              <span>Bifogade filer ({claim.attachments.length} st)</span>
            </span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {claim.attachments.map((att) => {
              const isImage = att.type.startsWith('image/');
              return (
                <div
                  key={att.id}
                  onClick={() => {
                    if (isImage) setSelectedImage(att);
                  }}
                  className={`group rounded-2xl bg-white border border-[#E6DFD3] p-3 text-center transition-all ${
                    isImage ? 'cursor-pointer hover:border-[#6B8E7B]' : ''
                  }`}
                >
                  {isImage ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F3EFE8] mb-2 border border-[#E6DFD3]">
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] flex items-center justify-center text-[#526E5F] mb-2">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  <div className="text-[11px] font-medium text-[#242D27] truncate" title={att.name}>
                    {att.name}
                  </div>
                  <div className="text-[10px] text-[#66726A] mt-0.5">
                    {(att.size / 1024).toFixed(0)} KB •{' '}
                    {att.category === 'product_damage' ? 'Skadefoto' : 'Kvitto/Dokument'}
                  </div>

                  <a
                    href={att.dataUrl}
                    download={att.name}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#526E5F] hover:underline mt-2"
                  >
                    <span>Ladda ner</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KORT 5: INTERNA ANTECKNINGAR */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
          <div>
            <h2 className="font-serif text-xl font-medium text-[#242D27]">
              Interna handläggarnoteringar
            </h2>
            <p className="text-xs text-[#66726A] font-light mt-0.5">
              Dessa anteckningar är endast synliga för administratörer och visas inte för kunden.
            </p>
          </div>

          {notesSavedNotice && (
            <div className="inline-flex items-center gap-1.5 text-xs text-[#526E5F] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sparat!</span>
            </div>
          )}
        </div>

        <textarea
          rows={4}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Skriv interna noteringar här, t.ex. 'Kunden kontaktad per telefon 18/9, vi skickar returfraktsedel...' "
          className="w-full p-4 rounded-xl bg-white border border-[#E6DFD3] text-xs text-[#242D27] focus:outline-none focus:border-[#6B8E7B] focus:ring-1 focus:ring-[#6B8E7B] leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isSavingNotes}
            onClick={handleSaveNotesClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-semibold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingNotes ? 'Sparar...' : 'Spara anteckning'}</span>
          </button>
        </div>
      </div>

      {/* Bildmodal vid klick på bild */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[90vh] bg-white rounded-3xl p-4 overflow-hidden relative shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
              <span className="text-xs font-medium text-[#242D27]">{selectedImage.name}</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg text-[#66726A] hover:bg-[#F3EFE8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedImage.dataUrl}
              alt={selectedImage.name}
              className="max-h-[70vh] w-auto mx-auto object-contain rounded-xl"
            />
            <div className="flex justify-end pt-1">
              <a
                href={selectedImage.dataUrl}
                download={selectedImage.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#242D27] text-white text-xs font-medium"
              >
                <span>Ladda ner originalbild</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal för raderingsbekräftelse */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-[#FDF3F2] border border-[#E8C5C0] flex items-center justify-center mx-auto text-[#8C5248]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-xl font-semibold text-[#242D27]">
                Ta bort reklamation?
              </h3>
              <p className="text-xs text-[#66726A] font-light leading-relaxed">
                Är du säker på att du vill ta bort ärende {claim.claimNumber}? Detta kan inte ångras.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteClaim) onDeleteClaim(claim.id);
                  onBack();
                }}
                className="py-2.5 px-4 rounded-xl bg-[#8C5248] hover:bg-[#78433A] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Ja, ta bort
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
