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
  Filter,
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
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            KATALOG
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Produkter ({products.length})
          </h1>
        </div>

        <button
          id="products-create-btn"
          onClick={() => onNavigateTab('create-product')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa produkt</span>
        </button>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between shadow-xs animate-fadeIn">
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
      <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        
        {/* Sökfält */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C9B90] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sök bland produkter efter namn, kategori eller beskrivning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#242D27] placeholder:text-[#8C9B90] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B] transition-all"
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

          {/* Mobil filterknapp */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={`sm:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
              mobileFilterOpen || hasActiveFilters
                ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#526E5F]'
                : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#66726A]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#526E5F]" />
            )}
          </button>
        </div>

        {/* Filter-rad (Desktop: alltid synlig, Mobil: hopfällbar) */}
        <div className={`${mobileFilterOpen ? 'grid' : 'hidden'} sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1`}>
          
          {/* Kategori */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-2.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
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
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Åldersgrupp
            </label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-2.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="Alla">Alla åldrar</option>
              <option value="Baby">Baby</option>
              <option value="Barn">Barn</option>
              <option value="Vuxen">Vuxen</option>
            </select>
          </div>

          {/* Synlighet */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Synlighet
            </label>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-2.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="all">Alla statusar</option>
              <option value="published">Endast publicerade</option>
              <option value="unpublished">Endast opublicerade</option>
            </select>
          </div>

          {/* Startsida / Utvald */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Startsida
            </label>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-2.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="all">Alla</option>
              <option value="featured">Endast utvalda</option>
            </select>
          </div>

          {/* Lagerstatus */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Lagerstatus
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-2.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
            >
              <option value="Alla">Alla</option>
              <option value="I lager">I lager (&gt; 0)</option>
              <option value="1 kvar">1 kvar (1)</option>
              <option value="Slut i lager">Slut i lager (0)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 3. AKTIVA FILTER */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] font-medium text-[#66726A] mr-1">
            Aktiva filter:
          </span>

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] font-medium text-[11px]">
              <span>Sök: "{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
                title="Ta bort sökfilter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {categoryFilter !== 'Alla' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] font-medium text-[11px]">
              <span>Kategori: {categoryFilter}</span>
              <button
                onClick={() => setCategoryFilter('Alla')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
                title="Ta bort kategorifilter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {ageFilter !== 'Alla' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] font-medium text-[11px]">
              <span>Ålder: {ageFilter}</span>
              <button
                onClick={() => setAgeFilter('Alla')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
                title="Ta bort åldersfilter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {publishedFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] font-medium text-[11px]">
              <span>Synlighet: {publishedFilter === 'published' ? 'Endast publicerade' : 'Endast opublicerade'}</span>
              <button
                onClick={() => setPublishedFilter('all')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
                title="Ta bort synlighetsfilter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {featuredFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] font-medium text-[11px]">
              <span>Startsida: Utvalda</span>
              <button
                onClick={() => setFeaturedFilter('all')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
                title="Ta bort utvalda-filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {stockFilter !== 'Alla' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE0D4] text-[#526E5F] font-medium text-[11px]">
              <span>Lager: {stockFilter}</span>
              <button
                onClick={() => setStockFilter('Alla')}
                className="hover:text-[#242D27] cursor-pointer p-0.5"
                title="Ta bort lagerfilter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-[11px] text-[#8C5248] hover:text-[#5C3029] font-medium underline underline-offset-2 ml-1 cursor-pointer"
          >
            Rensa filter
          </button>
        </div>
      )}

      {/* 4. RESULTATRAD + SORTERING */}
      <div className="flex items-center justify-between gap-3 text-xs pt-1">
        <div className="text-sm font-serif font-medium text-[#242D27]">
          {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'produkt' : 'produkter'}
          {filteredAndSortedProducts.length !== products.length && (
            <span className="text-xs font-sans text-[#66726A] font-light ml-1.5">
              (av totalt {products.length})
            </span>
          )}
        </div>

        {/* 5. SORTERING */}
        <div className="flex items-center gap-2">
          <label htmlFor="products-sort-select" className="text-xs text-[#66726A] font-light hidden sm:inline">
            Sortera:
          </label>
          <div className="relative">
            <select
              id="products-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer appearance-none pr-8 font-medium"
            >
              <option value="created-desc">Senast skapad</option>
              <option value="updated-desc">Senast ändrad</option>
              <option value="name-asc">Namn A–Ö</option>
              <option value="price-asc">Pris, lägst först</option>
              <option value="price-desc">Pris, högst först</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[#8C9B90] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 14. TOMT TILLSTÅND OM INGA MATCHNINGAR */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EFE8] text-[#8C9B90] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#242D27] font-medium">
            Inga produkter hittades
          </h3>
          <p className="text-xs text-[#66726A] font-light max-w-sm mx-auto">
            Prova att ändra sökningen eller rensa dina filter.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all cursor-pointer mt-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>Rensa filter</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP & TABLET TABELL/LISTA (md+) */}
          <div className="hidden md:block bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#242D27]">
                <thead className="bg-[#F3EFE8] text-[10px] uppercase font-semibold text-[#66726A] border-b border-[#E6DFD3]">
                  <tr>
                    <th className="py-3 px-4">Produkt</th>
                    <th className="py-3 px-4">Kategori & Ålder</th>
                    <th className="py-3 px-4">Pris</th>
                    <th className="py-3 px-4">Lagerstatus</th>
                    <th className="py-3 px-4 text-center">Utvald</th>
                    <th className="py-3 px-4 text-center">Publicerad</th>
                    <th className="py-3 px-4 text-right">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD3]/70">
                  {filteredAndSortedProducts.map((product) => {
                    const productImage = product.images?.[0] || product.image;
                    const qty = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
                      ? Math.max(0, Math.floor(product.stockQuantity))
                      : 0;
                    const inStock = qty > 0;

                    return (
                      <tr key={product.id} className="hover:bg-[#F3EFE8]/40 transition-colors group">
                        
                        {/* 6 & 7. Produkt bild, namn & kort info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover bg-[#F3EFE8] border border-[#E6DFD3] shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] flex items-center justify-center shrink-0 text-[#8C9B90]">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-[#242D27] text-sm flex items-center gap-1.5">
                                <span className="group-hover:text-[#526E5F] transition-colors">{product.name}</span>
                                {product.newProduct && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-[#E6DFD3] text-[#242D27] rounded-full font-sans">
                                    Ny
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#66726A] truncate max-w-xs font-light mt-0.5">
                                {product.shortDescription || 'Ingen kort beskrivning'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 8. Kategori + Åldersgrupp */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#242D27]">{product.category}</div>
                          <div className="text-[11px] text-[#66726A] font-light">
                            {product.ageGroup || 'Alla åldrar'}
                          </div>
                        </td>

                        {/* 9. Pris */}
                        <td className="py-3.5 px-4 font-semibold text-sm text-[#242D27] whitespace-nowrap">
                          {product.price} kr
                        </td>

                        {/* 10. Lagerstatus */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border inline-block w-fit ${
                              inStock
                                ? (qty === 1 ? 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]' : 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/30')
                                : 'bg-[#F8EFEF] text-[#8C5248] border-[#8C5248]/30'
                            }`}>
                              {inStock ? (qty === 1 ? '1 kvar' : 'I lager') : 'Slut i lager'}
                            </span>
                            <span className="text-[11px] text-[#66726A] font-light">
                              {qty} st
                            </span>
                          </div>
                        </td>

                        {/* 12. Utvald */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleFeatured(product)}
                            title={product.featured ? 'Klicka för att ta bort från utvalda på startsidan' : 'Klicka för att markera som utvald'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                              product.featured
                                ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#526E5F]'
                                : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#8C9B90] hover:text-[#242D27]'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{product.featured ? 'Utvald' : 'Ej utvald'}</span>
                          </button>
                        </td>

                        {/* 11. Publicerad */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => togglePublished(product)}
                            title={product.published ? 'Publicerad i butiken' : 'Opublicerad (dold för kunder)'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                              product.published
                                ? 'bg-[#EBF3EE] border-[#CDE0D4] text-[#526E5F]'
                                : 'bg-[#FAF4ED] border-[#E6D7C3] text-[#7A5930]'
                            }`}
                          >
                            {product.published ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Publicerad</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Ej publicerad</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* 13. Åtgärder: Redigera, Duplicera, Ta bort */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            
                            {/* Primär åtgärd: Redigera */}
                            <button
                              onClick={() => onNavigateTab('edit-product', product.id)}
                              title="Redigera produkt"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B] transition-all cursor-pointer font-medium text-xs shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#526E5F]" />
                              <span>Redigera</span>
                            </button>

                            {/* Duplicera */}
                            <button
                              onClick={() => handleDuplicate(product.id)}
                              disabled={actionLoading === `dup-${product.id}`}
                              title="Duplicera produkt"
                              className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#66726A] hover:text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Ta bort */}
                            {deleteConfirmId === product.id ? (
                              <div className="inline-flex items-center gap-1 bg-[#F8EFEF] border border-[#E4C9C9] p-1 rounded-lg">
                                <span className="text-[10px] text-[#8C5248] font-semibold px-1">Radera?</span>
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
                                title="Ta bort produkt"
                                className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#8C5248] hover:bg-[#F8EFEF] hover:border-[#E4C9C9] transition-all cursor-pointer shadow-2xs ml-1"
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

          {/* 15. MOBIL PRODUKTLISTA (< md) */}
          <div className="md:hidden space-y-3">
            {filteredAndSortedProducts.map((product) => {
              const productImage = product.images?.[0] || product.image;
              const qty = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
                ? Math.max(0, Math.floor(product.stockQuantity))
                : 0;
              const inStock = qty > 0;

              return (
                <div
                  key={product.id}
                  className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3 shadow-xs"
                >
                  {/* Överdel: Bild + Namn + Kategori + Pris */}
                  <div className="flex items-start gap-3">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-[#F3EFE8] border border-[#E6DFD3] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] flex items-center justify-center shrink-0 text-[#8C9B90]">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm text-[#242D27] leading-tight">
                          {product.name}
                        </div>
                        <div className="font-semibold text-sm text-[#242D27] shrink-0">
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

                  {/* Mitten: Status brickor */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E6DFD3]/60 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Lagerstatus */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        inStock
                          ? (qty === 1 ? 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]' : 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/30')
                          : 'bg-[#F8EFEF] text-[#8C5248] border-[#8C5248]/30'
                      }`}>
                        {inStock ? (qty === 1 ? '1 kvar' : 'I lager') : 'Slut'} &bull; {qty} st
                      </span>

                      {/* Publicerad status */}
                      <button
                        onClick={() => togglePublished(product)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer ${
                          product.published
                            ? 'bg-[#EBF3EE] border-[#CDE0D4] text-[#526E5F]'
                            : 'bg-[#FAF4ED] border-[#E6D7C3] text-[#7A5930]'
                        }`}
                      >
                        {product.published ? 'Publicerad' : 'Ej publicerad'}
                      </button>
                    </div>

                    {/* Utvald knapp */}
                    <button
                      onClick={() => toggleFeatured(product)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer ${
                        product.featured
                          ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#526E5F]'
                          : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#8C9B90]'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{product.featured ? 'Utvald' : 'Ej utvald'}</span>
                    </button>
                  </div>

                  {/* Nederdel: Åtgärder */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E6DFD3]/60">
                    <div className="flex items-center gap-1.5 flex-1">
                      <button
                        onClick={() => onNavigateTab('edit-product', product.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] text-xs font-medium hover:bg-[#F3EFE8] cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#526E5F]" />
                        <span>Redigera</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(product.id)}
                        disabled={actionLoading === `dup-${product.id}`}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#66726A] text-xs hover:bg-[#F3EFE8] cursor-pointer disabled:opacity-50"
                        title="Duplicera"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Kopia</span>
                      </button>
                    </div>

                    {deleteConfirmId === product.id ? (
                      <div className="inline-flex items-center gap-1 bg-[#F8EFEF] border border-[#E4C9C9] p-1 rounded-xl">
                        <span className="text-[10px] text-[#8C5248] font-semibold px-1">Radera?</span>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-2 py-1 bg-[#8C5248] text-[#FAF8F5] text-[10px] rounded-lg hover:bg-[#6D3930] cursor-pointer font-medium"
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-1 text-[10px] text-[#8C5248] cursor-pointer"
                        >
                          Nej
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(product.id)}
                        className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-[#8C5248] hover:bg-[#F8EFEF] cursor-pointer"
                        title="Ta bort produkt"
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
