import React, { useState, useEffect } from 'react';
import {
  Heart,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  Scissors,
  Info,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { Product, PageRoute, ProductCategory } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onNavigate: (page: PageRoute, productId?: string, category?: ProductCategory) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onNavigate
}) => {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.colors.length > 0 ? product.colors[0].name : 'Standard'
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = isInWishlist(product.id);

  // Beräkna lagerantal och lagerstatus
  const rawStock =
    product.stockQuantity !== undefined && product.stockQuantity !== null
      ? Number(product.stockQuantity)
      : 0;
  const stockQty = !isNaN(rawStock) ? Math.max(0, Math.floor(rawStock)) : 0;
  const isOutOfStock = stockQty === 0;

  // Synka och begränsa quantity-state så det aldrig överstiger stockQuantity
  useEffect(() => {
    if (stockQty > 0) {
      setQuantity((prev) => Math.max(1, Math.min(prev, stockQty)));
    } else {
      setQuantity(1);
    }
  }, [product.id, stockQty]);

  // Related products from same category, excluding current
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (isOutOfStock || stockQty <= 0) return;

    // Säkerställ att den slutliga kvantiteten aldrig överstiger tillgängligt lager
    const finalQuantity = Math.max(1, Math.min(quantity, stockQty));
    addToCart(product, finalQuantity, selectedColor, selectedSize);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const handleDecrease = () => {
    if (isOutOfStock || stockQty <= 0) return;
    setQuantity((prev) => Math.max(1, Math.min(prev - 1, stockQty)));
  };

  const handleIncrease = () => {
    if (isOutOfStock || stockQty <= 0) return;
    setQuantity((prev) => Math.min(prev + 1, stockQty));
  };

  // Manuell inmatning med strikt validering
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOutOfStock || stockQty <= 0) return;
    const val = e.target.value;
    if (val === '') {
      setQuantity(0);
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;

    if (parsed > stockQty) {
      setQuantity(stockQty);
    } else if (parsed < 1) {
      setQuantity(1);
    } else {
      setQuantity(parsed);
    }
  };

  const handleQuantityBlur = () => {
    if (isOutOfStock || stockQty <= 0) {
      setQuantity(1);
      return;
    }
    setQuantity((prev) => {
      if (typeof prev !== 'number' || isNaN(prev) || prev < 1) {
        return 1;
      }
      return Math.min(Math.floor(prev), stockQty);
    });
  };

  const isBabyCategory =
    product.category === 'Skallror' ||
    product.category === 'Bitringar' ||
    product.ageGroup === 'Baby';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-[#66726A]">
        <a
          href={getPageUrl('home')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('home');
            }
          }}
          className="hover:text-[#242D27] transition-colors cursor-pointer"
        >
          Hem
        </a>
        <span>/</span>
        <a
          href={getPageUrl('shop')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('shop');
            }
          }}
          className="hover:text-[#242D27] transition-colors cursor-pointer"
        >
          Shop
        </a>
        <span>/</span>
        <a
          href={getPageUrl('shop', { category: product.category })}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('shop', undefined, product.category);
            }
          }}
          className="text-[#242D27] font-medium hover:text-[#6B8E7B] transition-colors cursor-pointer"
        >
          {product.category}
        </a>
        <span>/</span>
        <span className="text-[#66726A] truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Column: Product Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden bg-[#F3EFE8] border border-[#E6DFD3] shadow-xs">
            <img
              src={product.images[selectedImageIndex] || product.image || product.images[0]}
              alt={`${product.name} - ${selectedColor}`}
              className="w-full h-full object-contain object-center transition-all duration-300"
            />

            {/* Badges on main image */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.newProduct && (
                <span className="px-3 py-1 bg-[#242D27] text-[#FAF8F5] text-xs font-medium uppercase tracking-wider rounded-full shadow-xs">
                  Nyhet
                </span>
              )}
              {stockQty > 1 && (
                <span className="px-3 py-1 bg-[#EFF4F1] text-[#2E6B4B] text-xs font-medium tracking-wider rounded-full border border-[#2E6B4B]/30 shadow-xs">
                  I lager
                </span>
              )}
              {stockQty === 1 && (
                <span className="px-3 py-1 bg-[#EFF4F1] text-[#2E6B4B] text-xs font-medium tracking-wider rounded-full border border-[#2E6B4B]/30 shadow-xs">
                  1 kvar
                </span>
              )}
              {isOutOfStock && (
                <span className="px-3 py-1 bg-[#F5E8E5] text-[#8C5248] text-xs font-medium uppercase tracking-wider rounded-full shadow-xs">
                  Slut i lager
                </span>
              )}
            </div>

            {/* Favorite Button */}
            <button
              id="product-detail-favorite-btn"
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-3 rounded-full bg-[#FAF8F5]/90 hover:bg-[#FAF8F5] text-[#242D27] shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              aria-label="Spara i favoriter"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorite ? 'fill-[#6B8E7B] text-[#6B8E7B]' : 'text-[#242D27] hover:text-[#6B8E7B]'
                }`}
              />
            </button>
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#6B8E7B] shadow-xs'
                      : 'border-[#E6DFD3] hover:border-[#6B8E7B]/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} miniatyr ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Produktens saga */}
          {product.story && (
            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#526E5F] uppercase tracking-[0.15em]">
                <Sparkles className="w-3.5 h-3.5 text-[#6B8E7B]" />
                <span>Produktens saga</span>
              </div>
              <p className="font-serif italic text-sm text-[#242D27] leading-relaxed">
                "{product.story}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Form */}
        <div className="lg:col-span-5 space-y-6">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
                {product.category}
              </span>
              {product.ageGroup && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3EFE8] border border-[#E6DFD3] text-[#526E5F] text-[10px] font-medium tracking-wide">
                  {product.ageGroup}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium tracking-tight mt-1.5">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#242D27]">
                {product.price} kr
              </span>
              <span className="text-xs text-[#66726A] font-light">inkl. moms</span>
            </div>
          </div>

          {/* Stock status indicator */}
          <div className="flex items-center gap-2 text-xs font-medium">
            {stockQty > 1 && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E6B4B]" />
                <span className="text-[#2E6B4B]">
                  I lager – finns {stockQty} st färdiga exemplar i ateljén
                </span>
              </>
            )}
            {stockQty === 1 && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E6B4B]" />
                <span className="text-[#2E6B4B]">
                  1 kvar – endast ett exemplar kvar i ateljén
                </span>
              </>
            )}
            {isOutOfStock && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C5248]" />
                <span className="text-[#8C5248]">
                  Slut i lager – kontakta mig för förfrågan
                </span>
              </>
            )}
          </div>

          {/* Product Description */}
          <p className="text-sm text-[#66726A] font-light leading-relaxed">
            {product.description}
          </p>

          {/* Color selector */}
          {product.colors.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#E6DFD3]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#242D27]">
                  Välj färg:{' '}
                  <strong className="font-semibold text-[#6B8E7B]">{selectedColor}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                        isSelected
                          ? 'border-[#242D27] bg-[#FAF8F5] shadow-xs ring-1 ring-[#242D27]'
                          : 'border-[#E6DFD3] bg-[#FAF8F5] hover:border-[#6B8E7B]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector (if product has sizes) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#E6DFD3]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[#242D27]">
                  Välj storlek:{' '}
                  <strong className="font-semibold text-[#6B8E7B]">{selectedSize || 'Välj'}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-[#242D27] bg-[#242D27] text-[#FAF8F5] shadow-xs'
                          : 'border-[#E6DFD3] bg-[#FAF8F5] text-[#242D27] hover:border-[#6B8E7B]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector and Add to Inquiry List Button */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Quantity Counter */}
              <div className="flex items-center justify-center sm:justify-start border border-[#E6DFD3] rounded-xl bg-[#FAF8F5] p-1 w-full sm:w-auto">
                <button
                  id="product-decrease-qty-btn"
                  type="button"
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || isOutOfStock || stockQty <= 0}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#242D27] hover:bg-[#F3EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Minska antal"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="product-qty-input"
                  type="number"
                  min={1}
                  max={stockQty > 0 ? stockQty : 1}
                  step={1}
                  value={quantity === 0 ? '' : quantity}
                  disabled={isOutOfStock || stockQty <= 0}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  className="w-11 text-center text-sm font-semibold text-[#242D27] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                  aria-label="Antal"
                />
                <button
                  id="product-increase-qty-btn"
                  type="button"
                  onClick={handleIncrease}
                  disabled={isOutOfStock || stockQty <= 0 || quantity >= stockQty}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#242D27] hover:bg-[#F3EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Öka antal"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Main CTA Button: Lägg till i förfrågelista */}
              <button
                id="product-add-to-cart-cta"
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdded}
                className={`flex-1 py-3.5 px-6 rounded-xl font-medium text-sm tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] ${
                  isOutOfStock
                    ? 'bg-[#E6DFD3] text-[#66726A] cursor-not-allowed'
                    : isAdded
                    ? 'bg-[#EFF4F1] text-[#526E5F] border border-[#6B8E7B]/50'
                    : 'bg-[#242D27] text-[#FAF8F5] hover:bg-[#6B8E7B] active:scale-[0.98]'
                }`}
              >
                {isOutOfStock ? (
                  <span>Slut i lager</span>
                ) : isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-[#6B8E7B]" />
                    <span>Tillagd i din förfrågelista</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Lägg till i förfrågelista</span>
                  </>
                )}
              </button>
            </div>

            {/* Informational reassurance notice */}
            <div className="p-3.5 bg-[#EFF4F1] border border-[#6B8E7B]/25 rounded-xl text-xs text-[#526E5F] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-[#6B8E7B] shrink-0 mt-0.5" />
              <p>
                <strong>Detta är en beställningsförfrågan.</strong> Ingen betalning genomförs på webbplatsen. Jag återkommer personligen med information om beställningen, pris, eventuell frakt och betalning.
              </p>
            </div>

            {/* Lead time */}
            <p className="text-xs text-[#66726A] flex items-center gap-1.5 font-light">
              <Scissors className="w-3.5 h-3.5 text-[#6B8E7B]" />
              <span>{product.leadTime || 'Virkas för hand med omsorg'}</span>
            </p>
          </div>

          {/* Product Specifications & Details */}
          <div className="pt-6 border-t border-[#E6DFD3] space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#242D27] font-semibold">
              Information & Detaljer
            </h4>
            
            <div className="bg-[#F3EFE8]/60 rounded-xl p-4 divide-y divide-[#E6DFD3]/80 text-xs space-y-2">
              {product.material && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#66726A]">Material:</span>
                  <span className="text-[#242D27] font-medium text-right max-w-xs">{product.material}</span>
                </div>
              )}
              {product.ageGroup && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#66726A]">Målgrupp:</span>
                  <span className="text-[#242D27] font-medium text-right">{product.ageGroup}</span>
                </div>
              )}
              {product.recommendedAge && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#66726A]">Rekommenderad ålder:</span>
                  <span className="text-[#242D27] font-medium text-right">{product.recommendedAge}</span>
                </div>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#66726A]">Storlekar:</span>
                  <span className="text-[#242D27] font-medium text-right">{product.sizes.join(', ')}</span>
                </div>
              )}
              {product.craftsmanship && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#66726A]">Hantverk:</span>
                  <span className="text-[#242D27] font-medium text-right">{product.craftsmanship}</span>
                </div>
              )}
              {product.careInstructions && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#66726A]">Skötselråd:</span>
                  <span className="text-[#242D27] font-medium text-right max-w-xs">{product.careInstructions}</span>
                </div>
              )}
            </div>

            {/* Baby Safety Information Notice if present */}
            {product.safetyInformation && (
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl text-xs text-[#66726A] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#6B8E7B] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#242D27]">Säkerhetsinformation: </strong>
                  {product.safetyInformation}
                </p>
              </div>
            )}
          </div>

          {/* Genuine Neutral Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#66726A]">
            <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl flex items-center gap-2.5">
              <Scissors className="w-4 h-4 text-[#6B8E7B]" />
              <span>Varje produkt skapas för hand</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#6B8E7B]" />
              <span>Personlig kontakt via e-post</span>
            </div>
          </div>

        </div>

      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-16 border-t border-[#E6DFD3] space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
                Fler alster i samma kategori
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#242D27]">
                Relaterade produkter
              </h3>
            </div>
            <a
              href={getPageUrl('shop', { category: product.category })}
              onClick={(e) => {
                if (!isModifiedClick(e)) {
                  e.preventDefault();
                  onNavigate('shop', undefined, product.category);
                }
              }}
              className="text-xs font-medium text-[#242D27] hover:text-[#6B8E7B] cursor-pointer"
            >
              Visa alla i shoppen →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onSelect={(id) => {
                  onNavigate('product', id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
