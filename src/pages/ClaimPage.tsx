import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  UploadCloud,
  X,
  CheckCircle2,
  ShieldCheck,
  Clock,
  FileText,
  ArrowLeft,
  Info
} from 'lucide-react';
import { createClaim, compressClaimImage } from '../services/claimsService';

interface ClaimPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

interface ImageUploadItem {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

export const ClaimPage: React.FC<ClaimPageProps> = ({ onNavigateHome, onNavigateShop }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState('');
  const [description, setDescription] = useState('');
  const [discoveredAt, setDiscoveredAt] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<{ id: string; orderNumber: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const availableSlots = 5 - images.length;
    if (availableSlots <= 0) {
      setErrorMessage('Du kan ladda upp maximalt 5 bilder.');
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    setIsCompressing(true);

    try {
      const newUploads: ImageUploadItem[] = [];
      for (const file of filesToProcess) {
        // Validation: file types
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
          setErrorMessage(`Filen "${file.name}" stöds inte. Vänligen välj JPG, PNG eller WebP.`);
          continue;
        }

        // Validation: 5 MB limit
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`Filen "${file.name}" är större än 5 MB. Välj en mindre bild.`);
          continue;
        }

        const compressedDataUrl = await compressClaimImage(file);
        newUploads.push({
          id: Math.random().toString(36).substring(2, 9),
          dataUrl: compressedDataUrl,
          name: file.name,
          size: file.size
        });
      }

      setImages((prev) => [...prev, ...newUploads]);
    } catch (err) {
      console.error('Fel vid bildkomprimering:', err);
      setErrorMessage('Ett fel uppstod när bilden skulle förberedas. Försök igen med en annan bild.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!orderNumber.trim()) {
      setErrorMessage('Vänligen fyll i ditt ordernummer.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Vänligen fyll i ditt namn.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Vänligen ange en giltig e-postadress.');
      return;
    }
    if (!product.trim()) {
      setErrorMessage('Vänligen ange vilken produkt ärendet gäller.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Vänligen beskriv problemet eller skadan på produkten.');
      return;
    }
    if (!discoveredAt.trim()) {
      setErrorMessage('Vänligen ange när problemet upptäcktes.');
      return;
    }

    setIsSubmitting(true);

    try {
      const claimId = await createClaim({
        orderNumber: orderNumber.trim(),
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        product: product.trim(),
        description: description.trim(),
        discoveredAt: discoveredAt.trim(),
        imageUrls: images.map((img) => img.dataUrl),
        additionalInfo: additionalInfo.trim() || undefined
      });

      setSubmittedClaim({
        id: claimId,
        orderNumber: orderNumber.trim()
      });
    } catch (err: any) {
      console.error('Fel vid skapande av reklamation:', err);
      setErrorMessage('Ett oväntat fel inträffade när reklamationen skulle skickas. Vänligen kontrollera dina uppgifter och försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Confirmation Screen
  if (submittedClaim) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#EBF3EE] text-[#526E5F] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
              Mottagen reklamation
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium">
              Tack! Din reklamation har skickats till oss.
            </h1>
            <p className="text-sm sm:text-base text-[#66726A] font-light max-w-lg mx-auto leading-relaxed">
              Vi har tagit emot ditt ärende för beställning <strong className="text-[#242D27]">{submittedClaim.orderNumber}</strong>. Vi går igenom din beskrivning och eventuella bilder så snart som möjligt.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between text-[#66726A]">
              <span>Ärendenummer:</span>
              <span className="font-mono font-medium text-[#242D27]">{submittedClaim.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[#66726A]">
              <span>Ordernummer:</span>
              <span className="font-medium text-[#242D27]">{submittedClaim.orderNumber}</span>
            </div>
            <div className="flex justify-between text-[#66726A]">
              <span>Bekräftelse skickas till:</span>
              <span className="font-medium text-[#242D27]">{email}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNavigateShop}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-colors"
            >
              Tillbaka till butiken
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#E6DFD3] text-[#242D27] text-xs font-medium hover:bg-[#F3EFE8] transition-colors"
            >
              Till startsidan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Kundservice
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#242D27] font-medium">
          Reklamation
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Har du fått en vara som är felaktig eller skadad? Här kan du skicka in en reklamation till oss. Beskriv vad som har hänt och bifoga gärna bilder så hjälper vi dig vidare.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left: Consumer rights info & guidelines (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <h3 className="font-serif text-xl font-medium text-[#242D27] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#6B8E7B]" />
              <span>Dina rättigheter vid reklamation</span>
            </h3>
            
            <p className="text-xs text-[#66726A] font-light leading-relaxed">
              Enligt konsumentköplagen har du lagstadgad rätt att reklamera en vara om den har ett ursprungligt fel, är trasig eller inte motsvarar det som avtalats.
            </p>

            <div className="space-y-4 pt-2 border-t border-[#E6DFD3]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#242D27] block font-medium">3 års reklamationsrätt</strong>
                  <span className="text-[#66726A] font-light leading-relaxed block mt-0.5">
                    Du har rätt att reklamera ursprungliga fel i upp till tre (3) år från den dag du tog emot varan.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#242D27] block font-medium">Reklamera inom skälig tid (2 månader)</strong>
                  <span className="text-[#66726A] font-light leading-relaxed block mt-0.5">
                    När du upptäckt felet ska du anmäla det till oss inom skälig tid. Reklamation som görs inom två (2) månader från att felet upptäcktes räknas alltid som lämnad i rätt tid.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#242D27] block font-medium">Handläggning & åtgärd</strong>
                  <span className="text-[#66726A] font-light leading-relaxed block mt-0.5">
                    Vi granskar varje ärende personligen. Vid ett godkänt ursprungligt fel åtgärdar vi det i första hand genom reparation eller omleverans utan kostnad, och i andra hand genom prisavdrag eller hävning/återbetalning.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#242D27] block font-medium">Hantverkets naturliga karaktär</strong>
                  <span className="text-[#66726A] font-light leading-relaxed block mt-0.5">
                    Eftersom våra produkter är virkade för hand har varje exemplar en unik karaktär. Mindre variationer i maskor eller färgtoner är en naturlig del av genuint hantverk, men varan ska givetvis vara felfri och hålla utlovad kvalitet.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-2 text-xs text-[#66726A]">
            <p className="font-serif text-sm font-medium text-[#242D27]">
              Integritet & datahantering
            </p>
            <p className="font-light leading-relaxed">
              Vi samlar endast in de uppgifter som behövs för att hantera och följa upp ditt reklamationsärende. Dina uppgifter delas aldrig vidare till tredje part.
            </p>
          </div>
        </div>

        {/* Right: Claim Submission Form (7 cols) */}
        <div className="md:col-span-7 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-serif text-xl font-medium text-[#242D27] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#6B8E7B]" />
                <span>Skicka reklamationsanmälan</span>
              </h3>
              <p className="text-xs text-[#66726A] font-light mt-1">
                Fält markerade med * är obligatoriska.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order number */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Ordernummer *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="T.ex. #SAG-1234 eller datum"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Ditt namn *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="För- och efternamn"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  E-postadress *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@exempel.se"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Telefonnummer <span className="text-[#8F9992] font-normal">(valfritt)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="070-123 45 67"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Vilken produkt gäller ärendet? *
                </label>
                <input
                  type="text"
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="T.ex. Virkad kanin i linnebeige"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              {/* Discovered At */}
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  När upptäcktes felet? *
                </label>
                <input
                  type="text"
                  required
                  value={discoveredAt}
                  onChange={(e) => setDiscoveredAt(e.target.value)}
                  placeholder="T.ex. Vid uppackning / 2025-05-10"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1">
                Beskrivning av problemet *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv vad felet är så detaljerat som möjligt (t.ex. trasig söm, felaktig färg, skada under transport)..."
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Image upload area */}
            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1">
                Bilder på felet <span className="text-[#8F9992] font-normal">(valfritt men underlättar handläggningen, max 5 bilder)</span>
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-[#D4CDC1] hover:border-[#6B8E7B] rounded-xl p-6 text-center bg-[#FAF8F5] cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <UploadCloud className="w-7 h-7 text-[#6B8E7B] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#242D27]">
                  {isCompressing ? 'Förbereder bilder...' : 'Klicka eller dra och släpp bilder här'}
                </p>
                <p className="text-[11px] text-[#8F9992] mt-1">
                  JPG, PNG eller WebP upp till 5 MB per bild
                </p>
              </div>

              {/* Uploaded Thumbnails */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[#E6DFD3] aspect-square bg-[#F3EFE8]">
                      <img
                        src={img.dataUrl}
                        alt="Uppladdad bild"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Ta bort bild"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional info */}
            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1">
                Övrig information <span className="text-[#8F9992] font-normal">(valfritt)</span>
              </label>
              <textarea
                rows={2}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Något annat du vill att vi ska veta kring ärendet?"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#242D27] text-[#FAF8F5] rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#6B8E7B] disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Skickar reklamation...</span>
                  </>
                ) : (
                  <span>Skicka reklamation</span>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
