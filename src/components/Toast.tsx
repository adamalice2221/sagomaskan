import React, { useEffect } from 'react';
import { CheckCircle2, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast, setIsCartOpen } = useCart();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div
      id="app-toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#242D27] text-[#FAF8F5] p-4 rounded-xl shadow-2xl border border-[#6B8E7B]/30 flex items-start gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <CheckCircle2 className="w-5 h-5 text-[#6B8E7B] shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#FAF8F5] leading-snug">
          {toastMessage}
        </p>
        <button
          onClick={() => {
            clearToast();
            setIsCartOpen(true);
          }}
          className="mt-1.5 text-xs text-[#8FA89B] hover:text-[#FAF8F5] underline underline-offset-2 flex items-center gap-1 font-light"
        >
          <ShoppingBag className="w-3 h-3" />
          <span>Öppna varukorgen</span>
        </button>
      </div>

      <button
        onClick={clearToast}
        className="p-1 -mr-1 -mt-1 text-[#FAF8F5]/60 hover:text-[#FAF8F5] rounded-md transition-colors"
        aria-label="Stäng notifikation"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
