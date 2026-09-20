import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { CartProvider } from './context/CartContext';
import { DiscountProvider } from './context/DiscountContext';
import { PageRoute, ProductCategory, OrderInquiry } from './types';
import { getPageUrl, parseLocation } from './utils/navigation';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { Toast } from './components/Toast';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { ShippingPage } from './pages/ShippingPage';
import { TermsPage } from './pages/TermsPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminPage } from './pages/AdminPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ClaimPage } from './pages/ClaimPage';
import { WithdrawalPage } from './pages/WithdrawalPage';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { products, categories, settings, loading: dataLoading } = useData();
  const { isAdmin } = useAuth();

  // Initialize state from current URL
  const initialLoc = parseLocation(
    window.location.pathname,
    window.location.search,
    window.location.hash
  );

  const [currentPage, setCurrentPage] = useState<PageRoute>(initialLoc.page);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialLoc.productId || '');
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(initialLoc.category || 'Alla');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderInquiry | null>(null);

  // Sync state on browser back/forward (popstate) and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const loc = parseLocation(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
      setCurrentPage(loc.page);
      if (loc.productId) {
        setSelectedProductId(loc.productId);
      }
      if (loc.category) {
        setActiveCategory(loc.category);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Set default selectedProductId when products load if not explicitly set
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Navigate helper that updates URL, browser history, and scrolls to top smoothly
  const handleNavigate = useCallback((
    page: PageRoute,
    productId?: string,
    category?: ProductCategory,
    options?: { replace?: boolean }
  ) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    if (category) {
      setActiveCategory(category);
    }

    const targetUrl = getPageUrl(page, {
      productId: productId || (page === 'product' ? selectedProductId : undefined),
      category: category || (page === 'shop' ? activeCategory : undefined),
    });

    const currentFullUrl = window.location.pathname + window.location.search + window.location.hash;
    if (currentFullUrl !== targetUrl) {
      if (options?.replace) {
        window.history.replaceState(null, '', targetUrl);
      } else {
        window.history.pushState(null, '', targetUrl);
      }
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedProductId, activeCategory]);

  const handleCategoryFilter = useCallback((cat: ProductCategory) => {
    setActiveCategory(cat);
    handleNavigate('shop', undefined, cat);
  }, [handleNavigate]);

  const selectedProduct =
    (selectedProductId ? products.find((p) => p.id === selectedProductId) : null) ||
    products[0];

  // If on admin route, render isolated Admin view
  if (currentPage === 'admin') {
    return <AdminPage onGoToShop={() => handleNavigate('home')} />;
  }

  // If maintenance mode is active and current user is not an admin, show MaintenancePage
  if (settings.maintenanceMode && !isAdmin) {
    return <MaintenancePage onAdminLogin={() => handleNavigate('admin')} />;
  }

  // Render appropriate active page view
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            products={products}
            categories={categories}
            onNavigate={handleNavigate}
            onFilterCategory={handleCategoryFilter}
          />
        );
      case 'shop':
        return (
          <ShopPage
            products={products}
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectProduct={(id) => handleNavigate('product', id)}
          />
        );
      case 'product':
        return selectedProduct ? (
          <ProductDetailPage
            key={selectedProduct.id}
            product={selectedProduct}
            allProducts={products}
            onNavigate={handleNavigate}
          />
        ) : (
          <ShopPage
            products={products}
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectProduct={(id) => handleNavigate('product', id)}
          />
        );
      case 'cart':
        return <CartPage onNavigate={handleNavigate} />;
      case 'checkout':
        return (
          <CheckoutPage
            onNavigate={handleNavigate}
            onOrderPlaced={(order) => setLastOrder(order)}
          />
        );
      case 'order-confirmation':
        return (
          <OrderConfirmationPage
            order={lastOrder}
            onNavigate={handleNavigate}
          />
        );
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage />;
      case 'faq':
        return <FaqPage onNavigate={handleNavigate} />;
      case 'shipping':
        return <ShippingPage onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsPage onNavigate={handleNavigate} />;
      case 'wishlist':
        return <WishlistPage products={products} onNavigate={handleNavigate} />;
      case 'reklamation':
        return (
          <ClaimPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShop={() => handleNavigate('shop')}
          />
        );
      case 'angra-kop':
        return (
          <WithdrawalPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShop={() => handleNavigate('shop')}
          />
        );
      default:
        return (
          <HomePage
            products={products}
            onNavigate={handleNavigate}
            onFilterCategory={handleCategoryFilter}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#242D27] font-sans antialiased selection:bg-[#6B8E7B]/20 selection:text-[#242D27]">
      {/* Admin Maintenance Preview Banner */}
      {settings.maintenanceMode && isAdmin && (
        <div className="bg-[#8C5248] text-white text-xs px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-semibold">🔴 Underhållsläge aktivt:</span>
            <span>Webbplatsen är stängd för kunder. Du ser butiken eftersom du är inloggad som administratör.</span>
          </div>
          <button
            onClick={() => handleNavigate('admin')}
            className="underline font-medium hover:text-white/80 cursor-pointer ml-4 whitespace-nowrap"
          >
            Gå till Adminpanelen →
          </button>
        </div>
      )}

      {/* Persistent Sticky Header */}
      <Header
        currentPage={currentPage}
        categories={categories}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectCategory={setActiveCategory}
      />

      {/* Main Routed Page Content */}
      <main className="flex-grow">
        {renderCurrentPage()}
      </main>

      {/* Global Slide-over Cart Drawer */}
      <CartDrawer onNavigate={handleNavigate} />

      {/* Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        categories={categories}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(id) => handleNavigate('product', id)}
        onSearchCategory={(cat) => {
          setActiveCategory(cat);
          handleNavigate('shop');
        }}
        products={products}
      />

      {/* Discreet Toast Notification */}
      <Toast />

      {/* Minimalist Footer with discreet Admin link */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <CartProvider>
          <DiscountProvider>
            <AppContent />
          </DiscountProvider>
        </CartProvider>
      </DataProvider>
    </AuthProvider>
  );
}
