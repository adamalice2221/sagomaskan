import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { Product, ProductCategory, Category } from '../types';
import { useData } from '../context/DataContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  onSearchCategory: (category: ProductCategory) => void;
  products?: Product[];
  categories?: Category[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSearchCategory,
  products = [],
  categories: categoriesProp
}) => {
  const [query, setQuery] = useState('');
  const { categories: contextCategories, settings, settingsLoaded } = useData();
  const allCategories = categoriesProp || contextCategories || [];

  const popularSearches = useMemo(() => {
    if (!settingsLoaded) return [];
    if (settings?.popularSearchTerms && Array.isArray(settings.popularSearchTerms)) {
      return settings.popularSearchTerms.filter((term) => typeof term === 'string' && term.trim() !== '');
    }
    return [];
  }, [settings?.popularSearchTerms, settingsLoaded]);

  const mainCategories = useMemo(() => {
    const active = allCategories
      .filter((c) => c.isActive !== false && (c as any).active !== false && (c as any).published !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return active.map((c) => ({
      id: c.name as ProductCategory,
      label: c.name
    }));
  }, [allCategories]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.ageGroup && p.ageGroup.toLowerCase().includes(q)) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query, products]);

  if (!isOpen) return null;

  const handleProductClick = (id: string) => {
    onSelectProduct(id);
    onClose();
  };

  const handleCategoryClick = (cat: ProductCategory) => {
    onSearchCategory(cat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative max-w-2xl mx-auto bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFD3] overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-[#E6DFD3] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#66726A] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök bland virkade produkter, material, färger..."
            className="w-full bg-transparent text-base sm:text-lg text-[#242D27] placeholder-[#66726A]/50 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#66726A] hover:text-[#242D27]"
              aria-label="Rensa sökning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-[#66726A] hover:text-[#242D27] border border-[#E6DFD3] rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Content area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {query.trim() === '' ? (
            <div className="space-y-6">
              {popularSearches.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#66726A] font-semibold mb-3">
                    Populära sökningar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 rounded-full bg-[#F3EFE8] text-xs text-[#242D27] hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5"
                      >
                        <Tag className="w-3 h-3 text-[#6B8E7B]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mainCategories.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#66726A] font-semibold mb-3">
                    Sortiment & Kategorier
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {mainCategories.map((cat) => (
                      <a
                        key={cat.id}
                        href={getPageUrl('shop', { category: cat.id })}
                        onClick={(e) => {
                          if (!isModifiedClick(e)) {
                            e.preventDefault();
                            handleCategoryClick(cat.id);
                          } else {
                            onClose();
                          }
                        }}
                        className="p-2.5 rounded-xl border border-[#E6DFD3] bg-[#FAF8F5] text-left text-xs font-medium text-[#242D27] hover:border-[#6B8E7B] hover:bg-[#EFF4F1] transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>{cat.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-[#66726A]">
              <p className="font-serif text-lg text-[#242D27] mb-1">
                Inga produkter matchade "{query}"
              </p>
              <p className="text-xs">
                Prova att söka på t.ex. mössa, halsduk, strumpor, skallra eller merinoull.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#66726A]">
                Hittade {filteredProducts.length} resultat för "{query}"
              </p>
              <div className="divide-y divide-[#E6DFD3]">
                {filteredProducts.map((product) => (
                  <a
                    key={product.id}
                    href={getPageUrl('product', { productId: product.id })}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        handleProductClick(product.id);
                      } else {
                        onClose();
                      }
                    }}
                    className="w-full py-3 flex items-center gap-4 text-left hover:bg-[#F3EFE8]/60 px-2 rounded-xl transition-colors group cursor-pointer block"
                  >
                    <img
                      src={product.image || product.images[0]}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover bg-[#F3EFE8] shrink-0 border border-[#E6DFD3]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-[#66726A] font-medium">
                          {product.category}
                        </span>
                        {product.ageGroup && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#EFF4F1] text-[#526E5F] font-medium">
                            {product.ageGroup}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base font-medium text-[#242D27] group-hover:text-[#6B8E7B] transition-colors truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-[#66726A] line-clamp-1 font-light">
                        {product.shortDescription}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-[#242D27] whitespace-nowrap">
                        {product.price}&nbsp;kr
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
