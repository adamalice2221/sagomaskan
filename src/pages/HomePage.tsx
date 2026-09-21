import React, { useMemo } from 'react';
import { ArrowRight, Heart, MessageSquare, Clock, Scissors, Info, Tag } from 'lucide-react';
import { Product, PageRoute, ProductCategory, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useData } from '../context/DataContext';
import { normalizeHeroImageUrl } from '../services/storage';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface HomePageProps {
  products: Product[];
  categories?: Category[];
  onNavigate: (page: PageRoute, productId?: string, category?: ProductCategory) => void;
  onFilterCategory: (category: ProductCategory) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories: categoriesProp,
  onNavigate,
  onFilterCategory
}) => {
  const { categories: contextCategories, settings, settingsLoaded, products: contextProducts } = useData();
  const allCategories = categoriesProp || contextCategories || [];
  const allProducts = products?.length ? products : contextProducts || [];

  const displayCategories = useMemo(() => {
    return allCategories
      .filter((c) => c.isActive !== false && (c as any).active !== false && (c as any).published !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [allCategories]);

  // Utvalda produkter från den dynamiska produktdatan
  const featuredProducts = useMemo(() => {
    const published = allProducts.filter((p) => p.isPublished !== false);
    const featured = published.filter((p) => p.isFeatured);
    if (featured.length >= 4) {
      return featured.slice(0, 4);
    }
    const nonFeatured = published.filter((p) => !p.isFeatured);
    return [...featured, ...nonFeatured].slice(0, 4);
  }, [allProducts]);

  const handleCategoryClick = (catId: ProductCategory) => {
    onFilterCategory(catId);
    onNavigate('shop', undefined, catId);
  };

  // Dynamiskt val av Hero-produkt från siteSettings/products
  const isHeroProductEnabled = settings?.heroProductEnabled !== undefined ? settings.heroProductEnabled : true;
  const selectedProductId = settings?.heroProductId;

  const heroProduct = useMemo(() => {
    if (!isHeroProductEnabled) return null;
    if (!allProducts || allProducts.length === 0) return null;

    if (selectedProductId) {
      const found = allProducts.find(
        (p) => p.id === selectedProductId && p.isPublished !== false
      );
      if (found) return found;
    }

    // Fallback till första publicerade produkten
    return allProducts.find((p) => p.isPublished !== false) || allProducts[0] || null;
  }, [allProducts, selectedProductId, isHeroProductEnabled]);

  const heroImageSrc = useMemo(() => {
    if (heroProduct) {
      if (heroProduct.images && heroProduct.images.length > 0 && heroProduct.images[0]) {
        return normalizeHeroImageUrl(heroProduct.images[0]);
      }
      if (heroProduct.image) {
        return normalizeHeroImageUrl(heroProduct.image);
      }
    }
    const customSettingImage = normalizeHeroImageUrl(settings?.heroImage);
    return customSettingImage || '';
  }, [heroProduct, settings?.heroImage]);

  const heroProductName = heroProduct?.name || 'Virkad produkt';
  const heroBadgeText = settings?.heroProductBadge || 'Skapat med fantasi';

  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* 1. HERO SECTION - FULL-WIDTH EDGE-TO-EDGE */}
      <section id="hero-section" className="relative w-full overflow-hidden flex items-center min-h-[500px] sm:min-h-[540px] lg:min-h-[580px] bg-[#FAF8F5]">
        {/* Background image layer covering the entire viewport width */}
        {heroImageSrc ? (
          <div className="absolute inset-0 z-0 w-full h-full">
            <img
              src={heroImageSrc}
              alt={heroProductName}
              className="w-full h-full object-cover object-[75%_center] sm:object-[right_center] lg:object-right"
            />
            {/* Subtle soft transparent gradient overlay on the left for effortless text contrast while keeping the right-hand motif clear */}
            <div
              className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/85 sm:via-[#FAF8F5]/75 via-45% sm:via-50% to-transparent"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-[#F3EFE8]/70 flex items-center justify-center">
            <div className="text-center text-[#66726A] p-6">
              <Scissors className="w-10 h-10 text-[#6B8E7B] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium">Välkommen till Sagomaskan</p>
            </div>
          </div>
        )}

        {/* Content overlay container aligned within max-w-7xl */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-xl lg:max-w-2xl text-left">
            {/* Optional badge */}
            {isHeroProductEnabled && heroBadgeText && (
              <div className="inline-flex items-center gap-2 bg-[#242D27]/90 backdrop-blur-xs text-[#FAF8F5] px-3.5 py-1.5 rounded-full text-xs font-light mb-5 sm:mb-6 shadow-xs">
                <Heart className="w-3.5 h-3.5 text-[#6B8E7B] fill-[#6B8E7B]" />
                <span>{heroBadgeText}</span>
              </div>
            )}

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#242D27] leading-[1.18] font-medium tracking-tight">
              {settingsLoaded ? (
                <span>
                  {settings?.heroTitle && settings.heroTitle !== 'Handgjorda virkade produkter med kärlek'
                    ? settings.heroTitle
                    : 'Där garn blir till små berättelser'}
                </span>
              ) : (
                <span className="inline-block w-full max-w-md h-12 sm:h-16 bg-[#E6DFD3]/40 animate-pulse rounded-xl" />
              )}
            </h1>

            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#526056] font-normal max-w-xl leading-relaxed">
              {settingsLoaded ? (
                <span>
                  {settings?.heroSubtitle &&
                  settings.heroSubtitle !== 'Mjuka detaljer för både stora och små i nordisk, minimalistisk design.' &&
                  settings.heroSubtitle !== 'Unika virkade produkter, skapade för hand med omsorg och glädje.'
                    ? settings.heroSubtitle
                    : 'Mjuk design, färg och fantasi – skapat för hand.'}
                </span>
              ) : (
                <span className="inline-block w-full max-w-sm h-6 bg-[#E6DFD3]/35 animate-pulse rounded-lg" />
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-6">
              <a
                id="hero-explore-shop-btn"
                href={getPageUrl('shop')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('shop');
                  }
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#242D27] text-[#FAF8F5] text-sm font-medium tracking-wide hover:bg-[#6B8E7B] transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg group cursor-pointer"
              >
                <span>Utforska shoppen →</span>
              </a>

              <a
                id="hero-about-craft-btn"
                href={getPageUrl('about')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('about');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#FAF8F5]/90 hover:bg-[#FAF8F5] border border-[#D5CDC0] text-[#242D27] text-sm font-medium tracking-wide transition-all flex items-center justify-center gap-2 hover:border-[#6B8E7B] cursor-pointer shadow-xs"
              >
                <span>Om hantverket</span>
              </a>
            </div>

            {/* Informational reassurance banner about beställningsförfrågan */}
            <div className="pt-6">
              <div className="p-3.5 rounded-xl bg-[#FAF8F5]/90 backdrop-blur-xs border border-[#6B8E7B]/30 text-xs text-[#445A4D] flex items-start gap-2.5 max-w-xl shadow-xs">
                <Info className="w-4 h-4 text-[#6B8E7B] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>En beställningsförfrågan innebär ingen betalning.</strong> Jag återkommer personligen med information om produkten, pris, eventuell frakt och betalning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      {displayCategories.length > 0 && (
        <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
              Kollektionen
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#242D27]">
              Utforska efter kategori
            </h2>
            <p className="text-sm text-[#66726A] font-light">
              Välj bland våra handvirkade produkter i tidlösa modeller och lugna färgskalor.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {displayCategories.map((category) => {
              const categoryKey = category.name || category.id;
              const categoryUrl = getPageUrl('shop', { category: categoryKey });
              return (
                <a
                  key={category.id}
                  id={`category-card-${category.id}`}
                  href={categoryUrl}
                  onClick={(e) => {
                    if (!isModifiedClick(e)) {
                      e.preventDefault();
                      handleCategoryClick(categoryKey);
                    }
                  }}
                  className="group flex flex-col items-center text-center cursor-pointer p-3 sm:p-4 rounded-2xl hover:bg-[#F3EFE8]/70 transition-all duration-300 block"
                >
                  {/* Circular image holder */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3.5 border-2 border-[#E6DFD3] group-hover:border-[#6B8E7B] group-hover:shadow-md transition-all bg-[#FAF8F5] flex items-center justify-center p-1.5 sm:p-2">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-contain object-center transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#F3EFE8] flex items-center justify-center text-[#6B8E7B]">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-serif text-base font-medium text-[#242D27] group-hover:text-[#6B8E7B] transition-colors leading-tight">
                    {category.name}
                  </h3>
                  
                  <p className="text-[11px] text-[#66726A] mt-1 line-clamp-1 font-light hidden sm:block">
                    {category.description}
                  </p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section id="featured-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E6DFD3] gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold mb-1">
              Handplockade favoriter
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#242D27]">
              Utvalda produkter
            </h2>
          </div>
          
          <a
            href={getPageUrl('shop')}
            onClick={(e) => {
              if (!isModifiedClick(e)) {
                e.preventDefault();
                onNavigate('shop');
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-[#242D27] hover:text-[#6B8E7B] font-medium transition-colors group cursor-pointer"
          >
            <span>Se alla produkter</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* 4 Featured Products Grid */}
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(id) => onNavigate('product', id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#FAF8F5] border border-dashed border-[#E6DFD3] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto">
            <p className="font-serif text-lg text-[#242D27] mb-2">Nya alster är på väg!</p>
            <p className="text-xs text-[#66726A] font-light mb-4 leading-relaxed">
              Butikens kollektion förbereds just nu. Skapa produkter i Admin eller kontakta oss för en personlig specialbeställning.
            </p>
            <a
              href={getPageUrl('contact')}
              onClick={(e) => {
                if (!isModifiedClick(e)) {
                  e.preventDefault();
                  onNavigate('contact');
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6B8E7B] text-white text-xs font-medium hover:bg-[#587565] transition-colors cursor-pointer"
            >
              Skicka en förfrågan
            </a>
          </div>
        )}
      </section>

      {/* 4. ABOUT TEASER SECTION ("Varje maska är handgjord") */}
      <section id="about-teaser-section" className="bg-[#F3EFE8]/70 border-y border-[#E6DFD3] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Visual with Genuine Crochet Craft Aesthetic */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative mx-auto max-w-md">
                <div className="relative rounded-2xl overflow-hidden border border-[#E6DFD3] shadow-lg">
                  {settings?.aboutImageUrl ? (
                    <img
                      src={settings.aboutImageUrl}
                      alt="Handvirkat hantverk med struktur"
                      className="w-full h-80 sm:h-96 object-cover"
                    />
                  ) : (
                    <div className="w-full h-80 sm:h-96 bg-[#FAF8F5] flex flex-col items-center justify-center p-8 text-center text-[#66726A] space-y-3">
                      <div className="w-16 h-16 rounded-full bg-[#F3EFE8] flex items-center justify-center text-[#6B8E7B]">
                        <Scissors className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-medium">Handgjort hantverk</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Narrative Content - Personal and genuine */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-5 text-center lg:text-left">
              <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
                Om hantverket
              </span>
              
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#242D27] leading-tight font-medium">
                Varje maska är handgjord
              </h2>

              <p className="text-base sm:text-lg text-[#242D27] font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Bakom Sagomaskan finns en passion för att skapa med garn, färg och fantasi. Varje produkt virkas för hand och får sin egen lilla personlighet.
              </p>

              <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Jag tycker om att skapa saker som känns personliga, mysiga och gjorda för att användas och uppskattas länge.
              </p>

              <div className="pt-2">
                <a
                  id="about-learn-more-btn"
                  href={getPageUrl('about')}
                  onClick={(e) => {
                    if (!isModifiedClick(e)) {
                      e.preventDefault();
                      onNavigate('about');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#242D27] text-[#FAF8F5] text-sm font-medium hover:bg-[#6B8E7B] transition-colors shadow-sm group cursor-pointer"
                >
                  <span>Läs mer om hantverket →</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. INFORMATION AND PROMISES - Neutral, genuine messages */}
      <section id="values-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-y border-[#E6DFD3]">
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-[#242D27]">
                Handgjort
              </h4>
              <p className="text-xs text-[#66726A] mt-1 font-light leading-relaxed">
                Varje produkt virkas för hand.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#6B8E7B]" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-[#242D27]">
                Skapat med omsorg
              </h4>
              <p className="text-xs text-[#66726A] mt-1 font-light leading-relaxed">
                Jag lägger tid och omsorg på varje beställning.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-[#242D27]">
                På beställning
              </h4>
              <p className="text-xs text-[#66726A] mt-1 font-light leading-relaxed">
                Vissa produkter virkas efter din beställning.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-[#242D27]">
                Personlig kontakt
              </h4>
              <p className="text-xs text-[#66726A] mt-1 font-light leading-relaxed">
                Du får personlig kontakt genom hela beställningsprocessen.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
