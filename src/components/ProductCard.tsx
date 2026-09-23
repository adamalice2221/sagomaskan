import React, { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isFavorite = isInWishlist(product.id);

  // Beräkna lagerantal och lagerstatus
  const stockQty = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity)
    ? Math.max(0, Math.floor(product.stockQuantity))
    : 0;
  const isOutOfStock = stockQty === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    const defaultColor = product.colors[0]?.name || 'Standard';
    const defaultSize = product.sizes?.[0];

    addToCart(product, 1, defaultColor, defaultSize);

    setTimeout(() => {
      setIsAdding(false);
    }, 1400);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isModifiedClick(e)) {
      e.preventDefault();
      onSelect(product.id);
    }
  };

  const primaryImage = product.image || product.images?.[0];
  const productUrl = getPageUrl('product', { productId: product.id });

  return (
    <a
      id={`product-card-${product.id}`}
      href={productUrl}
      onClick={handleCardClick}
      className="group relative flex flex-col bg-[#FAF8F5] rounded-2xl overflow-hidden border border-[#E6DFD3] hover:border-[#6B8E7B]/50 hover:shadow-md transition-all duration-300 cursor-pointer block text-left"
    >
      {/* Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F3EFE8]">
        {!imageError && primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F3EFE8] text-[#66726A]">
            <span className="font-serif italic text-lg text-[#242D27] mb-1">
              {product.name}
            </span>
            <span className="text-xs uppercase tracking-widest text-[#6B8E7B]">
              Handvirkat hantverk
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.newProduct && (
            <span className="px-2.5 py-1 bg-[#242D27] text-[#FAF8F5] text-[10px] font-medium tracking-widest uppercase rounded-full shadow-xs">
              Nyhet
            </span>
          )}
          {stockQty > 1 && (
            <span className="px-2.5 py-1 bg-[#EFF4F1] text-[#2E6B4B] text-[10px] font-medium tracking-wider rounded-full border border-[#2E6B4B]/30 shadow-xs">
              I lager
            </span>
          )}
          {stockQty === 1 && (
            <span className="px-2.5 py-1 bg-[#EFF4F1] text-[#2E6B4B] text-[10px] font-medium tracking-wider rounded-full border border-[#2E6B4B]/30 shadow-xs">
              1 kvar
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 bg-[#F5E8E5] text-[#8C5248] text-[10px] font-medium tracking-widest uppercase rounded-full shadow-xs">
              Slut i lager
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          id={`wishlist-toggle-${product.id}`}
          type="button"
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-[#FAF8F5]/90 hover:bg-[#FAF8F5] text-[#242D27] transition-all shadow-xs z-10 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer"
          aria-label={isFavorite ? `Ta bort ${product.name} från favoriter` : `Spara ${product.name} som favorit`}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#6B8E7B] text-[#6B8E7B]' : 'text-[#242D27] hover:text-[#6B8E7B]'
            }`}
          />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-grow p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] tracking-wider uppercase text-[#66726A] font-medium">
            {product.category}
          </span>
          {product.ageGroup && (
            <span className="px-2 py-0.5 rounded-full bg-[#F3EFE8] border border-[#E6DFD3] text-[#526E5F] text-[10px] font-medium tracking-wide">
              {product.ageGroup}
            </span>
          )}
        </div>
        
        <h3 className="font-serif text-lg font-medium text-[#242D27] group-hover:text-[#6B8E7B] transition-colors leading-snug line-clamp-1">
          {product.name}
        </h3>

        <p className="mt-1 text-xs text-[#66726A] line-clamp-2 leading-relaxed font-light mb-3">
          {product.shortDescription}
        </p>

        {/* Colors Preview Chips */}
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            {product.colors.slice(0, 5).map((col) => (
              <span
                key={col.name}
                className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-[#66726A]">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Price and Inquiry Button Bar */}
        <div className="mt-auto pt-3 border-t border-[#E6DFD3]/70 flex items-center justify-between gap-2">
          <div className="shrink-0">
            <span className="text-base sm:text-lg font-semibold text-[#242D27] whitespace-nowrap leading-none tracking-tight">
              {product.price}&nbsp;kr
            </span>
          </div>

          <button
            id={`add-to-cart-btn-${product.id}`}
            type="button"
            disabled={isOutOfStock || isAdding}
            onClick={handleAddToCart}
            className={`px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer shrink-0 ${
              isOutOfStock
                ? 'bg-[#E6DFD3] text-[#66726A] cursor-not-allowed'
                : isAdding
                ? 'bg-[#EFF4F1] text-[#526E5F] border border-[#6B8E7B]/40 font-medium'
                : 'bg-[#242D27] text-[#FAF8F5] hover:bg-[#6B8E7B] active:scale-[0.98]'
            }`}
            aria-label={`Lägg till ${product.name} i önskelista`}
            title={`Lägg till ${product.name} i önskelista`}
          >
            {isAdding ? (
              <span className="text-[11px] sm:text-xs whitespace-nowrap text-[#526E5F] flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5 text-[#6B8E7B] shrink-0" />
                <span>Tillagd i önskelistan</span>
              </span>
            ) : isOutOfStock ? (
              <span className="text-[11px] sm:text-xs whitespace-nowrap text-[#66726A]">Slut i lager</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs whitespace-nowrap font-medium">
                  <span className="sm:hidden">Lägg till</span>
                  <span className="hidden sm:inline">Lägg till i önskelista</span>
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </a>
  );
};
