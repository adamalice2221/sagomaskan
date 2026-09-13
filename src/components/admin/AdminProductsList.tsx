import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowUpDown
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.shortDescription || '').toLowerCase().includes(q);
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
  }, [products, searchQuery, categoryFilter, ageFilter, publishedFilter, featuredFilter, stockFilter]);

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
      showNotification(p.published ? 'Produkten avpublicerades.' : 'Produkten publicerades i butiken.');
    } catch (e: any) {
      showNotification('Kunde inte uppdatera status.');
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      await onEditProduct(p.id, { featured: !p.featured });
      showNotification(p.featured ? 'Borttagen från utvalda.' : 'Markerad som utvald produkt på startsidan.');
    } catch (e: any) {
      showNotification('Kunde inte uppdatera.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Katalog
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
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between shadow-xs">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-[#526E5F] hover:text-[#242D27]">
            &times;
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C9B90] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Sök bland produkter efter namn, kategori eller beskrivning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-9 pr-4 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Kategori */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1.5 text-xs text-[#242D27]"
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
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1.5 text-xs text-[#242D27]"
            >
              <option value="Alla">Alla åldrar</option>
              <option value="Baby">Baby</option>
              <option value="Barn">Barn</option>
              <option value="Vuxen">Vuxen</option>
            </select>
          </div>

          {/* Publicerad status */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Synlighet
            </label>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1.5 text-xs text-[#242D27]"
            >
              <option value="all">Alla statusar</option>
              <option value="published">Endast publicerade</option>
              <option value="unpublished">Endast opublicerade</option>
            </select>
          </div>

          {/* Utvald */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#66726A] mb-1">
              Startsida
            </label>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1.5 text-xs text-[#242D27]"
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
              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1.5 text-xs text-[#242D27]"
            >
              <option value="Alla">Alla</option>
              <option value="I lager">I lager (&gt; 0)</option>
              <option value="1 kvar">1 kvar (1)</option>
              <option value="Slut i lager">Slut i lager (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-12 text-center space-y-3">
          <p className="text-sm text-[#66726A] font-light">
            Inga produkter matchar dina valda filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('Alla');
              setAgeFilter('Alla');
              setPublishedFilter('all');
              setFeaturedFilter('all');
              setStockFilter('Alla');
            }}
            className="text-xs text-[#526E5F] font-medium underline"
          >
            Rensa alla filter
          </button>
        </div>
      ) : (
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl overflow-hidden shadow-xs">
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
              <tbody className="divide-y divide-[#E6DFD3]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#F3EFE8]/40 transition-colors">
                    
                    {/* Produkt bild & namn */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover bg-[#E6DFD3] border border-[#DED4C5]"
                        />
                        <div>
                          <div className="font-medium text-[#242D27] text-sm flex items-center gap-1.5">
                            <span>{product.name}</span>
                            {product.newProduct && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#E6DFD3] text-[#242D27] rounded-full">
                                Ny
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#66726A] truncate max-w-xs font-light">
                            {product.shortDescription || 'Ingen kort beskrivning'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kategori & Ålder */}
                    <td className="py-3 px-4">
                      <div className="font-medium">{product.category}</div>
                      <div className="text-[11px] text-[#66726A] font-light">
                        {product.ageGroup || 'Alla'}
                      </div>
                    </td>

                    {/* Pris */}
                    <td className="py-3 px-4 font-medium text-sm">
                      {product.price} kr
                    </td>

                    {/* Lagerstatus */}
                    <td className="py-3 px-4">
                      {(() => {
                        const qty = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
                          ? Math.max(0, Math.floor(product.stockQuantity))
                          : 0;
                        const inStock = qty > 0;
                        return (
                          <div className="flex flex-col gap-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border inline-block w-fit ${
                              inStock
                                ? 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/30'
                                : 'bg-[#F5E8E5] text-[#8C5248] border-[#8C5248]/30'
                            }`}>
                              {inStock ? (qty === 1 ? '1 kvar' : 'I lager') : 'Slut i lager'}
                            </span>
                            <span className="text-[11px] text-[#66726A] font-light">
                              {qty} i lager
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Utvald switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleFeatured(product)}
                        title={product.featured ? 'Klicka för att ta bort från utvalda' : 'Klicka för att göra till utvald'}
                        className={`p-1.5 rounded-lg border transition-all ${
                          product.featured
                            ? 'bg-[#EBF3EE] border-[#6B8E7B] text-[#526E5F]'
                            : 'bg-[#FAF8F5] border-[#E6DFD3] text-[#A8A8A8] hover:text-[#242D27]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Publicerad switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePublished(product)}
                        title={product.published ? 'Publicerad i butiken' : 'Opublicerad (dold för kunder)'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
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
                            <span>Opublicerad</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        
                        {/* Redigera */}
                        <button
                          onClick={() => onNavigateTab('edit-product', product.id)}
                          title="Redigera produkt"
                          className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B] transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicera */}
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          disabled={actionLoading === `dup-${product.id}`}
                          title="Duplicera produkt"
                          className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B] transition-all disabled:opacity-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Radera */}
                        {deleteConfirmId === product.id ? (
                          <div className="inline-flex items-center gap-1 bg-[#F8EFEF] border border-[#E4C9C9] p-1 rounded-lg">
                            <span className="text-[10px] text-[#8C5248] font-semibold px-1">Ta bort?</span>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="px-2 py-0.5 bg-[#8C5248] text-[#FAF8F5] text-[10px] rounded hover:bg-[#6D3930]"
                            >
                              Ja
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-[#8C5248]"
                            >
                              Nej
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            title="Radera produkt"
                            className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#8C5248] hover:bg-[#F8EFEF] hover:border-[#E4C9C9] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
