import React, { useMemo } from 'react';
import { ArrowRight, Heart, Clock, Scissors, Info, Tag } from 'lucide-react';
import { Product, PageRoute, ProductCategory, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { WelcomePopup } from '../components/WelcomePopup';
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
  const selectedProductId = settings?.heroProductId;

  const heroProduct = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return null;

    if (selectedProductId) {
      const found = allProducts.find(
        (p) => p.id === selectedProductId && p.isPublished !== false
      );
      if (found) return found;
    }

    // Fallback till första publicerade produkten
    return allProducts.find((p) => p.isPublished !== false) || allProducts[0] || null;
  }, [allProducts, selectedProductId]);

  const isCustomHeroImage = Boolean(settings?.heroImage);
  const heroImageSrc = useMemo(() => {
    if (settings?.heroImage) {
      const customSettingImage = normalizeHeroImageUrl(settings.heroImage);
      if (customSettingImage) return customSettingImage;
    }
    return '/hero-craft-banner.webp';
  }, [settings?.heroImage]);

  const heroBadgeText = settings?.heroProductBadge || 'Handgjort med kärlek';

  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* 1. HERO SECTION - Full-width edge-to-edge */}
      <section
        id="hero-section"
        className="relative w-full overflow-hidden min-h-[500px] sm:min-h-[560px] md:min-h-[620px] lg:min-h-[680px] flex items-center bg-[#FAF8F5]"
      >
        {/* Full-width Background Image & Warm Dreamy Ambient Scrim */}
        <div className="absolute inset-0 w-full h-full select-none pointer-events-none bg-[#F5EFE6]">
          <picture className="w-full h-full block">
            {!isCustomHeroImage && (
              <>
                <source srcSet="/hero-craft-banner.webp" type="image/webp" />
                <source srcSet="/hero-craft-banner.jpg" type="image/jpeg" />
              </>
            )}
            <img
              src={heroImageSrc}
              alt="Handgjort garn och hantverk"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_35%] md:object-center"
            />
          </picture>
          {/* Soft, warm, dreamy ambient filter ensuring high contrast and effortless legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/96 via-[#FAF8F5]/88 to-[#FAF8F5]/45 sm:from-[#FAF8F5]/95 sm:via-[#FAF8F5]/82 sm:to-[#FAF8F5]/25" />
          {/* Gentle top and bottom vignetting for smooth blend into page canvas */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/40 via-transparent to-[#FAF8F5]" />
        </div>

        {/* Hero Content aligned nicely on top */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          <div className="max-w-2xl text-center lg:text-left space-y-6 sm:space-y-7">
            
            {/* Subtle handcrafted badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F5]/90 backdrop-blur-xs border border-[#E6DFD3] text-xs text-[#526E5F] font-medium shadow-2xs">
              <Heart className="w-3.5 h-3.5 text-[#6B8E7B] fill-[#6B8E7B]" />
              <span>{heroBadgeText}</span>
            </div>

            {/* Main Headline in deep espresso #3B2F2F - Instant First Paint */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#3B2F2F] leading-[1.15] font-medium tracking-tight">
              <span>{settings?.heroTitle || 'Där garn blir till små berättelser'}</span>
            </h1>

            {/* Subtitle with rich readability and warm earthy tone - Instant First Paint */}
            <p className="text-base sm:text-lg md:text-xl text-[#4A3E3D] font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
              <span>{settings?.heroSubtitle || 'Mjuk design, färg och fantasi – skapat för hand med omsorg och glädje.'}</span>
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                id="hero-explore-shop-btn"
                href={getPageUrl('shop')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('shop');
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#3B2F2F] text-[#FAF8F5] text-sm font-medium tracking-wide hover:bg-[#526E5F] transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg group cursor-pointer"
              >
                <span>Se mina skapelser →</span>
              </a>
            </div>

            {/* Informational reassurance banner about beställningsförfrågan */}
            <div className="pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="p-3.5 rounded-xl bg-[#FAF8F5]/90 backdrop-blur-xs border border-[#6B8E7B]/30 text-xs text-[#4A3E3D] flex items-start gap-2.5 text-left shadow-2xs">
                <Info className="w-4 h-4 text-[#6B8E7B] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#3B2F2F]">Så här handlar du:</strong> Lägg dina favoriter i önskelistan och skicka en förfrågan. Inga betalningar sker på sidan – jag återkommer till dig via mejl.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. VALUES & INFORMATION SECTION - 2 elegant Scandinavian cards */}
      <section id="values-section" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* 1. Med hjärta i varje mask */}
          <div className="h-full flex flex-col p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B]/40 transition-colors duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] flex items-center justify-center shrink-0 mb-3 sm:mb-3.5">
              <Scissors className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-medium text-[#242D27] mb-1.5 leading-snug">
              Med hjärta i varje mask
            </h3>
            <p className="text-sm text-[#45524B] leading-relaxed">
              Jag virkar varje produkt för hand och lägger tid, omsorg och kärlek i varje detalj.
            </p>
          </div>

          {/* 2. Efter din beställning */}
          <div className="h-full flex flex-col p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B]/40 transition-colors duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EFF4F1] border border-[#6B8E7B]/20 text-[#526E5F] flex items-center justify-center shrink-0 mb-3 sm:mb-3.5">
              <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-medium text-[#242D27] mb-1.5 leading-snug">
              Efter din beställning
            </h3>
            <p className="text-sm text-[#45524B] leading-relaxed">
              Vissa produkter virkas efter din beställning. Har du frågor eller behöver hjälp på vägen är du alltid välkommen att höra av dig.
            </p>
          </div>

        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      {displayCategories.length > 0 && (
        <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-2.5 xl:gap-5">
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
                  className="group flex flex-col items-center text-center cursor-pointer p-1.5 sm:p-2.5 xl:p-3 rounded-2xl hover:bg-[#F3EFE8]/70 transition-all duration-300 block"
                >
                  {/* Circular image holder */}
                  <div className="relative w-28 h-28 min-[360px]:w-32 min-[360px]:h-32 min-[400px]:w-36 min-[400px]:h-36 sm:w-40 sm:h-40 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full overflow-hidden mb-3.5 border-2 border-[#E6DFD3] group-hover:border-[#6B8E7B] group-hover:shadow-md transition-all bg-[#FAF8F5] flex items-center justify-center p-2 sm:p-3">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-contain object-center transition-all duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#F3EFE8] flex items-center justify-center text-[#6B8E7B]">
                        <Tag className="w-8 h-8 sm:w-9 sm:h-9" />
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
            <h2 className="font-serif text-3xl sm:text-4xl text-[#3B2F2F]">
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
            className="inline-flex items-center gap-2 text-sm text-[#3B2F2F] hover:text-[#6B8E7B] font-medium transition-colors group cursor-pointer"
          >
            <span>Se alla produkter</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* 4 Featured Products Grid */}
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-6 lg:gap-8">
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
            <p className="font-serif text-lg text-[#3B2F2F] mb-2">Nya alster är på väg!</p>
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

      {/* 4. ABOUT TEASER SECTION ("Varje maska berättar en liten historia") */}
      <section id="about-teaser-section" className="bg-[#F3EFE8]/70 border-y border-[#E6DFD3] py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center">
            
            {/* Visual with Genuine Crochet Craft Aesthetic */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E6DFD3] bg-[#FAF8F5] shadow-xs aspect-4/3 sm:aspect-4/3 md:aspect-square lg:aspect-4/5 flex items-center justify-center">
                  {settings?.aboutImageUrl ? (
                    <img
                      src={settings.aboutImageUrl}
                      alt="Sagomaskan - Handvirkat hantverk med garn och virknål"
                      className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center text-[#66726A] relative">
                      {/* Subtle organic craft decorative backdrop */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFF4F1] border border-[#6B8E7B]/20 flex items-center justify-center text-[#6B8E7B] mb-4 sm:mb-5 shadow-2xs">
                        <Scissors className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />
                      </div>
                      
                      {/* Decorative stitch accent */}
                      <div className="inline-flex items-center justify-center gap-1.5 text-[#6B8E7B] mb-2.5" aria-hidden="true">
                        <span className="w-5 h-[1.5px] bg-[#6B8E7B]/30 rounded-full" />
                        <svg className="w-8 h-2.5 text-[#6B8E7B]" viewBox="0 0 40 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2 6c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
                        </svg>
                        <span className="w-5 h-[1.5px] bg-[#6B8E7B]/30 rounded-full" />
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl text-[#242D27] font-medium mb-1">
                        Handgjort med omsorg
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#66726A] font-light max-w-xs leading-relaxed">
                        Maska för maska med garn, virknål och tålamod
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Narrative Content - Personal and genuine */}
            <div className="lg:col-span-7 order-1 lg:order-2 text-center lg:text-left flex flex-col justify-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold mb-2 sm:mb-2.5">
                  Om hantverket
                </p>
                
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#242D27] leading-[1.25] font-medium mb-4 sm:mb-5">
                  Varje maska berättar en liten historia
                </h2>

                <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-7">
                  <p className="text-base sm:text-[17px] text-[#242D27] font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Bakom Sagomaskan finns en passion för att skapa med garn, färg och fantasi. Varje produkt virkas för hand och får sin egen lilla personlighet.
                  </p>

                  <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Jag tycker om att skapa saker som känns personliga, mysiga och gjorda för att användas och uppskattas länge.
                  </p>
                </div>

                <div>
                  <a
                    id="about-learn-more-btn"
                    href={getPageUrl('about')}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        onNavigate('about');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#242D27] text-[#FAF8F5] text-xs sm:text-sm font-medium hover:bg-[#6B8E7B] active:scale-[0.98] transition-all shadow-xs group cursor-pointer"
                  >
                    <span>Läs mer om hantverket →</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Welcome Popup for first-time / return visitors on homepage */}
      <WelcomePopup />

    </div>
  );
};
