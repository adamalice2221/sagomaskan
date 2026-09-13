import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Check,
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  Wand2,
  RotateCcw,
  Info,
  ShieldAlert,
  Layers,
  Palette as PaletteIcon
} from 'lucide-react';
import { Product, Category, ProductColor, ProductPersonality, AgeGroup, ProductStockStatus } from '../../types';
import { PALETTE } from '../../data/products';
import { uploadProductImage } from '../../services/storage';

interface AdminProductEditorProps {
  initialProduct?: Product | null;
  categories: Category[];
  onSave: (productData: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

const PERSONALITIES: ProductPersonality[] = [
  'Lugn',
  'Busig',
  'Mysig',
  'Lekfull',
  'Nyfiken',
  'Äventyrlig',
  'Klassisk',
  'Annat'
];

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  initialProduct,
  categories,
  onSave,
  onCancel
}) => {
  const isEditing = !!initialProduct;

  // Form State - Grundinformation
  const [name, setName] = useState(initialProduct?.name || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || categories[0]?.id || 'Mössor');
  const [categoryName, setCategoryName] = useState(initialProduct?.category || categories[0]?.name || 'Mössor');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(initialProduct?.ageGroup || 'Barn');
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [price, setPrice] = useState<number>(initialProduct?.price || 225);

  // Produktens saga & Sago-idé (AI-inspiration)
  const [story, setStory] = useState(initialProduct?.story || '');
  const [storyIdea, setStoryIdea] = useState(initialProduct?.storyIdea || initialProduct?.inspiration || '');
  const [personality, setPersonality] = useState<string>(initialProduct?.personality || 'Lugn');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Varianter & Material
  const [colors, setColors] = useState<ProductColor[]>(
    initialProduct?.colors && initialProduct.colors.length > 0
      ? initialProduct.colors
      : [
          { name: 'Natur', hex: '#F5F2EB' },
          { name: 'Salvia', hex: '#8EA396' }
        ]
  );
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8EA396');

  const [sizes, setSizes] = useState<string[]>(initialProduct?.sizes || []);
  const [newSize, setNewSize] = useState('');

  const [material, setMaterial] = useState(initialProduct?.material || '100% mjuk merinoull');
  const [careInstructions, setCareInstructions] = useState(
    initialProduct?.careInstructions || 'Handtvätt 30°C. Plantorkas varsamt.'
  );

  // Bilder
  const [images, setImages] = useState<string[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images
      : initialProduct?.image
      ? [initialProduct.image]
      : []
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Baby info (valfritt)
  const [recommendedAge, setRecommendedAge] = useState(initialProduct?.recommendedAge || '');
  const [safetyInformation, setSafetyInformation] = useState(initialProduct?.safetyInformation || '');

  // Lager / Inställningar
  const [stockQuantity, setStockQuantity] = useState<number>(
    typeof initialProduct?.stockQuantity === 'number' && !isNaN(initialProduct.stockQuantity)
      ? Math.max(0, Math.floor(initialProduct.stockQuantity))
      : 0
  );
  const [stockStatus, setStockStatus] = useState<ProductStockStatus>(
    initialProduct?.stockStatus || ((initialProduct?.stockQuantity ?? 0) > 0 ? 'I lager' : 'Slut i lager')
  );
  const [madeToOrder, setMadeToOrder] = useState<boolean>(initialProduct?.madeToOrder ?? true);
  const [featured, setFeatured] = useState<boolean>(initialProduct?.featured ?? false);
  const [newProduct, setNewProduct] = useState<boolean>(initialProduct?.newProduct ?? false);
  const [published, setPublished] = useState<boolean>(initialProduct?.published ?? true);

  // UI status
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Beräkna ordantal i sagan
  const wordCount = story.trim() ? story.trim().split(/\s+/).length : 0;
  const suggestionWordCount = aiSuggestion?.trim() ? aiSuggestion.trim().split(/\s+/).length : 0;

  // Synka kategorinamn vid val
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const cat = categories.find((c) => c.id === selectedId);
    if (cat) {
      setCategoryName(cat.name);
    }
  };

  // Färghandläggare
  const addColor = (nameToAdd?: string, hexToAdd?: string) => {
    const name = nameToAdd || newColorName.trim();
    const hex = hexToAdd || newColorHex;
    if (!name) return;

    if (!colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setColors((prev) => [...prev, { name, hex }]);
    }
    if (!nameToAdd) {
      setNewColorName('');
    }
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Storlekshandläggare
  const addSize = () => {
    if (!newSize.trim()) return;
    if (!sizes.includes(newSize.trim())) {
      setSizes((prev) => [...prev, newSize.trim()]);
    }
    setNewSize('');
  };

  const removeSize = (size: string) => {
    setSizes((prev) => prev.filter((s) => s !== size));
  };

  // Bildhandläggare
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploadError(null);
    setUploadingImages(true);

    const uploadedUrls: string[] = [];
    try {
      for (const file of Array.from(files) as File[]) {
        if (!file.type.startsWith('image/')) {
          continue; // skip non-images
        }
        const url = await uploadProductImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Fel vid bilduppladdning:", err);
      setImageUploadError(err?.message || 'Ett fel uppstod vid bilduppladdningen. Vänligen försök igen.');
    } finally {
      setUploadingImages(false);
      // Reset input so the same files can be selected again if needed
      e.target.value = '';
    }
  };

  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const makeMainImage = (index: number) => {
    if (index === 0 || index >= images.length) return;
    const newImages = [...images];
    const selected = newImages.splice(index, 1)[0];
    newImages.unshift(selected);
    setImages(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  // AI Saga-generering
  const handleGenerateAiStory = async () => {
    // Inte ett krav att alla produktfält är ifyllda – sagan anpassas efter det underlag som finns
    setAiError(null);
    setAiGenerating(true);

    const payload = {
      productName: name.trim(),
      name: name.trim(),
      categoryName,
      category: categoryName,
      ageGroup,
      colors: colors.map((c) => (typeof c === 'string' ? c : c.name)),
      materials: material.trim(),
      material: material.trim(),
      personality,
      tone: personality,
      storyIdea: storyIdea.trim(),
      inspiration: storyIdea.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim()
    };

    console.groupCollapsed('[Sagomaskan] Anropar /api/ai/story');
    console.log('Request Payload:', payload);

    try {
      const res = await fetch('/api/ai/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Kunde inte tolka JSON-respons från servern:', responseText);
      }

      console.log('HTTP Status:', res.status, res.statusText);
      console.log('Response Body:', data);

      if (!res.ok || data.success === false) {
        console.error('API returnerade felkod/status:', {
          status: res.status,
          error: data.error,
          details: data.details,
          debug: data.debug
        });
        throw new Error(data.error || 'Det gick inte att skapa sagoförslaget just nu. Försök igen om en liten stund.');
      }

      if (data.story) {
        setAiSuggestion(data.story);
        setStory(data.story);
        if (data.source === 'fallback') {
          console.info('Sagoförslag skapat via ateljéns hantverksmall (fallback):', data.debug);
        } else {
          console.info('Sagoförslag skapat via Gemini AI modell:', data.debug?.model || 'gemini');
        }
      } else {
        throw new Error('Inget giltigt sagoförslag returnerades från servern.');
      }
    } catch (err: any) {
      console.error('AI Story Error:', err);
      setAiError(err?.message || 'Det gick inte att skapa sagoförslaget just nu. Kontrollera uppgifterna och försök igen.');
    } finally {
      console.groupEnd();
      setAiGenerating(false);
    }
  };

  // Spara produkt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Produktnamn måste fyllas i.');
      return;
    }

    if (price <= 0) {
      setFormError('Priset måste vara större än 0 kr.');
      return;
    }

    // Validera lagerantal (endast heltal >= 0)
    const sanitizedStockQuantity = Math.max(0, Math.floor(Number(stockQuantity) || 0));
    if (isNaN(sanitizedStockQuantity) || sanitizedStockQuantity < 0) {
      setFormError('Lagerantal måste vara ett heltal på 0 eller högre.');
      return;
    }

    setSaving(true);
    try {
      const primaryImage = images[0] || '';
      const imageList = images.length > 0 ? images : (primaryImage ? [primaryImage] : []);
      const computedStockStatus: ProductStockStatus = sanitizedStockQuantity > 0 ? 'I lager' : 'Slut i lager';

      const payload: Partial<Product> = {
        name: name.trim(),
        categoryId: categoryId || 'Mössor',
        category: categoryName || 'Mössor',
        ageGroup: ageGroup || 'Barn',
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        colors: colors || [],
        sizes: sizes || [],
        material: material.trim(),
        careInstructions: careInstructions.trim(),
        images: imageList,
        image: primaryImage,
        story: story.trim(),
        storyIdea: storyIdea.trim(),
        inspiration: storyIdea.trim(),
        personality: personality || 'Lugn',
        recommendedAge: recommendedAge.trim(),
        safetyInformation: safetyInformation.trim(),
        stockQuantity: sanitizedStockQuantity,
        stockStatus: computedStockStatus,
        madeToOrder: Boolean(madeToOrder),
        featured: Boolean(featured),
        newProduct: Boolean(newProduct),
        published: Boolean(published)
      };

      await onSave(payload);
    } catch (err: any) {
      console.error('Save error:', err);
      setFormError('Det gick inte att spara produkten: ' + (err?.message || 'Kontrollera uppgifterna.'));
      setSaving(false);
    }
  };

  const isBabyProduct =
    ageGroup === 'Baby' ||
    categoryName.toLowerCase().includes('skallr') ||
    categoryName.toLowerCase().includes('bitring') ||
    categoryName.toLowerCase().includes('baby');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Toppmeny & Spara */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD3]">
        <div className="flex items-center gap-3">
          <button
            id="editor-cancel-header-btn"
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-[#F3EFE8] hover:bg-[#E6DFD3] text-[#242D27] transition-colors cursor-pointer"
            title="Tillbaka till produktlistan"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
              {isEditing ? 'Redigera produkt' : 'Skapa ny produkt'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#242D27] font-medium leading-tight">
              {name || 'Namnlös produkt'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="editor-cancel-top-btn"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-xs text-[#66726A] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
          >
            Avbryt
          </button>
          <button
            id="product-save-top-btn"
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploadingImages}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] active:scale-[0.98] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Sparar...' : uploadingImages ? 'Laddar upp bild...' : 'Spara produkt'}</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-[#F8EFEF] border border-[#E4C9C9] text-xs text-[#8C5248] flex items-center gap-2.5 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* 1. GRUNDINFORMATION */}
        <section className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              1. Grundinformation
            </h2>
            <p className="text-xs text-[#66726A] font-light mt-0.5">
              Produktnamn, kategori, målgrupp och prissättning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Produktnamn */}
            <div className="sm:col-span-2">
              <label htmlFor="product-name-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Produktnamn *
              </label>
              <input
                id="product-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Klassisk virkad mössa – Barn"
                required
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Kategori */}
            <div>
              <label htmlFor="product-category-select" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Kategori *
              </label>
              <select
                id="product-category-select"
                value={categoryId}
                onChange={handleCategoryChange}
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Åldersgrupp */}
            <div>
              <label htmlFor="product-agegroup-select" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Åldersgrupp / Målgrupp *
              </label>
              <select
                id="product-agegroup-select"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              >
                <option value="Barn">Barn</option>
                <option value="Vuxen">Vuxen</option>
                <option value="Baby">Baby</option>
                <option value="Alla">Alla åldrar</option>
              </select>
            </div>

            {/* Pris */}
            <div>
              <label htmlFor="product-price-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Pris i SEK (inkl. moms) *
              </label>
              <input
                id="product-price-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="1"
                step="1"
                required
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Kort beskrivning */}
            <div className="sm:col-span-2">
              <label htmlFor="product-shortdesc-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Kort beskrivning (visas i kort och listor)
              </label>
              <input
                id="product-shortdesc-input"
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="En mjuk och tidlös handgjord mössa i finaste ull..."
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Full beskrivning */}
            <div className="sm:col-span-2">
              <label htmlFor="product-fulldesc-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Full produktbeskrivning
              </label>
              <textarea
                id="product-fulldesc-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv hantverket, passformen och produktens detaljer..."
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-4 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* 2. PRODUKTENS SAGA (AI-STORYTELLING) */}
        <section className="bg-[#FAF8F5] border-2 border-[#DED4C5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] text-[#526E5F] text-[11px] font-semibold mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#6B8E7B]" />
                <span>Sagomaskans själ & storytelling</span>
              </div>
              <h2 className="font-serif text-2xl text-[#242D27] font-medium">
                2. Produktens saga
              </h2>
              <p className="text-xs text-[#66726A] font-light mt-0.5">
                Varje produkt har en egen poetisk berättelse som visas för kunden på produktsidan.
              </p>
            </div>

            <button
              type="button"
              id="ai-generate-story-btn"
              onClick={handleGenerateAiStory}
              disabled={aiGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6B8E7B] text-[#FAF8F5] text-xs font-medium hover:bg-[#526E5F] active:scale-[0.99] transition-all shadow-xs disabled:opacity-60 cursor-pointer self-start sm:self-auto"
            >
              <Wand2 className="w-4 h-4" />
              <span>
                {aiGenerating
                  ? 'Skapar saga...'
                  : story
                  ? 'Generera om saga med AI'
                  : 'Skapa saga med AI ✨'}
              </span>
            </button>
          </div>

          {/* Sago-idé & Inspiration */}
          <div className="p-5 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="product-story-idea-input" className="block text-xs font-semibold text-[#242D27]">
                  Sago-idé <span className="font-normal text-[#66726A]">(frivilligt)</span>
                </label>
                <span className="text-[11px] text-[#6B8E7B] font-medium">Används som inspiration för AI</span>
              </div>
              <input
                id="product-story-idea-input"
                type="text"
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                placeholder="Beskriv med några ord vilken känsla eller liten berättelse du vill att produkten ska få. (t.ex. En liten mössa för höstens första kalla promenad.)"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
              <p className="text-[11px] text-[#66726A] font-light mt-1.5">
                Hjälptext: Beskriv med några ord vilken känsla eller liten berättelse du vill att produkten ska få.
              </p>
            </div>

            {/* Önskad personlighet */}
            <div className="pt-2 border-t border-[#E6DFD3]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-medium text-[#242D27]">
                Önskad personlighet/ton för produkten:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPersonality(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      personality === p
                        ? 'bg-[#242D27] text-[#FAF8F5]'
                        : 'bg-[#FAF8F5] border border-[#E6DFD3] text-[#66726A] hover:border-[#6B8E7B]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {aiError && (
            <div className="p-3.5 rounded-xl bg-[#F8EFEF] border border-[#E4C9C9] text-xs text-[#8C5248] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI Förslag / Box */}
          {aiSuggestion && (
            <div className="p-5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#526E5F] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI-genererat sagoförslag
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#526E5F] font-medium border border-[#CDE0D4]">
                    {suggestionWordCount} ord
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="text-xs text-[#526E5F] hover:text-[#242D27] cursor-pointer"
                >
                  Dölj
                </button>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#CDE0D4]">
                <p className="font-serif italic text-sm sm:text-base text-[#242D27] leading-relaxed">
                  "{aiSuggestion}"
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  id="use-ai-suggestion-btn"
                  onClick={() => {
                    setStory(aiSuggestion);
                    setAiSuggestion(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#526E5F] text-[#FAF8F5] text-xs font-medium hover:bg-[#3B4F42] transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Använd detta förslag</span>
                </button>

                <button
                  type="button"
                  id="regenerate-ai-story-btn"
                  onClick={handleGenerateAiStory}
                  disabled={aiGenerating}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#CDE0D4] text-xs font-medium text-[#526E5F] hover:bg-[#EBF3EE] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Generera om</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="px-3 py-2 text-xs text-[#66726A] hover:text-[#242D27] cursor-pointer ml-auto"
                >
                  Avfärda
                </button>
              </div>
            </div>
          )}

          {/* Huvudsakligt sagotextfält */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="product-story-textarea" className="block text-xs font-semibold text-[#242D27]">
                Produktens saga (texten som visas på produktsidan)
              </label>
              <div className="flex items-center gap-2 text-[11px] text-[#66726A]">
                <span>{wordCount} ord</span>
                <span className="text-[#A8A8A8]">•</span>
                <span className={wordCount >= 60 && wordCount <= 130 ? 'text-[#526E5F] font-medium' : 'text-[#66726A]'}>
                  Rekommenderat: 60–120 ord
                </span>
              </div>
            </div>
            
            <textarea
              id="product-story-textarea"
              rows={4}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Det började med några mjuka maskor och en idé om något varmt att bära när hösten knackar på..."
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] leading-relaxed font-serif"
            />
            
            <p className="text-[11px] text-[#66726A] font-light leading-relaxed">
              Du kan när som helst redigera texten manuellt. Sagan visas i en vacker sektion under produktbilderna på den publika produktsidan.
            </p>
          </div>
        </section>

        {/* 3. PRODUKTBILDER & GALLERI */}
        <section className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              3. Produktbilder
            </h2>
            <p className="text-xs text-[#66726A] font-light mt-0.5">
              Ladda upp foton eller klistra in bildlänkar. Första bilden fungerar som huvudbild och visas i listor.
            </p>
          </div>

          {/* Hjälptext för bildstandardisering */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#66726A]">
            <Info className="w-4 h-4 text-[#6B8E7B] shrink-0" />
            <span>Produktbilden anpassas automatiskt till ett enhetligt format.</span>
          </div>

          {/* Bilder galleri */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group bg-[#FAF8F5] border-2 rounded-2xl overflow-hidden aspect-square flex flex-col justify-between p-2 transition-all border-[#E6DFD3] hover:border-[#6B8E7B]"
              >
                <img
                  src={img}
                  alt={`Produktbild ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-contain p-1"
                />

                {/* Badge if main */}
                <div className="relative z-10 flex items-center justify-between">
                  {idx === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242D27] text-[#FAF8F5] text-[10px] font-medium shadow-xs">
                      <Star className="w-3 h-3 fill-current text-[#E6DFD3]" />
                      Huvudbild
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeMainImage(idx)}
                      title="Gör till huvudbild"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#242D27]/80 hover:bg-[#242D27] text-[#FAF8F5] text-[10px] font-medium transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Star className="w-2.5 h-2.5" />
                      Gör till huvudbild
                    </button>
                  )}
                </div>

                {/* Actions overlay */}
                <div className="relative z-10 flex items-center justify-between gap-1 bg-[#242D27]/85 backdrop-blur-xs p-1.5 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'up')}
                        title="Flytta framåt"
                        className="p-1 text-[#FAF8F5] hover:text-[#CDE0D4] cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'down')}
                        title="Flytta bakåt"
                        className="p-1 text-[#FAF8F5] hover:text-[#CDE0D4] cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    title="Ta bort bild"
                    className="p-1 text-[#E4C9C9] hover:text-[#FF8888] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Upload Box */}
            <label className="border-2 border-dashed border-[#E6DFD3] hover:border-[#6B8E7B] rounded-2xl aspect-square flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-[#FAF8F5]/60 group">
              {uploadingImages ? (
                <>
                  <div className="w-6 h-6 border-2 border-[#6B8E7B] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs font-medium text-[#242D27]">Laddar upp bild...</span>
                </>
              ) : uploadSuccess ? (
                <>
                  <Check className="w-6 h-6 text-[#6B8E7B] mb-2" />
                  <span className="text-xs font-medium text-[#242D27]">Bild uppladdad!</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#8C9B90] group-hover:text-[#6B8E7B] mb-2 transition-colors" />
                  <span className="text-xs font-medium text-[#242D27]">Ladda upp bild</span>
                </>
              )}
              <span className="text-[10px] text-[#66726A] font-light mt-0.5">JPG, PNG eller WebP</span>
              {imageUploadError && (
                <span className="text-[10px] text-red-500 font-medium mt-2 max-w-[80%] text-center leading-tight">
                  {imageUploadError}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Klistra in URL */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Eller klistra in en bildlänk (URL)..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="px-4 py-2 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#E6DFD3] cursor-pointer transition-colors"
            >
              Lägg till URL
            </button>
          </div>
        </section>

        {/* 4. VARIANTER, FÄRGER OCH MATERIAL */}
        <section className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              4. Varianter, färger och material
            </h2>
            <p className="text-xs text-[#66726A] font-light mt-0.5">
              Valbara färger, storlekar, material och skötselråd.
            </p>
          </div>

          {/* Färger */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[#242D27]">
              Tillgängliga färger ({colors.length})
            </label>
            
            <div className="flex flex-wrap items-center gap-2">
              {colors.map((c, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#242D27] shadow-2xs"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="text-[#8C5248] hover:text-[#5E3029] ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Lägg till ny färg & snabbval från Sagomaskans palett */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Färgnamn (t.ex. Sand)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] w-36 focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#E6DFD3] p-0.5 bg-[#FAF8F5]"
                  title="Välj färgkod"
                />
                <button
                  type="button"
                  onClick={() => addColor()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#E6DFD3] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lägg till färg</span>
                </button>
              </div>

              {/* Snabbval från paletten */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-[#66726A]">
                <PaletteIcon className="w-3 h-3 text-[#6B8E7B]" />
                <span className="font-light">Snabbval från ateljén:</span>
                {Object.values(PALETTE).slice(0, 6).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => addColor(p.name, p.hex)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B] text-[10px] text-[#242D27] cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.hex }} />
                    <span>+ {p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Storlekar */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-medium text-[#242D27]">
              Valbara storlekar <span className="font-normal text-[#66726A]">(lämna tomt om One Size / ej tillämpligt)</span>
            </label>
            
            <div className="flex flex-wrap items-center gap-2">
              {sizes.map((s) => (
                <div
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#242D27]"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSize(s)}
                    className="text-[#8C5248] hover:text-[#5E3029] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="t.ex. 48-50, 52-54 eller 0-6 mån"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSize();
                  }
                }}
                className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] w-52 focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
              />
              <button
                type="button"
                onClick={addSize}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#E6DFD3] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lägg till storlek</span>
              </button>
            </div>
          </div>

          {/* Material & Skötselråd */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label htmlFor="product-material-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Material
              </label>
              <input
                id="product-material-input"
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="100% mjuk merinoull"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            <div>
              <label htmlFor="product-care-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Skötselråd
              </label>
              <input
                id="product-care-input"
                type="text"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="Handtvätt 30°C. Plantorkas varsamt."
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>
          </div>
        </section>

        {/* 5. INFORMATION FÖR BABYPRODUKTER (Villkorad / Frivillig) */}
        {isBabyProduct && (
          <section className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="pb-3 border-b border-[#E6DFD3]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#526E5F] uppercase tracking-[0.15em] mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#6B8E7B]" />
                <span>Babyprodukter</span>
              </div>
              <h2 className="font-serif text-xl text-[#242D27] font-medium">
                5. Information för babyprodukter
              </h2>
              <p className="text-xs text-[#66726A] font-light mt-0.5">
                Dessa fält är frivilliga och kan lämnas tomma om informationen inte finns. Fält som lämnas tomma döljs automatiskt på produktsidan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="product-rec-age-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  Rekommenderad ålder
                </label>
                <input
                  id="product-rec-age-input"
                  type="text"
                  value={recommendedAge}
                  onChange={(e) => setRecommendedAge(e.target.value)}
                  placeholder="t.ex. Från nyfödd / 0 månader"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              <div>
                <label htmlFor="product-safety-info-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  Säkerhetsinformation (neutral information)
                </label>
                <input
                  id="product-safety-info-input"
                  type="text"
                  value={safetyInformation}
                  onChange={(e) => setSafetyInformation(e.target.value)}
                  placeholder="t.ex. Broderade detaljer utan lösa plastdelar. Används under uppsikt."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>
          </section>
        )}

        {/* 6. LAGER, BESTÄLLNING & SYNLIGHET */}
        <section className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              6. Lager, beställning & synlighet
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Lagerantal */}
            <div>
              <label htmlFor="product-stockquantity-input" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Lagerantal
              </label>
              <input
                id="product-stockquantity-input"
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) {
                    setStockQuantity(0);
                  } else {
                    setStockQuantity(Math.max(0, val));
                  }
                }}
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
              <p className="mt-1.5 text-[11px] text-[#66726A] font-light">
                Antal exemplar som finns tillgängliga.
              </p>

              {/* Automatisk beräkning av lagerstatus */}
              <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl flex items-center justify-between">
                <span className="text-xs text-[#66726A]">Beräknad lagerstatus:</span>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                  stockQuantity > 0
                    ? 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/30'
                    : 'bg-[#F5E8E5] text-[#8C5248] border-[#8C5248]/30'
                }`}>
                  {stockQuantity > 0 ? (stockQuantity === 1 ? '1 kvar' : 'I lager') : 'Slut i lager'}
                </span>
              </div>
            </div>

            {/* Checkboxar */}
            <div className="space-y-3.5 pt-1">
              
              {/* Made to order */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="product-madetoorder-checkbox"
                  type="checkbox"
                  checked={madeToOrder}
                  onChange={(e) => setMadeToOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6B8E7B] focus:ring-[#6B8E7B]"
                />
                <span className="text-xs font-medium text-[#242D27]">
                  Tillverkas på beställning (Made to order)
                </span>
              </label>

              {/* Utvald produkt */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="product-featured-checkbox"
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6B8E7B] focus:ring-[#6B8E7B]"
                />
                <span className="text-xs font-medium text-[#242D27]">
                  Utvald produkt (visas i "Utvalda produkter" på startsidan)
                </span>
              </label>

              {/* Ny produkt */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="product-new-checkbox"
                  type="checkbox"
                  checked={newProduct}
                  onChange={(e) => setNewProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6B8E7B] focus:ring-[#6B8E7B]"
                />
                <span className="text-xs font-medium text-[#242D27]">
                  Ny produkt (visar diskret "Ny"-märkning i butiken)
                </span>
              </label>

              {/* Publicerad */}
              <label className="flex items-center gap-3 cursor-pointer pt-1 border-t border-[#E6DFD3]/80">
                <input
                  id="product-published-checkbox"
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6B8E7B] focus:ring-[#6B8E7B]"
                />
                <span className="text-xs font-semibold text-[#242D27]">
                  Publicerad i butiken (avmarkera för att spara som opublicerat utkast)
                </span>
              </label>

            </div>
          </div>
        </section>

        {/* Bottenknappar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            id="editor-cancel-bottom-btn"
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-full text-xs text-[#66726A] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
          >
            Avbryt
          </button>
          <button
            id="product-save-bottom-btn"
            type="submit"
            disabled={saving || uploadingImages}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] active:scale-[0.98] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Sparar...' : 'Spara produkt'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
