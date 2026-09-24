import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { SlidersHorizontal, ArrowUpDown, Search, X, Tag } from 'lucide-react';
import { Product, ProductCategory, SortOption, AgeGroup, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useData } from '../context/DataContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface ShopPageProps {
  products: Product[];
  categories?: Category[];
  activeCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  onSelectProduct: (productId: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories: categoriesProp,
  activeCategory,
  onSelectCategory,
  onSelectProduct
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAge, setSelectedAge] = useState<'Alla' | AgeGroup>('Alla');

  // Dynamically load categories from Firestore via DataContext or prop
  const { categories: contextCategories } = useData();
  const allCategories = categoriesProp || contextCategories || [];

  // Active categories from Firestore, sorted by sortOrder
  const categoryTabs = useMemo(() => {
    const activeCats = allCategories
      .filter((c) => c.isActive !== false && (c as any).active !== false && (c as any).published !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return [
      { id: 'Alla', name: 'Alla', label: 'Alla', image: undefined, description: undefined, targetAgeGroups: undefined },
      ...activeCats.map((c) => ({
        id: c.id,
        name: c.name,
        label: c.name,
        image: c.image,
        description: c.description,
        targetAgeGroups: c.targetAgeGroups
      }))
    ];
  }, [allCategories]);

  // Dynamically determine which age groups make sense for current category
  const availableAgeGroups = useMemo(() => {
    if (activeCategory === 'Alla') {
      return ['Alla', 'Baby', 'Barn', 'Vuxen'] as const;
    }

    const currentTab = categoryTabs.find(
      (c) =>
        c.name === activeCategory ||
        c.id === activeCategory ||
        c.name.toLowerCase() === activeCategory.toLowerCase() ||
        c.id.toLowerCase() === activeCategory.toLowerCase()
    );

    if (currentTab?.targetAgeGroups && currentTab.targetAgeGroups.length > 0) {
      const groups = ['Alla', ...currentTab.targetAgeGroups.filter((g) => g !== 'Alla')];
      return groups as readonly ('Alla' | AgeGroup)[];
    }

    if (
      activeCategory === 'Skallror' ||
      activeCategory === 'Bitringar' ||
      currentTab?.name === 'Skallror' ||
      currentTab?.name === 'Bitringar'
    ) {
      return ['Alla', 'Baby'] as const;
    }
    if (
      activeCategory === 'Mössor' ||
      activeCategory === 'Pannband' ||
      activeCategory === 'Halsdukar' ||
      activeCategory === 'Strumpor' ||
      currentTab?.name === 'Mössor' ||
      currentTab?.name === 'Pannband' ||
      currentTab?.name === 'Halsdukar' ||
      currentTab?.name === 'Strumpor'
    ) {
      return ['Alla', 'Barn', 'Vuxen'] as const;
    }
    return ['Alla', 'Baby', 'Barn', 'Vuxen'] as const;
  }, [activeCategory, categoryTabs]);

  // If active category changes and selectedAge is not in availableAgeGroups, reset it
  const effectiveAge = availableAgeGroups.includes(selectedAge as any)
    ? selectedAge
    : 'Alla';

  // Filtering and sorting
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter: match both category name and categoryId consistently
    if (activeCategory !== 'Alla') {
      const selectedTab = categoryTabs.find(
        (c) =>
          c.name === activeCategory ||
          c.id === activeCategory ||
          c.name.toLowerCase() === activeCategory.toLowerCase() ||
          c.id.toLowerCase() === activeCategory.toLowerCase()
      );
      const matchName = (selectedTab?.name || activeCategory).toLowerCase();
      const matchId = (selectedTab?.id || activeCategory).toLowerCase();

      list = list.filter((p) => {
        const prodCat = (p.category || '').toLowerCase();
        const prodCatId = (p.categoryId || '').toLowerCase();
        return (
          prodCat === matchName ||
          prodCat === matchId ||
          prodCatId === matchName ||
          prodCatId === matchId
        );
      });
    }

    // Target/Age group filter
    if (effectiveAge !== 'Alla') {
      list = list.filter((p) => p.ageGroup === effectiveAge);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.ageGroup && p.ageGroup.toLowerCase().includes(q)) ||
          p.colors.some((c) => c.name.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'recommended':
        list.sort((a, b) => {
          if (a.featured !== b.featured) return b.featured ? 1 : -1;
          return (b.newProduct ? 1 : 0) - (a.newProduct ? 1 : 0);
        });
        break;
      case 'newest':
        list.sort((a, b) => (b.newProduct ? 1 : 0) - (a.newProduct ? 1 : 0));
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
        break;
      default:
        break;
    }

    return list;
  }, [products, activeCategory, effectiveAge, searchQuery, sortBy]);

  const hasActiveFilters =
    activeCategory !== 'Alla' || effectiveAge !== 'Alla' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    onSelectCategory('Alla');
    setSelectedAge('Alla');
    setSearchQuery('');
    setSortBy('recommended');
  };

  // Horizontal scroll detection for category pill row on mobile
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    // If remaining scroll is greater than 6px, show right fade indicator
    setCanScrollRight(scrollWidth - scrollLeft - clientWidth > 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = categoryScrollRef.current;
    if (!el) return;

    // Check with requestAnimationFrame to ensure layout is calculated
    const frameId = requestAnimationFrame(checkScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', checkScroll);
    return () => {
      cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, categoryTabs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
      
      {/* Page Header (Clean, airy, elegant with consistent brand details) */}
      <div className="text-center max-w-2xl mx-auto pt-2">
        <div className="inline-block">
          <p className="text-xs text-[#526E5F] bg-[#EFF4F1] border border-[#6B8E7B]/25 rounded-full px-4 py-1.5 font-light">
            Detta är en beställningsförfrågan. Ingen betalning sker här på hemsidan.
          </p>
        </div>
      </div>

      {/* Category Section: Utforska efter kategori (Piller-knappar med horisontell mobil-scroll) */}
      {categoryTabs.length > 0 && (
        <section id="categories-section" className="space-y-4 sm:space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
              Kollektionen
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#3B2F2F]">
              Utforska efter kategori
            </h2>
            <p className="text-sm text-[#66726A] font-light">
              Välj bland våra handvirkade produkter i tidlösa modeller och lugna färgskalor.
            </p>
          </div>

          {/* Horizontal Scrollable Categories Container with Peek/Fade Indicators */}
          <div className="relative max-w-full overflow-hidden sm:overflow-visible">
            {/* Left subtle fade indicator when scrolled right */}
            <div
              className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent z-10 transition-opacity duration-300 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />

            {/* Horizontal Rounded Pill Buttons */}
            <div
              ref={categoryScrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 px-1 sm:justify-center sm:flex-wrap"
            >
              {categoryTabs.map((category) => {
                const categoryKey = category.name || category.id;
                const isActive =
                  (categoryKey === 'Alla' && (activeCategory === 'Alla' || !activeCategory)) ||
                  activeCategory === category.name ||
                  activeCategory === category.id ||
                  (activeCategory !== 'Alla' && (
                    activeCategory.toLowerCase() === (category.name || '').toLowerCase() ||
                    activeCategory.toLowerCase() === (category.id || '').toLowerCase()
                  ));
                const categoryUrl = getPageUrl('shop', categoryKey !== 'Alla' ? { category: categoryKey } : undefined);

                return (
                  <a
                    key={category.id}
                    id={`shop-category-pill-${category.id}`}
                    href={categoryUrl}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        onSelectCategory(categoryKey);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer shadow-2xs shrink-0 ${
                      isActive
                        ? 'bg-[#3B2F2F] text-[#FAF8F5] border border-[#3B2F2F] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#4A3E3D] hover:bg-[#F3EFE8] hover:text-[#242D27] border border-[#E6DFD3] hover:border-[#6B8E7B]/40'
                    }`}
                  >
                    <span>{category.name}</span>
                  </a>
                );
              })}
            </div>

            {/* Right subtle fade indicator when more categories can be swiped to */}
            <div
              className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent z-10 transition-opacity duration-300 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />
          </div>
        </section>
      )}

      {/* Filter and Sorting Control Bar */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Målgrupp / Åldersfilter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#66726A] font-medium tracking-wide">
              Målgrupp:
            </span>
            <div className="inline-flex rounded-xl bg-[#F3EFE8] p-1 gap-1 border border-[#E6DFD3]/60">
              {availableAgeGroups.map((ag) => {
                const isActive = effectiveAge === ag;
                return (
                  <button
                    key={ag}
                    id={`shop-age-filter-${ag}`}
                    onClick={() => setSelectedAge(ag as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#FAF8F5] text-[#242D27] shadow-xs font-semibold'
                        : 'text-[#66726A] hover:text-[#242D27]'
                    }`}
                  >
                    {ag}
                  </button>
                );
              })}
            </div>
            {activeCategory !== 'Alla' && (
              <span className="text-[11px] text-[#66726A] hidden sm:inline italic">
                (filtrerar inom {activeCategory})
              </span>
            )}
          </div>

          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#66726A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök i sortimentet..."
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#F3EFE8] border border-transparent focus:border-[#6B8E7B] text-xs text-[#242D27] placeholder-[#66726A]/60 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66726A] hover:text-[#242D27] cursor-pointer"
                  aria-label="Rensa sökning"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sortering */}
            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort-select" className="text-xs text-[#66726A] shrink-0">
                Sortera:
              </label>
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto text-xs bg-[#F3EFE8] border border-[#E6DFD3] rounded-xl px-3 py-2 text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
              >
                <option value="recommended">Rekommenderade</option>
                <option value="newest">Nyast</option>
                <option value="price-asc">Pris: lägst först</option>
                <option value="price-desc">Pris: högst först</option>
                <option value="name-asc">Namn A–Ö</option>
              </select>
            </div>

          </div>

        </div>

        {/* Active Filter Summary Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E6DFD3]/60 text-xs text-[#66726A]">
          <div>
            Visar <strong className="text-[#242D27] font-semibold">{filteredProducts.length}</strong>{' '}
            {filteredProducts.length === 1 ? 'produkt' : 'produkter'}
            {activeCategory !== 'Alla' && (
              <> i kategorin <strong className="text-[#242D27] font-medium">{activeCategory}</strong></>
            )}
            {effectiveAge !== 'Alla' && (
              <> för <strong className="text-[#242D27] font-medium">{effectiveAge}</strong></>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[#6B8E7B] hover:text-[#242D27] underline transition-colors cursor-pointer"
            >
              Återställ filter
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6 sm:gap-6 lg:gap-7">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl py-14 sm:py-16 px-6 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <p className="font-serif text-2xl text-[#242D27] font-medium">
            {products.length === 0 ? 'Inga produkter publicerade än' : 'Inga produkter matchade dina filter'}
          </p>
          <p className="text-sm text-[#66726A] font-light leading-relaxed">
            {products.length === 0
              ? 'Butikens sortiment uppdateras just nu. Nya handvirkade produkter läggs upp inom kort från ateljén!'
              : 'Prova att välja en annan kategori eller målgrupp, eller återställ filtren för att se hela sortimentet.'}
          </p>
          {products.length > 0 && (
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-xl bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#6B8E7B] transition-colors cursor-pointer shadow-xs"
            >
              Visa alla produkter
            </button>
          )}
        </div>
      )}

    </div>
  );
};
