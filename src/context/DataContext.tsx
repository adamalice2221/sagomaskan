import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Category, SiteSettings } from '../types';
import {
  subscribeProducts,
  subscribeCategories,
  subscribeSiteSettings,
  getSiteSettings,
  updateSiteSettings,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  seedInitialDataIfEmpty,
  DEFAULT_SETTINGS,
  INITIAL_CATEGORIES
} from '../services/db';
import { useAuth } from './AuthContext';

interface DataContextType {
  products: Product[];
  categories: Category[];
  settings: SiteSettings;
  settingsLoaded: boolean;
  settingsLoading: boolean;
  loading: boolean;
  addProduct: (product: Omit<Product, 'id'> & { id?: string }) => Promise<string>;
  editProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  copyProduct: (id: string) => Promise<string>;
  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => Promise<string>;
  editCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  saveSettings: (settings: Partial<SiteSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  products: [],
  categories: [],
  settings: DEFAULT_SETTINGS,
  settingsLoaded: false,
  settingsLoading: true,
  loading: true,
  addProduct: async () => '',
  editProduct: async () => {},
  removeProduct: async () => {},
  copyProduct: async () => '',
  addCategory: async () => '',
  editCategory: async () => {},
  removeCategory: async () => {},
  saveSettings: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [productsLoaded, setProductsLoaded] = useState<boolean>(false);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  // Initialize seed data once
  useEffect(() => {
    seedInitialDataIfEmpty();
    getSiteSettings()
      .then((sets) => {
        setSettings((prev) => prev || sets);
        setSettingsLoaded(true);
      })
      .catch(() => {
        setSettings((prev) => prev || DEFAULT_SETTINGS);
        setSettingsLoaded(true);
      });
  }, []);

  // Subscribe to products, categories and site settings
  useEffect(() => {
    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods);
      setProductsLoaded(true);
    }, isAdmin);

    const unsubCategories = subscribeCategories((cats) => {
      setCategories(cats.length > 0 ? cats : INITIAL_CATEGORIES);
    });

    const unsubSettings = subscribeSiteSettings((sets) => {
      setSettings(sets);
      setSettingsLoaded(true);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
    };
  }, [isAdmin]);

  const addProduct = async (productData: Omit<Product, 'id'> & { id?: string }) => {
    return await createProduct(productData);
  };

  const editProduct = async (id: string, updates: Partial<Product>) => {
    await updateProduct(id, updates);
  };

  const removeProduct = async (id: string) => {
    await deleteProduct(id);
  };

  const copyProduct = async (id: string) => {
    return await duplicateProduct(id);
  };

  const addCategory = async (categoryData: Omit<Category, 'id'> & { id?: string }) => {
    return await createCategory(categoryData);
  };

  const editCategory = async (id: string, updates: Partial<Category>) => {
    await updateCategory(id, updates);
  };

  const removeCategory = async (id: string) => {
    await deleteCategory(id);
  };

  const saveSettings = async (newSettings: Partial<SiteSettings>) => {
    await updateSiteSettings(newSettings);
    setSettings((prev) => ({ ...(prev || DEFAULT_SETTINGS), ...newSettings }));
  };

  return (
    <DataContext.Provider
      value={{
        products,
        categories,
        settings: settings || DEFAULT_SETTINGS,
        settingsLoaded,
        settingsLoading: !settingsLoaded,
        loading: !productsLoaded || !settingsLoaded,
        addProduct,
        editProduct,
        removeProduct,
        copyProduct,
        addCategory,
        editCategory,
        removeCategory,
        saveSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
