import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ShoppingBag,
  Percent,
  Coins,
  AlertCircle,
  X,
  Check,
  Info
} from 'lucide-react';
import {
  Discount,
  DiscountType,
  DiscountAppliesTo,
  Product,
  Category
} from '../../types';
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscountActive,
  normalizeDiscountCode
} from '../../services/discountService';

interface AdminDiscountsProps {
  discounts: Discount[];
  products: Product[];
  categories: Category[];
}

export const AdminDiscounts: React.FC<AdminDiscountsProps> = ({
  discounts,
  products,
  categories
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal / Form state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [active, setActive] = useState(true);
  const [appliesTo, setAppliesTo] = useState<DiscountAppliesTo>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // UI status
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingDiscountId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('10');
    setValidFrom('');
    setValidUntil('');
    setMinimumOrderAmount('');
    setMaxUses('');
    setActive(true);
    setAppliesTo('all');
    setSelectedProductIds([]);
    setSelectedCategoryIds([]);
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (discount: Discount) => {
    setEditingDiscountId(discount.id);
    setCode(discount.code);
    setDiscountType(discount.discountType);
    setDiscountValue(discount.discountValue.toString());
    setValidFrom(discount.validFrom || '');
    setValidUntil(discount.validUntil || '');
    setMinimumOrderAmount(
      discount.minimumOrderAmount !== undefined && discount.minimumOrderAmount !== null
        ? discount.minimumOrderAmount.toString()
        : ''
    );
    setMaxUses(
      discount.maxUses !== undefined && discount.maxUses !== null
        ? discount.maxUses.toString()
        : ''
    );
    setActive(discount.active);
    setAppliesTo(discount.appliesTo);
    setSelectedProductIds(discount.productIds || []);
    setSelectedCategoryIds(discount.categoryIds || []);
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normCode = normalizeDiscountCode(code);
    if (!normCode) {
      setFormError('Vänligen ange en rabattkod (t.ex. VÄLKOMMEN10).');
      return;
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val < 1) {
      setFormError(
        discountType === 'percentage'
          ? 'Rabattvärdet för procentrabatt måste vara minst 1 %.'
          : 'Rabattvärdet måste vara minst 1 kr.'
      );
      return;
    }

    if (discountType === 'percentage' && val > 100) {
      setFormError('Procentrabatt kan inte vara mer än 100 %.');
      return;
    }

    const minAmount = minimumOrderAmount.trim() ? parseFloat(minimumOrderAmount) : undefined;
    if (minAmount !== undefined && (isNaN(minAmount) || minAmount < 0)) {
      setFormError('Minsta ordersumma måste vara 0 kr eller mer.');
      return;
    }

    const maxUsesNum = maxUses.trim() ? parseInt(maxUses, 10) : undefined;
    if (maxUsesNum !== undefined && (isNaN(maxUsesNum) || maxUsesNum <= 0)) {
      setFormError('Max antal användningar måste vara ett heltal större än 0.');
      return;
    }

    if (appliesTo === 'products' && selectedProductIds.length === 0) {
      setFormError('Välj minst en produkt som rabatten ska gälla för.');
      return;
    }

    if (appliesTo === 'categories' && selectedCategoryIds.length === 0) {
      setFormError('Välj minst en kategori som rabatten ska gälla för.');
      return;
    }

    setSaving(true);

    try {
      if (editingDiscountId) {
        await updateDiscount(editingDiscountId, {
          code: normCode,
          discountType,
          discountValue: val,
          validFrom: validFrom.trim() || undefined,
          validUntil: validUntil.trim() || undefined,
          minimumOrderAmount: minAmount,
          maxUses: maxUsesNum,
          active,
          appliesTo,
          productIds: appliesTo === 'products' ? selectedProductIds : [],
          categoryIds: appliesTo === 'categories' ? selectedCategoryIds : []
        });
        showFeedback(`Rabattkoden ${normCode} uppdaterades.`);
      } else {
        await createDiscount({
          code: normCode,
          discountType,
          discountValue: val,
          validFrom: validFrom.trim() || undefined,
          validUntil: validUntil.trim() || undefined,
          minimumOrderAmount: minAmount,
          maxUses: maxUsesNum,
          active,
          appliesTo,
          productIds: appliesTo === 'products' ? selectedProductIds : [],
          categoryIds: appliesTo === 'categories' ? selectedCategoryIds : []
        });
        showFeedback(`Rabattkoden ${normCode} skapades.`);
      }

      setIsEditorOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Ett fel inträffade vid sparning av rabattkoden.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (discount: Discount) => {
    try {
      await toggleDiscountActive(discount.id, discount.active);
      showFeedback(`Rabattkoden ${discount.code} är nu ${discount.active ? 'inaktiv' : 'aktiv'}.`);
    } catch (err) {
      showFeedback('Kunde inte ändra status.');
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    try {
      await deleteDiscount(id);
      setDeleteConfirmId(null);
      showFeedback(`Rabattkoden ${codeName} togs bort.`);
    } catch (err) {
      showFeedback('Kunde inte radera rabattkod.');
    }
  };

  // Filtered discounts list
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!d.code.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === 'active' && !d.active) return false;
      if (statusFilter === 'inactive' && d.active) return false;
      return true;
    });
  }, [discounts, searchQuery, statusFilter]);

  // Filtered products for selection
  const filteredProductsForSelect = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, productSearch]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Kampanjer & Erbjudanden
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Rabatter ({discounts.length})
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-0.5">
            Skapa och hantera rabattkoder för procent- eller fasta rabatter på beställningsförfrågningar.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa rabattkod</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer">&times;</button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl p-3">
        
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#242D27] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            Alla ({discounts.length})
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-[#526E5F] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aktiva ({discounts.filter((d) => d.active).length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-[#8C5248] text-[#FAF8F5]'
                : 'text-[#66726A] hover:bg-[#F3EFE8]'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Inaktiva ({discounts.filter((d) => !d.active).length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8C9B90] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Sök rabattkod..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
          />
        </div>
      </div>

      {/* Discounts List */}
      {filteredDiscounts.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-12 text-center space-y-3">
          <Tag className="w-8 h-8 text-[#8C9B90] mx-auto stroke-1" />
          <h3 className="font-serif text-lg text-[#242D27]">Inga rabattkoder hittades</h3>
          <p className="text-xs text-[#66726A] font-light max-w-sm mx-auto">
            {searchQuery
              ? 'Inga rabattkoder matchar din sökning.'
              : 'Du har inte skapat några rabattkoder ännu. Klicka på knappen ovan för att skapa din första rabattkod.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Skapa första koden</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiscounts.map((discount) => {
            const isUsedUp =
              discount.maxUses !== undefined &&
              discount.maxUses !== null &&
              discount.maxUses > 0 &&
              discount.usedCount >= discount.maxUses;

            return (
              <div
                key={discount.id}
                className={`bg-[#FBF9F5] border rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between ${
                  discount.active && !isUsedUp
                    ? 'border-[#E6DFD3] hover:border-[#6B8E7B]'
                    : 'border-[#E6DFD3]/70 opacity-75 bg-[#F7F4EE]'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Top Bar: Code Badge + Active Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-wider px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#242D27] border border-[#E6DFD3] shadow-xs">
                        {discount.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(discount)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        discount.active
                          ? 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4] hover:bg-[#DCEEE3]'
                          : 'bg-[#F3EFE8] text-[#8C5248] border-[#E6DFD3] hover:bg-[#EBE5DB]'
                      }`}
                      title={discount.active ? 'Klicka för att inaktivera' : 'Klicka för att aktivera'}
                    >
                      {discount.active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#526E5F]" />
                          <span>Aktiv</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-[#8C5248]" />
                          <span>Inaktiv</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Value & Type display */}
                  <div className="pt-1 flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-[#242D27]">
                      {discount.discountType === 'percentage'
                        ? `${discount.discountValue} %`
                        : `${discount.discountValue} kr`}
                    </span>
                    <span className="text-xs text-[#66726A]">
                      {discount.discountType === 'percentage' ? 'procentrabatt' : 'fast rabatt'}
                    </span>
                  </div>

                  {/* Rules summary */}
                  <div className="space-y-1.5 text-xs text-[#66726A] pt-2 border-t border-[#E6DFD3]/80">
                    
                    {/* Applies to */}
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#8C9B90] shrink-0" />
                      <span className="truncate">
                        {discount.appliesTo === 'all' && 'Gäller alla produkter'}
                        {discount.appliesTo === 'products' &&
                          `Gäller ${discount.productIds?.length || 0} vald(a) produkt(er)`}
                        {discount.appliesTo === 'categories' &&
                          `Gäller ${discount.categoryIds?.length || 0} vald(a) kategori(er)`}
                      </span>
                    </div>

                    {/* Minimum order amount */}
                    {discount.minimumOrderAmount ? (
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#8C9B90] shrink-0" />
                        <span>Minst {discount.minimumOrderAmount} kr i order</span>
                      </div>
                    ) : null}

                    {/* Validity dates */}
                    {(discount.validFrom || discount.validUntil) ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#8C9B90] shrink-0" />
                        <span className="truncate">
                          {discount.validFrom && discount.validUntil
                            ? `${discount.validFrom} till ${discount.validUntil}`
                            : discount.validFrom
                            ? `Från ${discount.validFrom}`
                            : `Till ${discount.validUntil}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#8C9B90]">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Tillsvidare (inget slutdatum)</span>
                      </div>
                    )}

                    {/* Usage count */}
                    <div className="flex items-center gap-2">
                      <Coins className="w-3.5 h-3.5 text-[#8C9B90] shrink-0" />
                      <span>
                        Använd {discount.usedCount || 0}{' '}
                        {discount.maxUses
                          ? `/ ${discount.maxUses} ggr`
                          : 'ggr (obegränsat)'}
                      </span>
                      {isUsedUp && (
                        <span className="text-[10px] text-[#8C5248] font-semibold uppercase tracking-wider">
                          Fullbokad
                        </span>
                      )}
                    </div>

                  </div>

                </div>

                {/* Actions footer */}
                <div className="pt-3 border-t border-[#E6DFD3] flex items-center justify-between gap-2">
                  <div className="text-[10px] text-[#8C9B90]">
                    Skapad {discount.createdAt ? new Date(discount.createdAt).toLocaleDateString('sv-SE') : '-'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(discount)}
                      className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#E6DFD3] text-[#242D27] border border-[#E6DFD3] transition-colors cursor-pointer"
                      title="Redigera rabattkod"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === discount.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(discount.id, discount.code)}
                          className="px-2 py-1 bg-[#8C5248] hover:bg-[#724037] text-[#FAF8F5] text-[10px] font-bold rounded-lg cursor-pointer"
                          title="Bekräfta borttagning"
                        >
                          Radera!
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 text-[#66726A] hover:text-[#242D27] text-xs cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(discount.id)}
                        className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#FDF2F0] hover:border-[#8C5248]/40 text-[#66726A] hover:text-[#8C5248] border border-[#E6DFD3] transition-colors cursor-pointer"
                        title="Radera rabattkod"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL / DRAWER FOR CREATE & EDIT */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#242D27] text-[#FAF8F5] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h2 className="font-serif text-2xl text-[#242D27] font-medium">
                  {editingDiscountId ? 'Redigera rabattkod' : 'Skapa ny rabattkod'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E6DFD3] text-[#66726A] hover:text-[#242D27] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F0] border border-[#8C5248]/30 text-xs text-[#8C5248] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDiscount} className="space-y-5">
              
              {/* 1. Rabattkod */}
              <div>
                <label className="block text-xs font-semibold text-[#242D27] mb-1">
                  Rabattkod *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="T.ex. VÄLKOMMEN10"
                  className="w-full font-mono font-bold uppercase bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] tracking-wider"
                  required
                />
                <p className="text-[11px] text-[#66726A] font-light mt-1">
                  Koden sparas automatiskt i versaler (stora bokstäver).
                </p>
              </div>

              {/* 2. Typ & Värde */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#242D27] mb-1">
                    Rabattyp *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                  >
                    <option value="percentage">Procent (%)</option>
                    <option value="fixed">Fast belopp (kr)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242D27] mb-1">
                    Rabattvärde * {discountType === 'percentage' ? '(1 – 100 %)' : '(kr)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={discountType === 'percentage' ? '100' : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percentage' ? '10' : '50'}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#66726A] font-medium">
                      {discountType === 'percentage' ? '%' : 'kr'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Minsta ordersumma & Max användningar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#242D27] mb-1">
                    Minsta ordersumma (valfritt)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={minimumOrderAmount}
                      onChange={(e) => setMinimumOrderAmount(e.target.value)}
                      placeholder="T.ex. 300"
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#66726A]">
                      kr
                    </span>
                  </div>
                  <span className="text-[10px] text-[#66726A]">Lämna tomt för inget krav.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242D27] mb-1">
                    Max antal användningar (valfritt)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="T.ex. 10 (eller tomt för obegränsat)"
                    className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                  />
                  <span className="text-[10px] text-[#66726A]">Lämna tomt för obegränsat.</span>
                </div>
              </div>

              {/* 4. Giltighetstid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#242D27] mb-1">
                    Giltig från (valfritt)
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242D27] mb-1">
                    Giltig till (valfritt)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                  />
                </div>
              </div>

              {/* 5. Gäller för (Applies To) */}
              <div className="space-y-3 pt-2 border-t border-[#E6DFD3]">
                <label className="block text-xs font-semibold text-[#242D27]">
                  Vad rabatten gäller *
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppliesTo('all')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                      appliesTo === 'all'
                        ? 'bg-[#242D27] text-[#FAF8F5] border-[#242D27]'
                        : 'bg-[#FAF8F5] text-[#66726A] border-[#E6DFD3] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    Alla produkter
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppliesTo('products')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                      appliesTo === 'products'
                        ? 'bg-[#242D27] text-[#FAF8F5] border-[#242D27]'
                        : 'bg-[#FAF8F5] text-[#66726A] border-[#E6DFD3] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    Specifika produkter
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppliesTo('categories')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                      appliesTo === 'categories'
                        ? 'bg-[#242D27] text-[#FAF8F5] border-[#242D27]'
                        : 'bg-[#FAF8F5] text-[#66726A] border-[#E6DFD3] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    Specifika kategorier
                  </button>
                </div>

                {/* Sub-selector for Products */}
                {appliesTo === 'products' && (
                  <div className="p-3 bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#242D27]">
                        Välj produkter ({selectedProductIds.length} valda)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds(products.map((p) => p.id))}
                          className="text-[#6B8E7B] hover:underline cursor-pointer"
                        >
                          Välj alla
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="text-[#8C5248] hover:underline cursor-pointer"
                        >
                          Rensa
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Filtrera produkter..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                    />

                    <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-[#E6DFD3]/50 pr-1">
                      {filteredProductsForSelect.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center justify-between gap-3 pt-1.5 pb-1 text-xs cursor-pointer hover:bg-[#F3EFE8]/50 p-1.5 rounded-lg"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleProduct(p.id)}
                                className="rounded text-[#6B8E7B] focus:ring-[#6B8E7B]"
                              />
                              {p.image && (
                                <img
                                  src={p.image}
                                  alt=""
                                  className="w-7 h-7 rounded-md object-cover bg-[#E6DFD3]"
                                />
                              )}
                              <span className="truncate font-medium text-[#242D27]">{p.name}</span>
                            </div>
                            <span className="text-[#66726A] shrink-0">{p.price} kr</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-selector for Categories */}
                {appliesTo === 'categories' && (
                  <div className="p-3 bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#242D27]">
                        Välj kategorier ({selectedCategoryIds.length} valda)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryIds(categories.map((c) => c.id))}
                          className="text-[#6B8E7B] hover:underline cursor-pointer"
                        >
                          Välj alla
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryIds([])}
                          className="text-[#8C5248] hover:underline cursor-pointer"
                        >
                          Rensa
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const isChecked = selectedCategoryIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#242D27]'
                                : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#66726A]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCategory(cat.id)}
                              className="rounded text-[#6B8E7B] focus:ring-[#6B8E7B]"
                            />
                            <span className="truncate font-medium">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* 6. Aktiv direkt */}
              <div className="pt-2 border-t border-[#E6DFD3] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#242D27] block">Aktiv rabattkod</span>
                  <span className="text-[11px] text-[#66726A] font-light">
                    Inaktiva koder kan inte användas av kunder.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E6DFD3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D4C8B8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#526E5F]"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-[#E6DFD3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-[#E6DFD3] hover:bg-[#F3EFE8] text-xs font-medium text-[#66726A] hover:text-[#242D27] transition-colors cursor-pointer"
                >
                  Avbryt
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5] text-xs font-medium transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? (
                    <span>Sparar...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingDiscountId ? 'Uppdatera rabattkod' : 'Spara rabattkod'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
