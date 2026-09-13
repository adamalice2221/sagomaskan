import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Discount, DiscountValidationResult } from '../types';
import { useCart } from './CartContext';
import {
  getDiscountByCode,
  calculateDiscount,
  normalizeDiscountCode
} from '../services/discountService';

interface DiscountContextType {
  appliedCode: string | null;
  appliedDiscount: Discount | null;
  discountResult: DiscountValidationResult | null;
  discountInput: string;
  setDiscountInput: (code: string) => void;
  applyDiscount: (code?: string) => Promise<boolean>;
  removeDiscount: () => void;
  discountError: string | null;
  clearDiscountError: () => void;
  isApplying: boolean;
}

const DiscountContext = createContext<DiscountContextType | undefined>(undefined);

const DISCOUNT_STORAGE_KEY = 'sagomaskan_applied_discount_v1';

export const DiscountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { items } = useCart();

  const [appliedCode, setAppliedCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISCOUNT_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [discountResult, setDiscountResult] = useState<DiscountValidationResult | null>(null);

  // Sync applied discount with localStorage
  useEffect(() => {
    try {
      if (appliedCode) {
        localStorage.setItem(DISCOUNT_STORAGE_KEY, appliedCode);
      } else {
        localStorage.removeItem(DISCOUNT_STORAGE_KEY);
      }
    } catch {
      // Ignore localstorage errors
    }
  }, [appliedCode]);

  // Load applied discount details from Firestore if code is set
  useEffect(() => {
    let isMounted = true;
    if (appliedCode) {
      getDiscountByCode(appliedCode).then((discount) => {
        if (!isMounted) return;
        if (discount) {
          setAppliedDiscount(discount);
        } else {
          // If code was deleted in Firestore
          setAppliedDiscount(null);
          setAppliedCode(null);
        }
      });
    } else {
      setAppliedDiscount(null);
    }
    return () => {
      isMounted = false;
    };
  }, [appliedCode]);

  // Re-calculate discount validation dynamically when items change or discount changes
  useEffect(() => {
    if (!appliedDiscount || items.length === 0) {
      setDiscountResult(null);
      return;
    }

    const result = calculateDiscount(appliedDiscount, items);
    setDiscountResult(result);

    if (!result.valid && result.errorMessage) {
      setDiscountError(result.errorMessage);
    } else {
      setDiscountError(null);
    }
  }, [appliedDiscount, items]);

  const clearDiscountError = useCallback(() => {
    setDiscountError(null);
  }, []);

  const removeDiscount = useCallback(() => {
    setAppliedCode(null);
    setAppliedDiscount(null);
    setDiscountResult(null);
    setDiscountError(null);
    setDiscountInput('');
  }, []);

  const applyDiscount = useCallback(
    async (rawCode?: string): Promise<boolean> => {
      const codeToApply = normalizeDiscountCode(rawCode || discountInput);
      setDiscountError(null);

      if (!codeToApply) {
        setDiscountError('Vänligen ange en rabattkod.');
        return false;
      }

      if (items.length === 0) {
        setDiscountError('Förfrågelistan är tom.');
        return false;
      }

      setIsApplying(true);

      try {
        const discount = await getDiscountByCode(codeToApply);
        if (!discount) {
          setDiscountError('Ogiltig rabattkod.');
          setIsApplying(false);
          return false;
        }

        const result = calculateDiscount(discount, items);
        if (!result.valid) {
          setDiscountError(result.errorMessage || 'Rabattkoden kan inte användas.');
          setIsApplying(false);
          return false;
        }

        setAppliedCode(discount.code);
        setAppliedDiscount(discount);
        setDiscountResult(result);
        setDiscountInput('');
        setIsApplying(false);
        return true;
      } catch (err: any) {
        setDiscountError(err?.message || 'Ett fel uppstod vid validering av rabattkoden.');
        setIsApplying(false);
        return false;
      }
    },
    [discountInput, items]
  );

  return (
    <DiscountContext.Provider
      value={{
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
      }}
    >
      {children}
    </DiscountContext.Provider>
  );
};

export const useDiscount = (): DiscountContextType => {
  const context = useContext(DiscountContext);
  if (!context) {
    throw new Error('useDiscount must be used within a DiscountProvider');
  }
  return context;
};
