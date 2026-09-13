import React from 'react';
import { Heart, ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Product, PageRoute } from '../types';
import { ProductCard } from '../components/ProductCard';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface WishlistPageProps {
  products: Product[];
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ products, onNavigate }) => {
  const { wishlist, toggleWishlist } = useCart();

  const favoriteProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Header */}
      <div className="border-b border-[#E6DFD3] pb-6 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Dina sparade favoriter
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium mt-1">
            Önskelista
          </h1>
        </div>
        <p className="text-xs text-[#66726A]">
          {favoriteProducts.length} {favoriteProducts.length === 1 ? 'produkt' : 'produkter'} sparade
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto bg-[#F3EFE8]/30 rounded-2xl border border-dashed border-[#E6DFD3] p-8">
          <div className="w-16 h-16 rounded-full bg-[#F3EFE8] flex items-center justify-center mx-auto text-[#66726A]">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-2xl text-[#242D27]">
            Du har inga sparade favoriter än
          </h3>
          <p className="text-xs text-[#66726A] font-light leading-relaxed">
            Klicka på hjärtikonen på valfri produkt i shoppen för att spara dina favoriter här.
          </p>
          <a
            href={getPageUrl('shop')}
            onClick={(e) => {
              if (!isModifiedClick(e)) {
                e.preventDefault();
                onNavigate('shop');
              }
            }}
            className="inline-block px-6 py-2.5 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors cursor-pointer"
          >
            Utforska shoppen
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(id) => onNavigate('product', id)}
            />
          ))}
        </div>
      )}

      {favoriteProducts.length > 0 && (
        <div className="pt-4 border-t border-[#E6DFD3]">
          <a
            href={getPageUrl('shop')}
            onClick={(e) => {
              if (!isModifiedClick(e)) {
                e.preventDefault();
                onNavigate('shop');
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#242D27] hover:text-[#6B8E7B] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Fortsätt utforska fler produkter</span>
          </a>
        </div>
      )}

    </div>
  );
};
