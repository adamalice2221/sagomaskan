import React from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Info,
  Heart,
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDiscount } from '../context/DiscountContext';
import { PageRoute } from '../types';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface CartPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    updateItemVariant,
    clearCart,
    subtotal
  } = useCart();

  const {
    appliedCode,
    appliedDiscount,
    discountResult,
    discountInput,
    setDiscountInput,
    applyDiscount,
    removeDiscount,
    discountError,
    clearDiscountError,
    isApplying
  } = useDiscount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-[#E6DFD3] pb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium">
            Din förfrågelista
          </h1>
          <p className="text-sm text-[#66726A] font-light mt-1">
            Samla de handgjorda produkterna du är intresserad av innan du skickar din förfrågan.
          </p>
        </div>
        <p className="text-xs text-[#66726A]">
          {items.reduce((acc, i) => acc + i.quantity, 0)} alster i listan
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-6 max-w-md mx-auto bg-[#F3EFE8]/40 rounded-2xl border border-dashed border-[#E6DFD3] p-8">
          <div className="w-16 h-16 rounded-full bg-[#F3EFE8] flex items-center justify-center mx-auto text-[#66726A]">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-[#242D27]">
              Förfrågelistan är tom
            </h2>
            <p className="text-sm text-[#66726A] mt-2 leading-relaxed font-light">
              Utforska vårt sortiment av handvirkade mössor, pannband, halsdukar, strumpor, skallror och bitringar.
            </p>
          </div>
          <a
            href={getPageUrl('shop')}
            onClick={(e) => {
              if (!isModifiedClick(e)) {
                e.preventDefault();
                onNavigate('shop');
              }
            }}
            className="inline-block px-8 py-3.5 bg-[#242D27] text-[#FAF8F5] text-sm font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors shadow-xs cursor-pointer"
          >
            Fortsätt titta på produkter
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Items Table (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Informational Banner */}
            <div className="p-4 rounded-xl bg-[#EFF4F1] border border-[#6B8E7B]/30 text-xs text-[#526E5F] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-medium text-[#242D27]">
                  Detta är en beställningsförfrågan
                </p>
                <p>
                  Detta är en beställningsförfrågan. Ingen betalning genomförs på webbplatsen. Jag återkommer personligen med information om beställningen, pris, eventuell frakt och betalning.
                </p>
              </div>
            </div>

            {/* Table Header (hidden on mobile) */}
            <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 border-b border-[#E6DFD3] text-xs font-semibold uppercase tracking-wider text-[#66726A]">
              <div className="col-span-6">Produkt & Alternativ</div>
              <div className="col-span-3 text-center">Antal</div>
              <div className="col-span-3 text-right">Pris</div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-[#E6DFD3]">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize || ''}`}
                  className="py-5 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center"
                >
                  {/* Product Details & Variant Selectors (col-span-6) */}
                  <div className="w-full sm:col-span-6 flex items-start gap-4">
                    <a
                      href={getPageUrl('product', { productId: item.product.id })}
                      onClick={(e) => {
                        if (!isModifiedClick(e)) {
                          e.preventDefault();
                          onNavigate('product', item.product.id);
                        }
                      }}
                      className="cursor-pointer shrink-0"
                    >
                      <img
                        src={item.product.image || item.product.images[0]}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-xl object-cover bg-[#F3EFE8] border border-[#E6DFD3]"
                      />
                    </a>
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <a
                        href={getPageUrl('product', { productId: item.product.id })}
                        onClick={(e) => {
                          if (!isModifiedClick(e)) {
                            e.preventDefault();
                            onNavigate('product', item.product.id);
                          }
                        }}
                        className="font-serif text-base font-medium text-[#242D27] hover:text-[#6B8E7B] text-left transition-colors truncate block cursor-pointer"
                      >
                        {item.product.name}
                      </a>

                      {/* Ändra färg */}
                      {item.product.colors.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#66726A]">Färg:</span>
                          <select
                            value={item.selectedColor}
                            onChange={(e) =>
                              updateItemVariant(
                                item.product.id,
                                item.selectedColor,
                                item.selectedSize,
                                e.target.value,
                                item.selectedSize
                              )
                            }
                            className="bg-[#F3EFE8] border border-[#E6DFD3] rounded-lg px-2 py-1 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                          >
                            {item.product.colors.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Ändra storlek */}
                      {item.product.sizes && item.product.sizes.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#66726A]">Storlek:</span>
                          <select
                            value={item.selectedSize || item.product.sizes[0]}
                            onChange={(e) =>
                              updateItemVariant(
                                item.product.id,
                                item.selectedColor,
                                item.selectedSize,
                                item.selectedColor,
                                e.target.value
                              )
                            }
                            className="bg-[#F3EFE8] border border-[#E6DFD3] rounded-lg px-2 py-1 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                          >
                            {item.product.sizes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <p className="text-xs text-[#66726A] font-light">
                        {item.product.price} kr / st
                      </p>
                    </div>
                  </div>

                  {/* Quantity Counter (col-span-3) */}
                  <div className="w-full sm:w-auto sm:col-span-3 flex sm:justify-center justify-between items-center">
                    {(() => {
                      const itemStock =
                        typeof item.product.stockQuantity === 'number' && !isNaN(item.product.stockQuantity)
                          ? Math.max(0, Math.floor(item.product.stockQuantity))
                          : 0;
                      const isAtMax = itemStock > 0 && item.quantity >= itemStock;

                      return (
                        <div className="flex items-center border border-[#E6DFD3] rounded-lg bg-[#FAF8F5]">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.selectedColor,
                                item.selectedSize
                              )
                            }
                            className="p-1.5 hover:bg-[#F3EFE8] text-[#242D27] transition-colors rounded-l-lg"
                            aria-label="Minska antal"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-semibold text-[#242D27]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isAtMax}
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.selectedColor,
                                item.selectedSize
                              )
                            }
                            className="p-1.5 hover:bg-[#F3EFE8] text-[#242D27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                            aria-label="Öka antal"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() =>
                        removeFromCart(
                          item.product.id,
                          item.selectedColor,
                          item.selectedSize
                        )
                      }
                      className="sm:hidden text-xs text-[#8C5248] hover:underline p-1 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ta bort</span>
                    </button>
                  </div>

                  {/* Line Total & Remove button (col-span-3) */}
                  <div className="w-full sm:w-auto sm:col-span-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                    <span className="text-base font-semibold text-[#242D27]">
                      {item.product.price * item.quantity} kr
                    </span>
                    <button
                      onClick={() =>
                        removeFromCart(
                          item.product.id,
                          item.selectedColor,
                          item.selectedSize
                        )
                      }
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#66726A] hover:text-[#8C5248] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Ta bort</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions under table */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E6DFD3]">
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
                <span>Fortsätt titta på produkter</span>
              </a>

              <button
                onClick={clearCart}
                className="text-xs text-[#66726A] hover:text-[#8C5248] transition-colors cursor-pointer"
              >
                Töm förfrågelistan
              </button>
            </div>

          </div>

          {/* Right Column: Inquiry Summary Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#F3EFE8]/70 border border-[#E6DFD3] rounded-2xl p-6 space-y-6 sticky top-28">
              <h3 className="font-serif text-xl font-medium text-[#242D27]">
                Summering av förfrågan
              </h3>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-sm pt-2">
                <div className="flex justify-between text-[#66726A]">
                  <span>Beräknad varusumma</span>
                  <span className="font-medium text-[#242D27]">{subtotal} kr</span>
                </div>

                {appliedCode && discountResult?.valid && discountResult.discountAmount > 0 ? (
                  <div className="flex justify-between text-[#526E5F] font-medium text-xs">
                    <span className="flex items-center gap-1">
                      <span>Rabatt</span>
                      <span className="font-mono text-[11px] bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#CDE0D4]">
                        {appliedCode}
                      </span>
                    </span>
                    <span>−{discountResult.discountAmount} kr</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-[#66726A] text-xs">
                  <span>Eventuell frakt</span>
                  <span>Specificeras i svarsmejl</span>
                </div>

                <div className="pt-4 border-t border-[#E6DFD3] flex justify-between items-baseline">
                  <div>
                    <span className="font-serif text-lg text-[#242D27] block">Beräknad summa</span>
                    {appliedCode && discountResult?.valid && (
                      <span className="text-[11px] text-[#526E5F] font-medium">Efter rabatt</span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-[#242D27]">
                    {appliedCode && discountResult?.valid
                      ? discountResult.totalAfterDiscount
                      : subtotal} kr
                  </span>
                </div>
              </div>

              {/* Discount Code Input Section */}
              <div className="pt-4 border-t border-[#E6DFD3] space-y-2">
                <label htmlFor="cart-discount-input" className="block text-xs font-semibold text-[#242D27]">
                  Har du en rabattkod?
                </label>
                {appliedCode && discountResult?.valid ? (
                  <div className="p-3 bg-[#EBF3EE] border border-[#CDE0D4] rounded-xl space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#526E5F] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Koden <strong className="font-mono">{appliedCode}</strong> är aktiv</span>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-xs text-[#8C5248] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Ta bort</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#526E5F]">
                      {appliedDiscount?.discountType === 'percentage'
                        ? `${appliedDiscount.discountValue} % rabatt dras från totalsumman.`
                        : `${appliedDiscount?.discountValue} kr fast rabatt dras från totalsumman.`}
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyDiscount();
                    }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-[#8C9B90] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="cart-discount-input"
                          type="text"
                          placeholder="Ange rabattkod"
                          value={discountInput}
                          onChange={(e) => {
                            setDiscountInput(e.target.value.toUpperCase());
                            clearDiscountError();
                          }}
                          className="w-full uppercase font-mono font-medium bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl pl-8 pr-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplying || !discountInput.trim()}
                        className="px-4 py-2 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#344038] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                      >
                        {isApplying ? '...' : 'Använd'}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-[11px] text-[#8C5248] font-medium pt-0.5 animate-fadeIn">
                        {discountError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Inquiry CTA */}
              <a
                id="cart-page-inquiry-btn"
                href={getPageUrl('checkout')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    onNavigate('checkout');
                  }
                }}
                className="w-full py-4 px-6 bg-[#242D27] text-[#FAF8F5] rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#6B8E7B] transition-colors shadow-sm text-center cursor-pointer block"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Gå vidare till beställningsförfrågan</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>

              <div className="pt-2 text-xs text-[#66726A] space-y-2 font-light">
                <p className="flex items-center gap-1.5 text-[#242D27]">
                  <Heart className="w-3.5 h-3.5 text-[#6B8E7B] fill-[#6B8E7B]" />
                  <span>Personligt hantverk med omtanke</span>
                </p>
                <p>
                  Detta är en beställningsförfrågan. Ingen betalning genomförs på webbplatsen. Jag återkommer personligen med information om beställningen, pris, eventuell frakt och betalning.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
