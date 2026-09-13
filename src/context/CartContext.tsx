import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  updateItemVariant: (
    productId: string,
    oldColor: string,
    oldSize: string | undefined,
    newColor: string,
    newSize: string | undefined
  ) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toastMessage: string | null;
  clearToast: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'sagomaskan_cart_v2';
const WISHLIST_STORAGE_KEY = 'sagomaskan_wishlist_v2';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Kunde inte spara förfrågelista i localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Kunde inte spara favoriter i localStorage', e);
    }
  }, [wishlist]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const clearToast = () => {
    setToastMessage(null);
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    size?: string
  ) => {
    const rawStock =
      product.stockQuantity !== undefined && product.stockQuantity !== null
        ? Number(product.stockQuantity)
        : 0;
    const stockQty = !isNaN(rawStock) ? Math.max(0, Math.floor(rawStock)) : 0;
    if (stockQty <= 0) {
      return;
    }

    const validQuantity = Math.max(1, Math.min(quantity, stockQty));

    const selectedColor =
      color || (product.colors.length > 0 ? product.colors[0].name : 'Standard');
    const selectedSize =
      size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const next = [...prevItems];
        // Säkerställ att totalen i listan aldrig överstiger stockQuantity
        const newQuantity = Math.min(
          next[existingIndex].quantity + validQuantity,
          stockQty
        );
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQuantity
        };
        return next;
      } else {
        return [
          ...prevItems,
          {
            product,
            quantity: validQuantity,
            selectedColor,
            selectedSize
          }
        ];
      }
    });

    // Exakt feedback som efterfrågas i kraven
    showToast('Tillagd i din förfrågelista');
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    setItems((prev) =>
      prev.filter((item) => {
        if (item.product.id !== productId) return true;
        if (color !== undefined && item.selectedColor !== color) return true;
        if (size !== undefined && item.selectedSize !== size) return true;
        return false;
      })
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    color?: string,
    size?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        const isMatch =
          item.product.id === productId &&
          (color === undefined || item.selectedColor === color) &&
          (size === undefined || item.selectedSize === size);
        if (!isMatch) return item;

        const rawStock =
          item.product.stockQuantity !== undefined && item.product.stockQuantity !== null
            ? Number(item.product.stockQuantity)
            : 0;
        const stockQty = !isNaN(rawStock) ? Math.max(0, Math.floor(rawStock)) : 0;
        const clampedQuantity =
          stockQty > 0 ? Math.max(1, Math.min(quantity, stockQty)) : Math.max(1, quantity);

        return { ...item, quantity: clampedQuantity };
      })
    );
  };

  const updateItemVariant = (
    productId: string,
    oldColor: string,
    oldSize: string | undefined,
    newColor: string,
    newSize: string | undefined
  ) => {
    setItems((prev) => {
      // Check if target variant already exists
      const targetIndex = prev.findIndex(
        (item) =>
          item.product.id === productId &&
          item.selectedColor === newColor &&
          item.selectedSize === newSize
      );

      const sourceIndex = prev.findIndex(
        (item) =>
          item.product.id === productId &&
          item.selectedColor === oldColor &&
          item.selectedSize === oldSize
      );

      if (sourceIndex === -1) return prev;

      if (targetIndex > -1 && targetIndex !== sourceIndex) {
        // Merge quantities
        const next = [...prev];
        next[targetIndex] = {
          ...next[targetIndex],
          quantity: next[targetIndex].quantity + next[sourceIndex].quantity
        };
        return next.filter((_, idx) => idx !== sourceIndex);
      } else {
        // Update variant on source item
        const next = [...prev];
        next[sourceIndex] = {
          ...next[sourceIndex],
          selectedColor: newColor,
          selectedSize: newSize
        };
        return next;
      }
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Borttagen från dina favoriter');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Sparad i dina favoriter ♡');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemVariant,
        clearCart,
        cartCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        toastMessage,
        clearToast,
        wishlist,
        toggleWishlist,
        isInWishlist
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
