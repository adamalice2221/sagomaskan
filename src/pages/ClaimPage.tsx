import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Image as ImageIcon,
  Copy,
  Printer,
  RotateCcw,
  Send,
  ArrowLeft,
  Search,
  ShieldCheck,
  Clock,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import {
  Claim,
  ClaimType,
  ClaimResolutionPreference,
  ClaimAttachment,
  PageRoute
} from '../types';
import { createClaim, findClaimByNumber } from '../services/claimsService';
import { useData } from '../context/DataContext';

interface ClaimPageProps {
  onNavigate: (page: PageRoute) => void;
}

const CLAIM_TYPES: ClaimType[] = [
  'Defekt/skadad produkt',
  'Felaktig produkt',
  'Produkt saknas',
  'Fel på tjänst',
  'Försenad leverans',
  'Annat'
];

const RESOLUTION_PREFERENCES: ClaimResolutionPreference[] = [
  'Reparation',
  'Ersättningsprodukt',
  'Prisavdrag',
  'Återbetalning',
  'Annat'
];

export const ClaimPage: React.FC<ClaimPageProps> = ({ onNavigate }) => {
  const { settings } = useData();

  // Active view tab: 'form' | 'search' | 'confirmed'
  const [activeView, setActiveView] = useState<'form' | 'search' | 'confirmed'>('form');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  const [orderNumber, setOrderNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [productName, setProductName] = useState('');
  const [articleNumber, setArticleNumber] = useState('');

  const [claimType, setClaimType] = useState<ClaimType>('Defekt/skadad produkt');
  const [description, setDescription] = useState('');
  const [discoveredDate, setDiscoveredDate] = useState('');
  const [desiredResolution, setDesiredResolution] = useState<ClaimResolutionPreference>('Reparation');

  const [attachments, setAttachments] = useState<ClaimAttachment[]>([]);
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedClaim, setSubmittedClaim] = useState<Claim | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Search case state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedClaim, setSearchedClaim] = useState<Claim | null | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Vänligen ange ditt förnamn.';
    if (!lastName.trim()) newErrors.lastName = 'Vänligen ange ditt efternamn.';

    if (!email.trim()) {
      newErrors.email = 'Vänligen ange din e-postadress.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Vänligen ange en giltig e-postadress (t.ex. namn@doman.se).';
    }

    if (!phone.trim()) newErrors.phone = 'Vänligen ange ditt telefonnummer.';
    if (!address.trim()) newErrors.address = 'Vänligen ange din gatuadress.';
    if (!postalCode.trim()) newErrors.postalCode = 'Vänligen ange ditt postnummer.';
    if (!city.trim()) newErrors.city = 'Vänligen ange din ort.';

    if (!orderNumber.trim()) newErrors.orderNumber = 'Vänligen ange ordernummer eller fakturanummer.';
    if (!purchaseDate) newErrors.purchaseDate = 'Vänligen ange köpdatum.';
    if (!productName.trim()) newErrors.productName = 'Vänligen ange produkt eller tjänst som reklamationen gäller.';

    if (!claimType) newErrors.claimType = 'Vänligen välj typ av reklamation.';
    if (!discoveredDate) newErrors.discoveredDate = 'Vänligen ange när problemet upptäcktes.';
    if (!description.trim() || description.trim().length < 10) {
      newErrors.description = 'Beskriv problemet så utförligt som möjligt (minst 10 tecken).';
    }
    if (!desiredResolution) newErrors.desiredResolution = 'Välj önskad åtgärd.';

    if (!confirmedAccurate) {
      newErrors.confirmedAccurate = 'Du måste bekräfta att uppgifterna du lämnat är korrekta.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file uploads (converts to base64 DataURL for offline/online persistence)
  const handleProcessFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      // 10 MB limit
      if (file.size > 10 * 1024 * 1024) {
        alert(`Filen "${file.name}" är för stor. Maximal filstorlek är 10 MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const isImage = file.type.startsWith('image/');
        const newAttachment: ClaimAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          category: isImage ? 'product_damage' : 'receipt_invoice',
          uploadedAt: new Date().toISOString()
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Reset form
  const handleResetForm = () => {
    setFirstName('');
    setLastName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPostalCode('');
    setCity('');
    setOrderNumber('');
    setPurchaseDate('');
    setProductName('');
    setArticleNumber('');
    setClaimType('Defekt/skadad produkt');
    setDescription('');
    setDiscoveredDate('');
    setDesiredResolution('Reparation');
    setAttachments([]);
    setConfirmedAccurate(false);
    setErrors({});
    setShowResetConfirm(false);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const claim = await createClaim({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        orderNumber: orderNumber.trim(),
        purchaseDate,
        productName: productName.trim(),
        articleNumber: articleNumber.trim(),
        claimType,
        description: description.trim(),
        discoveredDate,
        desiredResolution,
        attachments,
        confirmedAccurate
      });

      setSubmittedClaim(claim);
      setActiveView('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Kunde inte skicka reklamation:', err);
      alert('Ett fel inträffade när reklamationen skulle skickas. Vänligen försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Claim Number to clipboard
  const handleCopyClaimNumber = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Search case
  const handleSearchCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = findClaimByNumber(searchQuery.trim());
    setSearchedClaim(found || null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242D27] pb-20">
      
      {/* Topp-header med Företagslogotyp/namn och introduktion */}
      <section className="bg-[#FAF8F5] border-b border-[#E6DFD3] pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Brödsmulor & Navigering */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#66726A] hover:text-[#242D27] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tillbaka till butiken</span>
            </button>

            {/* Vy-växlare mellan formulär och sök ärende */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveView('form');
                  setSearchedClaim(undefined);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'form' || activeView === 'confirmed'
                    ? 'bg-[#242D27] text-[#FAF8F5] shadow-xs'
                    : 'text-[#66726A] hover:text-[#242D27]'
                }`}
              >
                Ny reklamation
              </button>
              <button
                type="button"
                onClick={() => setActiveView('search')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'search'
                    ? 'bg-[#242D27] text-[#FAF8F5] shadow-xs'
                    : 'text-[#66726A] hover:text-[#242D27]'
                }`}
              >
                Sök ärende
              </button>
            </div>
          </div>

          {/* Företagshuvud / Logotyp */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-6 border-b border-[#E6DFD3]">
            {settings?.logoImageUrl ? (
              <img
                src={settings.logoImageUrl}
                alt="Sagomaskan"
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] flex items-center justify-center text-[#526E5F] font-serif font-bold text-xl shadow-xs">
                S
              </div>
            )}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#6B8E7B]">
                Kundservice & Reklamation
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-semibold mt-0.5">
                Reklamationsformulär
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#66726A] font-light leading-relaxed mt-4">
            Vi strävar alltid efter högsta hantverkskvalitet och nöjda kunder. Om något inte motsvarar dina förväntningar hjälper vi dig gärna. Fyll i uppgifterna nedan så återkommer vi personligen så snart som möjligt.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* =================================================================== */}
        {/* VY 1: SÖK BEFINTLIGT ÄRENDE */}
        {/* =================================================================== */}
        {activeView === 'search' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#242D27] font-medium flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#6B8E7B]" />
                  <span>Sök och följ ditt reklamationsärende</span>
                </h2>
                <p className="text-xs text-[#66726A] font-light mt-1">
                  Har du redan skickat in en reklamation? Ange ditt ärendenummer nedan för att kontrollera aktuell status.
                </p>
              </div>

              <form onSubmit={handleSearchCase} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="T.ex. REK-2026-0001"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-sm text-[#242D27] focus:outline-none focus:border-[#6B8E7B] focus:ring-1 focus:ring-[#6B8E7B] uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Sök ärende</span>
                </button>
              </form>

              {/* Sökresultat */}
              {searchedClaim !== undefined && (
                <div className="pt-4 border-t border-[#E6DFD3]">
                  {searchedClaim ? (
                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6DFD3]">
                        <div>
                          <div className="text-xs text-[#66726A]">Ärendenummer</div>
                          <div className="font-serif text-xl font-bold text-[#242D27]">
                            {searchedClaim.claimNumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#66726A]">Status:</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              searchedClaim.status === 'Ny'
                                ? 'bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]'
                                : searchedClaim.status === 'Under behandling'
                                ? 'bg-[#FFF8E6] text-[#8C6D1F] border border-[#F3E2B8]'
                                : searchedClaim.status === 'Godkänd'
                                ? 'bg-[#EBF3EE] text-[#2E6B47] border border-[#C4E3D1]'
                                : 'bg-[#F3EFE8] text-[#66726A]'
                            }`}
                          >
                            {searchedClaim.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#66726A]">Kund:</span>{' '}
                          <span className="font-medium">{searchedClaim.firstName} {searchedClaim.lastName}</span>
                        </div>
                        <div>
                          <span className="text-[#66726A]">Ordernummer:</span>{' '}
                          <span className="font-medium">{searchedClaim.orderNumber}</span>
                        </div>
                        <div>
                          <span className="text-[#66726A]">Produkt:</span>{' '}
                          <span className="font-medium">{searchedClaim.productName}</span>
                        </div>
                        <div>
                          <span className="text-[#66726A]">Registrerat:</span>{' '}
                          <span className="font-medium">
                            {new Date(searchedClaim.createdAt).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-[#66726A]">
                        <span className="font-medium text-[#242D27]">Beskrivning:</span> {searchedClaim.description}
                      </div>

                      {searchedClaim.adminNotes && (
                        <div className="p-3 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] text-xs space-y-1">
                          <div className="font-semibold text-[#242D27]">Meddelande från kundservice:</div>
                          <p className="text-[#66726A] font-light leading-relaxed">
                            {searchedClaim.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#66726A] space-y-2">
                      <AlertCircle className="w-6 h-6 mx-auto text-[#8C5248]" />
                      <p className="font-medium text-[#242D27]">Inget ärende hittades med det angivna numret.</p>
                      <p className="font-light">Kontrollera stavningen och formatet (t.ex. REK-2026-0001).</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VY 2: BEKRÄFTELSESIDA EFTER LYCKAT INSKICK */}
        {/* =================================================================== */}
        {activeView === 'confirmed' && submittedClaim && (
          <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xs">
              
              <div className="w-16 h-16 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] flex items-center justify-center mx-auto text-[#526E5F]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242D27]">
                  Tack! Din reklamation har skickats in.
                </h2>
                <p className="text-xs sm:text-sm text-[#66726A] font-light leading-relaxed">
                  Vi har tagit emot ditt ärende och återkommer så snart som möjligt. En bekräftelse har registrerats i vårt system.
                </p>
              </div>

              {/* Ärendenummer-kort */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] max-w-md mx-auto space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#66726A]">
                  Ditt ärendenummer
                </div>
                <div className="font-serif text-3xl font-bold tracking-wider text-[#242D27]">
                  {submittedClaim.claimNumber}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyClaimNumber(submittedClaim.claimNumber)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#6B8E7B]" />
                    <span>{copiedCode ? 'Kopierat!' : 'Kopiera ärendenummer'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#6B8E7B]" />
                    <span>Skriv ut sammanfattning</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#66726A] font-light">
                  Spara detta ärendenummer för framtida kontakt och statusuppföljning.
                </p>
              </div>

              {/* Sammanfattning av uppgifter */}
              <div className="text-left bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 max-w-2xl mx-auto space-y-4 text-xs">
                <h3 className="font-serif text-base text-[#242D27] font-semibold pb-2 border-b border-[#E6DFD3] flex items-center justify-between">
                  <span>Sammanfattning av inskickade uppgifter</span>
                  <span className="text-xs font-sans font-light text-[#66726A]">
                    {new Date(submittedClaim.createdAt).toLocaleString('sv-SE')}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#66726A] block">Kontaktperson</span>
                    <span className="font-medium text-[#242D27]">
                      {submittedClaim.firstName} {submittedClaim.lastName}
                    </span>
                    {submittedClaim.company && (
                      <span className="text-[#66726A] block text-[11px]">{submittedClaim.company}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#66726A] block">Kontaktuppgifter</span>
                    <span className="font-medium text-[#242D27] block">{submittedClaim.email}</span>
                    <span className="font-medium text-[#242D27] block">{submittedClaim.phone}</span>
                  </div>
                  <div>
                    <span className="text-[#66726A] block">Adress</span>
                    <span className="font-medium text-[#242D27] block">
                      {submittedClaim.address}, {submittedClaim.postalCode} {submittedClaim.city}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#66726A] block">Order-/köpuppgift</span>
                    <span className="font-medium text-[#242D27] block">
                      Order: {submittedClaim.orderNumber} (Köpdatum: {submittedClaim.purchaseDate})
                    </span>
                    <span className="font-medium text-[#242D27] block">
                      Produkt: {submittedClaim.productName}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6DFD3] space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#66726A] block">Typ av reklamation</span>
                      <span className="font-medium text-[#242D27]">{submittedClaim.claimType}</span>
                    </div>
                    <div>
                      <span className="text-[#66726A] block">Önskad åtgärd</span>
                      <span className="font-medium text-[#242D27]">{submittedClaim.desiredResolution}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#66726A] block">Beskrivning av problemet</span>
                    <p className="text-[#242D27] font-light leading-relaxed mt-0.5">
                      {submittedClaim.description}
                    </p>
                  </div>

                  {submittedClaim.attachments.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[#66726A] block mb-1">
                        Bifogade filer ({submittedClaim.attachments.length} st)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {submittedClaim.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E6DFD3] text-[11px]"
                          >
                            <FileCheck className="w-3 h-3 text-[#526E5F]" />
                            <span className="truncate max-w-[150px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Åtgärdsknappar */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveView('form');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FAF8F5] border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
                >
                  Skicka en till reklamation
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-semibold tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Tillbaka till butiken
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VY 3: REKLAMATIONSFORMULÄRET */}
        {/* =================================================================== */}
        {activeView === 'form' && (
          <form onSubmit={handleSubmit} noValidate className="space-y-8 animate-in fade-in duration-300">
            
            {/* Övergripande felmeddelande om formuläret har fel vid submit */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FDF3F2] border border-[#E8C5C0] text-[#8C5248] text-xs space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Vissa obligatoriska uppgifter saknas eller behöver korrigeras:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-light pl-1">
                  {Object.values(errors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SEKTION 1: KUNDUPPGIFTER */}
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="pb-3 border-b border-[#E6DFD3]">
                <h2 className="font-serif text-xl sm:text-2xl text-[#242D27] font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#EBF3EE] text-[#526E5F] text-xs flex items-center justify-center font-sans font-bold">
                    1
                  </span>
                  <span>Kunduppgifter</span>
                </h2>
                <p className="text-xs text-[#66726A] font-light mt-1">
                  Ange kontaktuppgifter till personen eller företaget som gör reklamationen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="claim-firstName" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Förnamn <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                    }}
                    placeholder="Förnamn"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.firstName
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claim-lastName" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Efternamn <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                    }}
                    placeholder="Efternamn"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.lastName
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="claim-company" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  Företag <span className="text-[#66726A] font-light">(valfritt)</span>
                </label>
                <input
                  id="claim-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Företagsnamn (om tillämpligt)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#242D27] focus:outline-none focus:border-[#6B8E7B] focus:ring-1 focus:ring-[#6B8E7B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="claim-email" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    E-postadress <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="namn@exempel.se"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.email
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claim-phone" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Telefonnummer <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="070-123 45 67"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.phone
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="claim-address" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  Gatuadress <span className="text-[#8C5248]">*</span>
                </label>
                <input
                  id="claim-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="Gata och nummer"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                    errors.address
                      ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                      : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-[#8C5248] mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="claim-postalCode" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Postnummer <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-postalCode"
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      if (errors.postalCode) setErrors((prev) => ({ ...prev, postalCode: '' }));
                    }}
                    placeholder="123 45"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.postalCode
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.postalCode && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claim-city" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Ort <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    placeholder="Stockholm"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.city
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.city}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SEKTION 2: ORDER- OCH KÖPUPPGIFTER */}
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="pb-3 border-b border-[#E6DFD3]">
                <h2 className="font-serif text-xl sm:text-2xl text-[#242D27] font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#EBF3EE] text-[#526E5F] text-xs flex items-center justify-center font-sans font-bold">
                    2
                  </span>
                  <span>Order- och köpuppgifter</span>
                </h2>
                <p className="text-xs text-[#66726A] font-light mt-1">
                  Hjälp oss hitta ditt köp i våra register genom att ange order- eller fakturainformation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="claim-orderNumber" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Ordernummer / Fakturanummer <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-orderNumber"
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value);
                      if (errors.orderNumber) setErrors((prev) => ({ ...prev, orderNumber: '' }));
                    }}
                    placeholder="T.ex. #4821 eller FAKT-1049"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.orderNumber
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.orderNumber && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.orderNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claim-purchaseDate" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Datum för köp <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-purchaseDate"
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => {
                      setPurchaseDate(e.target.value);
                      if (errors.purchaseDate) setErrors((prev) => ({ ...prev, purchaseDate: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.purchaseDate
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.purchaseDate && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.purchaseDate}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="claim-productName" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Produkt eller tjänst som reklamationen gäller <span className="text-[#8C5248]">*</span>
                  </label>
                  <input
                    id="claim-productName"
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      if (errors.productName) setErrors((prev) => ({ ...prev, productName: '' }));
                    }}
                    placeholder="T.ex. Handvirkad Babyfilt Mose"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                      errors.productName
                        ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                        : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                    }`}
                  />
                  {errors.productName && (
                    <p className="text-[11px] text-[#8C5248] mt-1">{errors.productName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="claim-articleNumber" className="block text-xs font-medium text-[#242D27] mb-1.5">
                    Artikelnummer <span className="text-[#66726A] font-light">(valfritt)</span>
                  </label>
                  <input
                    id="claim-articleNumber"
                    type="text"
                    value={articleNumber}
                    onChange={(e) => setArticleNumber(e.target.value)}
                    placeholder="T.ex. ART-1024"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#242D27] focus:outline-none focus:border-[#6B8E7B] focus:ring-1 focus:ring-[#6B8E7B]"
                  />
                </div>
              </div>
            </div>

            {/* SEKTION 3: REKLAMATION */}
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-3 border-b border-[#E6DFD3]">
                <h2 className="font-serif text-xl sm:text-2xl text-[#242D27] font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#EBF3EE] text-[#526E5F] text-xs flex items-center justify-center font-sans font-bold">
                    3
                  </span>
                  <span>Reklamation</span>
                </h2>
                <p className="text-xs text-[#66726A] font-light mt-1">
                  Beskriv felet och hur du önskar att vi hanterar ditt ärende.
                </p>
              </div>

              {/* Typ av reklamation */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-2">
                  Typ av reklamation <span className="text-[#8C5248]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CLAIM_TYPES.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        claimType === type
                          ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#242D27] font-medium shadow-2xs'
                          : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#66726A] hover:border-[#6B8E7B]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="claimType"
                        value={type}
                        checked={claimType === type}
                        onChange={() => setClaimType(type)}
                        className="w-4 h-4 text-[#526E5F] focus:ring-[#526E5F]"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* När upptäcktes problemet? */}
              <div className="max-w-md">
                <label htmlFor="claim-discoveredDate" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  När upptäcktes problemet? <span className="text-[#8C5248]">*</span>
                </label>
                <input
                  id="claim-discoveredDate"
                  type="date"
                  required
                  value={discoveredDate}
                  onChange={(e) => {
                    setDiscoveredDate(e.target.value);
                    if (errors.discoveredDate) setErrors((prev) => ({ ...prev, discoveredDate: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors ${
                    errors.discoveredDate
                      ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                      : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                  }`}
                />
                {errors.discoveredDate && (
                  <p className="text-[11px] text-[#8C5248] mt-1">{errors.discoveredDate}</p>
                )}
              </div>

              {/* Beskriv problemet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="claim-description" className="block text-xs font-medium text-[#242D27]">
                    Beskriv problemet/reklamationen <span className="text-[#8C5248]">*</span>
                  </label>
                  <span className="text-[11px] text-[#66726A] font-light">
                    {description.length} tecken
                  </span>
                </div>
                <textarea
                  id="claim-description"
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Beskriv felet så utförligt som möjligt. Exempelvis vad som är skadat, hur felet uppstod, eller om något saknas i försändelsen..."
                  className={`w-full p-4 rounded-xl bg-[#FAF8F5] border text-xs text-[#242D27] focus:outline-none focus:ring-1 transition-colors leading-relaxed ${
                    errors.description
                      ? 'border-[#8C5248] focus:border-[#8C5248] focus:ring-[#8C5248]'
                      : 'border-[#E6DFD3] focus:border-[#6B8E7B] focus:ring-[#6B8E7B]'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-[#8C5248] mt-1">{errors.description}</p>
                )}
              </div>

              {/* Hur vill kunden att ärendet ska hanteras? */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-2">
                  Hur vill du att ärendet ska hanteras? <span className="text-[#8C5248]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {RESOLUTION_PREFERENCES.map((pref) => (
                    <label
                      key={pref}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        desiredResolution === pref
                          ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#242D27] font-medium shadow-2xs'
                          : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#66726A] hover:border-[#6B8E7B]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="desiredResolution"
                        value={pref}
                        checked={desiredResolution === pref}
                        onChange={() => setDesiredResolution(pref)}
                        className="w-4 h-4 text-[#526E5F] focus:ring-[#526E5F]"
                      />
                      <span>{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* SEKTION 4: BILAGOR */}
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="pb-3 border-b border-[#E6DFD3]">
                <h2 className="font-serif text-xl sm:text-2xl text-[#242D27] font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#EBF3EE] text-[#526E5F] text-xs flex items-center justify-center font-sans font-bold">
                    4
                  </span>
                  <span>Bilagor</span>
                </h2>
                <p className="text-xs text-[#66726A] font-light mt-1">
                  Bifoga gärna bilder på skadan eller produkten samt kvitto, faktura eller annan dokumentation för snabbare handläggning.
                </p>
              </div>

              {/* Drag and Drop yta */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#6B8E7B] bg-[#EBF3EE]/50'
                    : 'border-[#E6DFD3] bg-[#FAF8F5] hover:bg-[#F3EFE8]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6DFD3] flex items-center justify-center mx-auto text-[#6B8E7B] mb-3 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-[#242D27]">
                  Dra och släpp filer här, eller klicka för att bläddra
                </div>
                <p className="text-[11px] text-[#66726A] font-light mt-1">
                  Stöder bilder (JPG, PNG, WebP) och dokument (PDF). Max 10 MB per fil.
                </p>
              </div>

              {/* Uppladdade filer lista */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-[#242D27]">
                    Uppladdade filer ({attachments.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((att) => {
                      const isImage = att.type.startsWith('image/');
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isImage ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-10 h-10 rounded-lg object-cover border border-[#E6DFD3] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white border border-[#E6DFD3] flex items-center justify-center text-[#526E5F] flex-shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[#242D27] truncate max-w-[180px]">
                                {att.name}
                              </p>
                              <p className="text-[10px] text-[#66726A]">
                                {(att.size / 1024).toFixed(0)} KB •{' '}
                                {att.category === 'product_damage' ? 'Skadebild' : 'Kvitto/Dokument'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1.5 rounded-lg text-[#66726A] hover:text-[#8C5248] hover:bg-[#FDF3F2] transition-colors cursor-pointer"
                            title="Ta bort fil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SEKTION 5: BEKRÄFTELSE & INTEGRITETSPOLICY */}
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-[#E6DFD3]">
                <h2 className="font-serif text-xl sm:text-2xl text-[#242D27] font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#EBF3EE] text-[#526E5F] text-xs flex items-center justify-center font-sans font-bold">
                    5
                  </span>
                  <span>Bekräftelse</span>
                </h2>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={confirmedAccurate}
                  onChange={(e) => {
                    setConfirmedAccurate(e.target.checked);
                    if (errors.confirmedAccurate) {
                      setErrors((prev) => ({ ...prev, confirmedAccurate: '' }));
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded text-[#526E5F] focus:ring-[#526E5F] cursor-pointer"
                />
                <span className="text-xs text-[#242D27] font-medium select-none">
                  Jag bekräftar att uppgifterna jag lämnat är korrekta. <span className="text-[#8C5248]">*</span>
                </span>
              </label>
              {errors.confirmedAccurate && (
                <p className="text-[11px] text-[#8C5248] pl-7">{errors.confirmedAccurate}</p>
              )}

              {/* Information om integritetspolicy */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#66726A] flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#526E5F] flex-shrink-0 mt-0.5" />
                <p className="font-light leading-relaxed">
                  Personuppgifterna du lämnar behandlas i enlighet med gällande dataskyddsförordning (GDPR) och vår integritetspolicy, enbart i syfte att utreda, administrera och åtgärda ditt reklamationsärende.
                </p>
              </div>
            </div>

            {/* SEKTION 6: SKICKA IN & ÅTERSTÄLL */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Återställ-knapp */}
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-medium text-[#66726A] hover:text-[#8C5248] hover:bg-[#FDF3F2] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Återställ formulär</span>
              </button>

              {/* Skicka-knapp */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-full bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-semibold tracking-wider transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FAF8F5] border-t-transparent rounded-full animate-spin" />
                    <span>Skickar reklamation...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Skicka reklamation</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>

      {/* Bekräftelsemodal för återställning */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-[#242D27]">
              Återställ formuläret?
            </h3>
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Är du säker på att du vill rensa alla ifyllda uppgifter? Detta kan inte ångras.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="py-2.5 px-4 rounded-xl bg-[#8C5248] hover:bg-[#78433A] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Rensa allt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
