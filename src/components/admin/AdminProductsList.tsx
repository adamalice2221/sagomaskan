import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  Sparkles,
  Package,
  X,
  ArrowUpDown,
  Eye,
  EyeOff,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { Product, Category, AdminTab } from '../../types';

interface AdminProductsListProps {
  products: Product[];
  categories: Category[];
  onNavigateTab: (tab: AdminTab, contextId?: string) => void;
  onEditProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onDuplicateProduct: (id: string) => Promise<string>;
}

type SortOption = 'created-desc' | 'updated-desc' | 'name-asc' | 'price-asc' | 'price-desc';

export const AdminProductsList: React.FC<AdminProductsListProps> = ({
  products,
  categories,
  onNavigateTab,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Alla');
  const [ageFilter, setAgeFilter] = useState('Alla');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [stockFilter, setStockFilter] = useState('Alla');
  const [sortBy, setSortBy] = useState<SortOption>('created-desc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter & Sort
  const filteredAndSortedProducts = useMemo(() => {
    const result = products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.shortDescription || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Category
      if (categoryFilter !== 'Alla') {
        if (p.category !== categoryFilter && p.categoryId !== categoryFilter) return false;
      }

      // Age group
      if (ageFilter !== 'Alla') {
        if (p.ageGroup !== ageFilter) return false;
      }

      // Published status
      if (publishedFilter === 'published' && !p.published) return false;
      if (publishedFilter === 'unpublished' && p.published) return false;

      // Featured
      if (featuredFilter === 'featured' && !p.featured) return false;

      // Stock status
      if (stockFilter !== 'Alla') {
        const qty = typeof p.stockQuantity === 'number' && !isNaN(p.stockQuantity)
          ? Math.max(0, Math.floor(p.stockQuantity))
          : 0;
        if (stockFilter === 'I lager' && qty <= 0) return false;
        if (stockFilter === 'Slut i lager' && qty > 0) return false;
        if (stockFilter === '1 kvar' && qty !== 1) return false;
      }

      return true;
    });

    // Sortering
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'created-desc': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'updated-desc': {
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        }
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '', 'sv');
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });
  }, [products, searchQuery, categoryFilter, ageFilter, publishedFilter, featuredFilter, stockFilter, sortBy]);

  // Check active filters
  const hasActiveFilters = 
    Boolean(searchQuery.trim()) ||
    categoryFilter !== 'Alla' ||
    ageFilter !== 'Alla' ||
    publishedFilter !== 'all' ||
    featuredFilter !== 'all' ||
    stockFilter !== 'Alla';

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('Alla');
    setAgeFilter('Alla');
    setPublishedFilter('all');
    setFeaturedFilter('all');
    setStockFilter('Alla');
  };

  const handleDuplicate = async (id: string) => {
    setActionLoading(`dup-${id}`);
    try {
      const newId = await onDuplicateProduct(id);
      showNotification('Produkten duplicerades som opublicerad kopia.');
      onNavigateTab('edit-product', newId);
    } catch (e: any) {
      showNotification('Kunde inte duplicera produkten: ' + (e?.message || ''));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`del-${id}`);
    try {
      await onDeleteProduct(id);
      showNotification('Produkten togs bort.');
      setDeleteConfirmId(null);
    } catch (e: any) {
      showNotification('Kunde inte ta bort produkten: ' + (e?.message || ''));
    } finally {
      setActionLoading(null);
    }
  };

  const togglePublished = async (p: Product) => {
    try {
      await onEditProduct(p.id, { published: !p.published });
      showNotification(p.published ? 'Produkten avpublicerades (dold för kunder).' : 'Produkten publicerades i butiken.');
    } catch (e: any) {
      showNotification('Kunde inte uppdatera publiceringsstatus.');
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      await onEditProduct(p.id, { featured: !p.featured });
      showNotification(p.featured ? 'Borttagen från utvalda på startsidan.' : 'Markerad som utvald produkt på startsidan.');
    } catch (e: any) {
      showNotification('Kunde inte uppdatera utvald-status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E6DFD3]">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B8E7B] font-bold">
            Katalog
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-semibold leading-tight">
            Produkter
          </h1>
          <p className="text-sm text-[#66726A] font-light">
            Hantera dina handvirkade alster, lagersaldon och priser.
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <button
            onClick={() => onNavigateTab('create-product')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-semibold hover:bg-[#344038] transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-[#6B8E7B] focus:outline-none"
          >
            <Plus className="w-4 h-4 text-[#6B8E7B]" />
            <span>Skapa produkt</span>
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-[#EFF4F1] border border-[#6B8E7B]/25 text-xs text-[#242D27] font-semibold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#526E5F]" />
            <span>{notification}</span>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="text-[#526E5F] hover:text-[#242D27] p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. SÖK + FILTER */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        
        {/* Sökfält & Mobil toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C9B90] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sök bland produkter efter namn, kategori eller beskrivning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-10 pr-8 py-2.5 text-xs text-[#242D27] placeholder:text-[#8C9B90] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C9B90] hover:text-[#242D27] p-0.5 cursor-pointer"
                title="Rensa sökning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={`md:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              mobileFilterOpen || hasActiveFilters
                ? 'bg-[#EFF4F1] border-[#6B8E7B] text-[#526E5F]'
                : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#66726A]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#526E5F]" />
            )}
          </button>
        </div>

        {/* Filter-rad (Desktop: alltid synlig, Mobil: hopfällbar) */}
        <div className={`${mobileFilterOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1`}>
          
          {/* Kategori */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-bold text-[#66726A] tracking-wider">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="Alla">Alla kategorier</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Åldersgrupp */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-bold text-[#66726A] tracking-wider">
              Målgrupp
            </label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="Alla">Alla målgrupper</option>
              <option value="Baby">Baby</option>
              <option value="Barn">Barn</option>
              <option value="Vuxen">Vuxen</option>
            </select>
          </div>

          {/* Synlighet */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-bold text-[#66726A] tracking-wider">
              Synlighet
            </label>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="all">Alla statusar</option>
              <option value="published">Endast publicerade</option>
              <option value="unpublished">Endast opublicerade</option>
            </select>
          </div>

          {/* Startsida / Utvald */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-bold text-[#66726A] tracking-wider">
              Utvald på startsida
            </label>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="all">Alla</option>
              <option value="featured">Endast utvalda</option>
            </select>
          </div>

          {/* Lagerstatus */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-bold text-[#66726A] tracking-wider">
              Lagerstatus
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="Alla">Alla lagersaldon</option>
              <option value="I lager">I lager (&gt; 0)</option>
              <option value="1 kvar">1 kvar (1)</option>
              <option value="Slut i lager">Slut i lager (0)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 3. AKTIVA FILTER OCH SUMMARIES */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[10px] font-bold text-[#6B8E7B] tracking-wider mr-1">
            AKTIVA FILTER:
          </span>

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] font-semibold text-[10px]">
              <span>Sök: "{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {categoryFilter !== 'Alla' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] font-semibold text-[10px]">
              <span>Kategori: {categoryFilter}</span>
              <button
                onClick={() => setCategoryFilter('Alla')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {ageFilter !== 'Alla' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] font-semibold text-[10px]">
              <span>Målgrupp: {ageFilter}</span>
              <button
                onClick={() => setAgeFilter('Alla')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {publishedFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] font-semibold text-[10px]">
              <span>Synlighet: {publishedFilter === 'published' ? 'Publicerad' : 'Ej publicerad'}</span>
              <button
                onClick={() => setPublishedFilter('all')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {featuredFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] font-semibold text-[10px]">
              <span>Utvald: Ja</span>
              <button
                onClick={() => setFeaturedFilter('all')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {stockFilter !== 'Alla' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] font-semibold text-[10px]">
              <span>Lager: {stockFilter}</span>
              <button
                onClick={() => setStockFilter('Alla')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-[11px] text-[#8C5248] hover:text-[#5C3029] font-bold underline underline-offset-2 ml-1 cursor-pointer"
          >
            Rensa alla
          </button>
        </div>
      )}

      {/* 4. RESULT COUNTS & SORTERING BAR */}
      <div className="flex items-center justify-between gap-3 text-xs pt-1">
        <div className="text-sm font-serif font-semibold text-[#242D27]">
          {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'produkt' : 'produkter'}
          {filteredAndSortedProducts.length !== products.length && (
            <span className="text-xs font-sans text-[#66726A] font-light ml-1.5">
              (filtrerade från {products.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="products-sort-select" className="text-xs text-[#66726A] font-light hidden sm:inline">
            Sortering:
          </label>
          <div className="relative">
            <select
              id="products-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer appearance-none pr-8"
            >
              <option value="created-desc">Senast skapad</option>
              <option value="updated-desc">Senast ändrad</option>
              <option value="name-asc">Namn A–Ö</option>
              <option value="price-asc">Pris: lägst först</option>
              <option value="price-desc">Pris: högst först</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[#6B8E7B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 5. LIST RENDERINGS */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EFE8] text-[#8C9B90] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6 text-[#6B8E7B]" />
          </div>
          <h3 className="font-serif text-lg text-[#242D27] font-semibold">
            Inga produkter hittades
          </h3>
          <p className="text-xs text-[#66726A] font-light max-w-sm mx-auto leading-relaxed">
            Hittade inga alster som matchade dina filter. Prova att ändra sökordet eller rensa filtren.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-semibold hover:bg-[#344038] transition-all cursor-pointer mt-2"
            >
              <X className="w-3.5 h-3.5 text-[#6B8E7B]" />
              <span>Återställ filter</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE (Visible on md and larger) */}
          <div className="hidden md:block bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#242D27]">
                <thead className="bg-[#F3EFE8] text-[9px] uppercase font-bold text-[#6B8E7B] tracking-wider border-b border-[#E6DFD3]">
                  <tr>
                    <th className="py-3 px-4">Alster / Produkt</th>
                    <th className="py-3 px-4">Kategori & Målgrupp</th>
                    <th className="py-3 px-4">Pris</th>
                    <th className="py-3 px-4">Lager</th>
                    <th className="py-3 px-4 text-center">Utvald</th>
                    <th className="py-3 px-4 text-center">Synlighet</th>
                    <th className="py-3 px-4 text-right">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD3]/40">
                  {filteredAndSortedProducts.map((product) => {
                    const productImage = product.images?.[0] || product.image;
                    const qty = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
                      ? Math.max(0, Math.floor(product.stockQuantity))
                      : 0;
                    const inStock = qty > 0;

                    return (
                      <tr key={product.id} className="hover:bg-[#F3EFE8]/30 transition-colors group">
                        
                        {/* Column 1: Image & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-11 h-11 rounded-lg object-cover bg-[#F3EFE8] border border-[#E6DFD3] shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-[#F3EFE8] border border-[#E6DFD3] flex items-center justify-center shrink-0 text-[#8C9B90]">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[#242D27] text-sm flex items-center gap-1.5">
                                <span className="group-hover:text-[#526E5F] transition-colors">{product.name}</span>
                                {product.newProduct && (
                                  <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.2 bg-[#EFF4F1] border border-[#6B8E7B]/15 text-[#526E5F] rounded-full font-bold">
                                    Nyhet
                                  </span>
                                )}
                              </div>
                              {product.shortDescription && (
                                <div className="text-[11px] text-[#66726A] truncate max-w-xs font-light mt-0.5">
                                  {product.shortDescription}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Category & Target */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#242D27]">{product.category}</div>
                          <div className="text-[11px] text-[#66726A] font-light">
                            {product.ageGroup || 'Alla åldrar'}
                          </div>
                        </td>

                        {/* Column 3: Price */}
                        <td className="py-3.5 px-4 font-semibold text-sm text-[#242D27] whitespace-nowrap">
                          {product.price} kr
                        </td>

                        {/* Column 4: Stock level */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border inline-block w-fit ${
                              inStock
                                ? (qty === 1 ? 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]' : 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/20')
                                : 'bg-[#FAF4F3] text-[#8C5248] border-[#8C5248]/20'
                            }`}>
                              {inStock ? (qty === 1 ? '1 kvar' : 'I lager') : 'Slut'}
                            </span>
                            <span className="text-[11px] text-[#66726A] font-light pl-1">
                              {qty} st
                            </span>
                          </div>
                        </td>

                        {/* Column 5: Featured */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleFeatured(product)}
                            title={product.featured ? 'Klicka för att ta bort från utvalda på startsidan' : 'Klicka för att göra utvald'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                              product.featured
                                ? 'bg-[#EFF4F1] border-[#6B8E7B]/30 text-[#526E5F]'
                                : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#8C9B90] hover:text-[#242D27]'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 text-[#6B8E7B]" />
                            <span>{product.featured ? 'Utvald' : 'Ej utvald'}</span>
                          </button>
                        </td>

                        {/* Column 6: Published */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => togglePublished(product)}
                            title={product.published ? 'Synlig för kunder' : 'Dold för kunder'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                              product.published
                                ? 'bg-[#EFF4F1] border-[#6B8E7B]/20 text-[#526E5F]'
                                : 'bg-[#FAF4ED] border-[#E6D7C3] text-[#7A5930]'
                            }`}
                          >
                            {product.published ? (
                              <>
                                <Eye className="w-3 h-3 text-[#6B8E7B]" />
                                <span>Publicerad</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-[#C89D6B]" />
                                <span>Dold</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Column 7: Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onNavigateTab('edit-product', product.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B]/40 transition-all font-semibold text-xs shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-[#6B8E7B]" />
                              <span>Ändra</span>
                            </button>

                            <button
                              onClick={() => handleDuplicate(product.id)}
                              disabled={actionLoading === `dup-${product.id}`}
                              title="Duplicera"
                              className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#66726A] hover:text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B]/40 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {deleteConfirmId === product.id ? (
                              <div className="inline-flex items-center gap-1 bg-[#FAF4F3] border border-[#8C5248]/25 p-1 rounded-xl">
                                <span className="text-[10px] text-[#8C5248] font-bold px-1">Radera?</span>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="px-2 py-0.5 bg-[#8C5248] text-[#FAF8F5] text-[10px] rounded hover:bg-[#6D3930] cursor-pointer"
                                >
                                  Ja
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 text-[10px] text-[#8C5248] cursor-pointer"
                                >
                                  Nej
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(product.id)}
                                title="Radera"
                                className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#8C5248] hover:bg-[#FAF4F3] hover:border-[#8C5248]/30 transition-all cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS (Visible on mobile only, < md) */}
          <div className="md:hidden space-y-3.5">
            {filteredAndSortedProducts.map((product) => {
              const productImage = product.images?.[0] || product.image;
              const qty = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
                ? Math.max(0, Math.floor(product.stockQuantity))
                : 0;
              const inStock = qty > 0;

              return (
                <div
                  key={product.id}
                  className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3.5 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-[#F3EFE8] border border-[#E6DFD3] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] flex items-center justify-center shrink-0 text-[#8C9B90]">
                        <Package className="w-6 h-6 text-[#6B8E7B]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-[#242D27] leading-tight">
                          {product.name}
                        </div>
                        <div className="font-bold text-sm text-[#242D27] shrink-0 whitespace-nowrap">
                          {product.price} kr
                        </div>
                      </div>

                      <div className="text-[11px] text-[#66726A] font-light mt-0.5">
                        {product.category} &bull; {product.ageGroup || 'Alla åldrar'}
                      </div>

                      {product.shortDescription && (
                        <div className="text-[11px] text-[#8C9B90] line-clamp-1 font-light mt-0.5">
                          {product.shortDescription}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Pills row */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E6DFD3]/50 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        inStock
                          ? (qty === 1 ? 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]' : 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/20')
                          : 'bg-[#FAF4F3] text-[#8C5248] border-[#8C5248]/20'
                      }`}>
                        {inStock ? (qty === 1 ? '1 kvar' : 'I lager') : 'Slut'} &bull; {qty} st
                      </span>

                      <button
                        onClick={() => togglePublished(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                          product.published
                            ? 'bg-[#EFF4F1] border-[#6B8E7B]/20 text-[#526E5F]'
                            : 'bg-[#FAF4ED] border-[#E6D7C3] text-[#7A5930]'
                        }`}
                      >
                        {product.published ? 'Publicerad' : 'Dold'}
                      </button>
                    </div>

                    <button
                      onClick={() => toggleFeatured(product)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                        product.featured
                          ? 'bg-[#EFF4F1] border-[#6B8E7B]/30 text-[#526E5F]'
                          : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#8C9B90]'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-[#6B8E7B]" />
                      <span>{product.featured ? 'Utvald' : 'Ej utvald'}</span>
                    </button>
                  </div>

                  {/* Action buttons row */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E6DFD3]/50">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => onNavigateTab('edit-product', product.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] text-xs font-semibold hover:bg-[#F3EFE8] cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#6B8E7B]" />
                        <span>Ändra</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(product.id)}
                        disabled={actionLoading === `dup-${product.id}`}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#66726A] text-xs font-semibold hover:bg-[#F3EFE8] cursor-pointer disabled:opacity-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopia</span>
                      </button>
                    </div>

                    {deleteConfirmId === product.id ? (
                      <div className="inline-flex items-center gap-1 bg-[#FAF4F3] border border-[#8C5248]/25 p-1 rounded-xl">
                        <span className="text-[10px] text-[#8C5248] font-bold px-1">Radera?</span>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-2.5 py-1 bg-[#8C5248] text-[#FAF8F5] text-[10px] font-bold rounded-lg hover:bg-[#6D3930] cursor-pointer"
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-[10px] text-[#8C5248] font-semibold cursor-pointer"
                        >
                          Nej
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(product.id)}
                        className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#8C5248] hover:bg-[#FAF4F3] cursor-pointer"
                        title="Radera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
};
