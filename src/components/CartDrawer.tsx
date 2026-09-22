import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Info, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDiscount } from '../context/DiscountContext';
import { PageRoute } from '../types';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface CartDrawerProps {
  onNavigate: (page: PageRoute) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    updateItemVariant,
    subtotal
  } = useCart();

  const { appliedCode, discountResult } = useDiscount();

  if (!isCartOpen) return null;

  const handleGoToInquiry = () => {
    setIsCartOpen(false);
    onNavigate('checkout');
  };

  const handleViewFullList = () => {
    setIsCartOpen(false);
    onNavigate('cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#E6DFD3] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-[#E6DFD3] flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <ShoppingBag className="w-5 h-5 text-[#242D27] shrink-0" />
              <h2 className="font-serif text-lg sm:text-xl font-medium text-[#242D27] truncate">
                Din önskelista
              </h2>
              <span className="text-xs text-[#66726A] bg-[#F3EFE8] px-2 py-0.5 rounded-full font-medium shrink-0">
                {items.reduce((acc, i) => acc + i.quantity, 0)} st
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-[#66726A] hover:text-[#242D27] hover:bg-[#F3EFE8] transition-colors shrink-0"
              aria-label="Stäng önskelistan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inquiry Explanatory Banner */}
          <div className="px-5 py-3 bg-[#EFF4F1] border-b border-[#6B8E7B]/30 text-xs text-[#526E5F] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#6B8E7B]" />
            <p className="leading-relaxed">
              Detta är en <strong>beställningsförfrågan</strong>. Ingen betalning genomförs på webbplatsen.
            </p>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F3EFE8] flex items-center justify-center text-[#66726A]">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#242D27]">
                    Önskelistan är tom
                  </h3>
                  <p className="text-xs text-[#66726A] max-w-xs mt-1 leading-relaxed">
                    Hitta dina handgjorda virkade favoriter i shopen och lägg till dem här.
                  </p>
                </div>
                <a
                  href={getPageUrl('shop')}
                  onClick={(e) => {
                    if (!isModifiedClick(e)) {
                      e.preventDefault();
                      setIsCartOpen(false);
                      onNavigate('shop');
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#6B8E7B] transition-colors cursor-pointer"
                >
                  Utforska shoppen
                </a>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize || ''}`}
                  className="flex gap-4 pb-5 border-b border-[#E6DFD3]/60 last:border-b-0"
                >
                  <img
                    src={item.product.image || item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-[#F3EFE8] shrink-0 border border-[#E6DFD3]"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-base font-medium text-[#242D27] truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() =>
                            removeFromCart(
                              item.product.id,
                              item.selectedColor,
                              item.selectedSize
                            )
                          }
                          className="text-[#66726A] hover:text-[#8C5248] p-1 -mr-1 transition-colors"
                          aria-label="Ta bort från förfrågelista"
                          title="Ta bort från förfrågelista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Variant Selectors: Ändra färg och storlek */}
                      <div className="mt-1 space-y-1 text-xs">
                        {item.product.colors.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#66726A] text-[11px]">Färg:</span>
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
                              className="bg-[#F3EFE8] border border-[#E6DFD3] rounded-md px-1.5 py-0.5 text-[11px] text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                            >
                              {item.product.colors.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {item.product.sizes && item.product.sizes.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#66726A] text-[11px]">Storlek:</span>
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
                              className="bg-[#F3EFE8] border border-[#E6DFD3] rounded-md px-1.5 py-0.5 text-[11px] text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                            >
                              {item.product.sizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-3">
                      {(() => {
                        const itemStock =
                          typeof item.product.stockQuantity === 'number' && !isNaN(item.product.stockQuantity)
                            ? Math.max(0, Math.floor(item.product.stockQuantity))
                            : 0;
                        const isAtMax = itemStock > 0 && item.quantity >= itemStock;

                        return (
                          <div className="flex items-center border border-[#E6DFD3] rounded-lg bg-[#FAF8F5]">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                  item.selectedColor,
                                  item.selectedSize
                                )
                              }
                              className="p-1 hover:bg-[#F3EFE8] text-[#242D27] transition-colors rounded-l-lg"
                              aria-label="Minska antal"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold text-[#242D27]">
                              {item.quantity}
                            </span>
                            <button
                              disabled={isAtMax}
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                  item.selectedColor,
                                  item.selectedSize
                                )
                              }
                              className="p-1 hover:bg-[#F3EFE8] text-[#242D27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                              aria-label="Öka antal"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })()}
                      <span className="text-sm font-semibold text-[#242D27]">
                        {item.product.price * item.quantity} kr
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-[#E6DFD3] bg-[#FAF8F5] space-y-4">
              <div className="space-y-1.5">
                {appliedCode && discountResult?.valid && discountResult.discountAmount > 0 ? (
                  <>
                    <div className="flex justify-between text-xs text-[#66726A]">
                      <span>Ordinarie summa</span>
                      <span>{subtotal} kr</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#526E5F] font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>Rabatt ({appliedCode})</span>
                      </span>
                      <span>−{discountResult.discountAmount} kr</span>
                    </div>
                  </>
                ) : null}

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-serif text-lg text-[#242D27]">
                    Beräknad totalsumma
                  </span>
                  <span className="text-xl font-bold text-[#242D27]">
                    {appliedCode && discountResult?.valid
                      ? discountResult.totalAfterDiscount
                      : subtotal} kr
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#66726A] font-light leading-relaxed">
                Detta är en beställningsförfrågan. Ingen betalning genomförs på webbplatsen. Jag återkommer personligen med information om beställningen, pris, eventuell frakt och betalning.
              </p>

              <div className="flex flex-col gap-2.5">
                <a
                  id="drawer-inquiry-btn"
                  href={getPageUrl('checkout')}
                  onClick={(e) => {
                    if (!isModifiedClick(e)) {
                      e.preventDefault();
                      handleGoToInquiry();
                    }
                  }}
                  className="w-full py-3.5 px-4 bg-[#242D27] text-[#FAF8F5] rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#6B8E7B] transition-colors shadow-xs cursor-pointer"
                >
                  <span>Skicka beställningsförfrågan</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={getPageUrl('cart')}
                  onClick={(e) => {
                    if (!isModifiedClick(e)) {
                      e.preventDefault();
                      handleViewFullList();
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-[#F3EFE8] text-[#242D27] rounded-xl text-xs font-medium hover:bg-[#E6DFD3] transition-colors text-center cursor-pointer"
                >
                  Hantera önskelistan
                </a>
              </div>

              <p className="text-[11px] text-center text-[#66726A] font-light">
                Handgjort i Sverige • Personlig kontakt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
