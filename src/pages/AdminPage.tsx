import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { subscribeInquiries, seedInitialDataIfEmpty, seedInitialCategoriesIfEmpty } from '../services/db';
import { Inquiry, AdminTab, Product, Discount } from '../types';
import { subscribeDiscounts } from '../services/discountService';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminProductsList } from '../components/admin/AdminProductsList';
import { AdminProductEditor } from '../components/admin/AdminProductEditor';
import { AdminCategories } from '../components/admin/AdminCategories';
import { AdminDiscounts } from '../components/admin/AdminDiscounts';
import { AdminInquiriesList } from '../components/admin/AdminInquiriesList';
import { AdminInquiryDetail } from '../components/admin/AdminInquiryDetail';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AlertCircle } from 'lucide-react';

interface AdminPageProps {
  onGoToShop: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onGoToShop }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const {
    products,
    categories,
    settings,
    addProduct,
    editProduct,
    removeProduct,
    copyProduct,
    addCategory,
    editCategory,
    removeCategory,
    saveSettings
  } = useData();

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  // Subscribe to inquiries and discounts when admin is logged in
  useEffect(() => {
    if (isAdmin) {
      seedInitialDataIfEmpty();
      seedInitialCategoriesIfEmpty();
      const unsubInquiries = subscribeInquiries((items) => {
        setInquiries(items);
      });
      const unsubDiscounts = subscribeDiscounts((items) => {
        setDiscounts(items);
      });
      return () => {
        unsubInquiries();
        unsubDiscounts();
      };
    }
  }, [isAdmin]);

  const handleNavigateTab = (tab: AdminTab, contextId?: string) => {
    if (tab === 'edit-product' && contextId) {
      setSelectedProductId(contextId);
    } else if (tab === 'create-product') {
      setSelectedProductId(null);
    } else if (tab === 'view-inquiry' && contextId) {
      setSelectedInquiryId(contextId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#6B8E7B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#66726A] font-light">Laddar behörighet...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not admin
  if (!user || !isAdmin) {
    return <AdminLogin onBackToShop={onGoToShop} />;
  }

  // Product currently being edited
  const editingProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId) || null
    : null;

  // Inquiry currently being viewed
  const viewingInquiry = selectedInquiryId
    ? inquiries.find((i) => i.id === selectedInquiryId) || null
    : null;

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={handleNavigateTab}
      onGoToShop={onGoToShop}
      inquiries={inquiries}
    >
      {/* 1. Dashboard */}
      {currentTab === 'dashboard' && (
        <AdminDashboard
          products={products}
          categories={categories}
          inquiries={inquiries}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* 2. Products List */}
      {currentTab === 'products' && (
        <>

      {products && products.some(p => 
        (Array.isArray(p.images) && p.images.some(i => typeof i === 'string' && i.startsWith('data:image'))) || 
        (typeof p.image === 'string' && p.image.startsWith('data:image'))
      ) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Bilder behöver uppdateras</h3>
            <p className="text-xs text-yellow-700 mt-1 mb-2">
              Följande produkter använder gamla inbäddade bilder (Base64) som kan göra att databasen blir full. Vänligen redigera dessa produkter, ta bort bilden och ladda upp den på nytt:
            </p>
            <ul className="list-disc pl-5 text-xs text-yellow-700 space-y-1">
              {products.filter(p => 
                (Array.isArray(p.images) && p.images.some(i => typeof i === 'string' && i.startsWith('data:image'))) || 
                (typeof p.image === 'string' && p.image.startsWith('data:image'))
              ).map(p => (
                <li key={p.id}><strong>{p.name}</strong></li>
              ))}
            </ul>
          </div>
        </div>
      )}

        <AdminProductsList
          products={products}
          categories={categories}
          onNavigateTab={handleNavigateTab}
          onEditProduct={editProduct}
          onDeleteProduct={removeProduct}
          onDuplicateProduct={copyProduct}
        />
        </>
      )}

      {/* 3. Create Product */}
      {currentTab === 'create-product' && (
        <AdminProductEditor
          initialProduct={null}
          categories={categories}
          onSave={async (productData) => {
            const newId = await addProduct(productData as any);
            handleNavigateTab('products');
          }}
          onCancel={() => handleNavigateTab('products')}
        />
      )}

      {/* 4. Edit Product */}
      {currentTab === 'edit-product' && (
        <AdminProductEditor
          initialProduct={editingProduct}
          categories={categories}
          onSave={async (productData) => {
            if (selectedProductId) {
              await editProduct(selectedProductId, productData);
            }
            handleNavigateTab('products');
          }}
          onCancel={() => handleNavigateTab('products')}
        />
      )}

      {/* 5. Categories */}
      {currentTab === 'categories' && (
        <AdminCategories
          categories={categories}
          products={products}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={removeCategory}
        />
      )}

      {/* 6. Discounts */}
      {currentTab === 'discounts' && (
        <AdminDiscounts
          discounts={discounts}
          products={products}
          categories={categories}
        />
      )}

      {/* 7. Inquiries List */}
      {currentTab === 'inquiries' && (
        <AdminInquiriesList
          inquiries={inquiries}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* 7. View Inquiry Detail */}
      {currentTab === 'view-inquiry' && viewingInquiry && (
        <AdminInquiryDetail
          inquiry={viewingInquiry}
          onBack={() => handleNavigateTab('inquiries')}
          onStatusUpdated={() => {}}
        />
      )}

      {/* 8. Settings */}
      {currentTab === 'settings' && (
        <AdminSettings
          settings={settings}
          products={products}
          onSaveSettings={saveSettings}
        />
      )}
    </AdminLayout>
  );
};
