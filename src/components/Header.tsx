import React, { useState } from 'react';
import { ShoppingBag, Search, Heart, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { PageRoute, ProductCategory, Category } from '../types';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface HeaderProps {
  currentPage: PageRoute;
  categories?: Category[];
  onNavigate: (page: PageRoute, productId?: string, category?: ProductCategory) => void;
  onOpenSearch: () => void;
  onSelectCategory?: (category: ProductCategory) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
}) => {
  const { user, isAdmin } = useAuth();
  const { cartCount, wishlist, setIsCartOpen } = useCart();
  const { settings, settingsLoaded } = useData();

  const isAnnouncementEnabled = settings?.announcementEnabled !== false;
  const announcementText = settings?.announcementText !== undefined
    ? settings.announcementText
    : 'Handgjorda virkade produkter på beställning • Skicka en kostnadsfri beställningsförfrågan';
  const showAnnouncement = settingsLoaded && isAnnouncementEnabled && Boolean(announcementText.trim());

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { label: string; page: PageRoute }[] = [
    { label: 'Hem', page: 'home' },
    { label: 'Shop', page: 'shop' },
    { label: 'Om mig', page: 'about' },
    { label: 'Kontakt', page: 'contact' }
  ];

  const handleNavClick = (page: PageRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top announcement bar */}
      {showAnnouncement && (
        <div id="announcement-bar" className="bg-[#242D27] text-[#FAF8F5] text-xs py-2 px-4 text-center tracking-wider font-light flex items-center justify-center gap-2">
          <span>{announcementText}</span>
        </div>
      )}

      {/* Main sticky navigation header */}
      <header
        id="main-header"
        className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6DFD3] transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Mobile hamburger menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-[#242D27] hover:bg-[#F3EFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer"
              aria-label="Öppna navigationsmeny"
            >
              <Menu className="w-6 h-6 stroke-[1.75]" />
            </button>
            <button
              id="mobile-search-btn"
              type="button"
              onClick={onOpenSearch}
              className="p-2 rounded-lg text-[#242D27] hover:bg-[#F3EFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer"
              aria-label="Sök produkter"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>

          {/* Brand Logo (Text/CSS based minimalist logo) */}
          <a
            id="brand-logo"
            href={getPageUrl('home')}
            onClick={(e) => {
              if (!isModifiedClick(e)) {
                e.preventDefault();
                handleNavClick('home');
              }
            }}
            className="group flex flex-col items-center lg:items-start text-left focus:outline-none cursor-pointer"
          >
            {settings?.logoImageUrl ? (
              <img src={settings.logoImageUrl} alt="Sagomaskan Logo" className="h-10 sm:h-12 object-contain" />
            ) : (
              <span className="font-serif text-2xl sm:text-3xl font-medium tracking-[0.2em] text-[#242D27] uppercase transition-colors group-hover:text-[#6B8E7B]">
                SAGOMASKAN
              </span>
            )}
            <span className="text-[10px] tracking-[0.28em] text-[#66726A] font-medium uppercase -mt-0.5">
              {settings?.logoTagline ?? 'VIRKADE PRODUKTER'}
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav" className="hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => {
              const isActive = currentPage === link.page;
              return (
                <a
                  key={link.page}
                  id={`nav-link-${link.page}`}
                  href={getPageUrl(link.page)}
                  onClick={(e) => {
                    if (!isModifiedClick(e)) {
                      e.preventDefault();
                      handleNavClick(link.page);
                    }
                  }}
                  className={`text-sm tracking-wide transition-colors relative py-1 focus:outline-none cursor-pointer ${
                    isActive
                      ? 'text-[#242D27] font-medium'
                      : 'text-[#66726A] hover:text-[#242D27]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#6B8E7B] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search Button */}
            <button
              id="desktop-search-btn"
              type="button"
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-[#66726A] bg-[#F3EFE8] hover:bg-[#E6DFD3] hover:text-[#242D27] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer"
              aria-label="Sök i shoppen"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
              <span className="pr-1">Sök produkter...</span>
            </button>

            {/* Wishlist Button */}
            <a
              id="wishlist-btn"
              href={getPageUrl('wishlist')}
              onClick={(e) => {
                if (!isModifiedClick(e)) {
                  e.preventDefault();
                  handleNavClick('wishlist');
                }
              }}
              className="relative p-2 rounded-full text-[#242D27] hover:bg-[#F3EFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] cursor-pointer"
              aria-label="Visa favoriter"
            >
              <Heart
                className={`w-5 h-5 stroke-[1.75] ${
                  wishlist.length > 0 ? 'fill-[#6B8E7B] text-[#6B8E7B]' : ''
                }`}
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#6B8E7B] text-[#FAF8F5] text-[10px] font-semibold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </a>

            {/* Request List Button (Drawer action) */}
            <button
              id="cart-btn"
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full text-[#242D27] hover:bg-[#F3EFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] flex items-center gap-1.5 cursor-pointer"
              aria-label="Öppna förfrågelista"
              title="Förfrågelista"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              <span className="hidden sm:inline text-xs font-medium text-[#242D27]">
                Förfrågelista
              </span>
              {cartCount > 0 && (
                <span
                  id="cart-badge-count"
                  className="min-w-5 h-5 px-1 rounded-full bg-[#242D27] text-[#FAF8F5] text-[11px] font-semibold flex items-center justify-center animate-pulse"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Icon (Only visible when logged in as admin) */}
            {user && isAdmin && (
              <a
                id="admin-header-btn"
                href={getPageUrl('admin')}
                onClick={(e) => {
                  if (!isModifiedClick(e)) {
                    e.preventDefault();
                    handleNavClick('admin');
                  }
                }}
                className="relative p-2 rounded-full text-[#242D27] hover:bg-[#F3EFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] flex items-center gap-1.5 cursor-pointer"
                aria-label="Adminpanel"
                title="Adminpanel"
              >
                <LayoutDashboard className="w-5 h-5 stroke-[1.75]" />
                <span className="hidden sm:inline text-xs font-medium text-[#242D27]">
                  Admin
                </span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#FAF8F5] shadow-xl p-6 flex flex-col justify-between border-r border-[#E6DFD3] z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#E6DFD3]">
                <div className="text-left">
                  {settings?.logoImageUrl ? (
                    <img src={settings.logoImageUrl} alt="Sagomaskan Logo" className="h-8 object-contain mb-1" />
                  ) : (
                    <span className="font-serif text-xl font-medium tracking-[0.18em] text-[#242D27] uppercase block">
                      SAGOMASKAN
                    </span>
                  )}
                  <p className="text-[9px] tracking-[0.22em] text-[#66726A] uppercase">
                    {settings?.logoTagline ?? 'VIRKADE PRODUKTER'}
                  </p>
                </div>
                <button
                  id="close-mobile-menu-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-[#242D27] hover:bg-[#F3EFE8] cursor-pointer"
                  aria-label="Stäng meny"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="mt-8 flex flex-col space-y-3">
                {navLinks.map((link) => {
                  const isActive = currentPage === link.page;
                  return (
                    <a
                      key={link.page}
                      id={`mobile-nav-${link.page}`}
                      href={getPageUrl(link.page)}
                      onClick={(e) => {
                        if (!isModifiedClick(e)) {
                          e.preventDefault();
                          handleNavClick(link.page);
                        }
                      }}
                      className={`text-left text-lg py-2 px-3 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-[#F3EFE8] text-[#242D27] font-medium'
                          : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-4 h-4 opacity-40" />
                    </a>
                  );
                })}

                <div className="pt-4 border-t border-[#E6DFD3] space-y-2">
                  <a
                    href={getPageUrl('faq')}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        handleNavClick('faq');
                      }
                    }}
                    className="w-full block text-left text-sm text-[#66726A] py-1.5 px-3 hover:text-[#242D27] cursor-pointer"
                  >
                    Vanliga frågor (FAQ)
                  </a>
                  <a
                    href={getPageUrl('shipping')}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        handleNavClick('shipping');
                      }
                    }}
                    className="w-full block text-left text-sm text-[#66726A] py-1.5 px-3 hover:text-[#242D27] cursor-pointer"
                  >
                    Frakt & leverans
                  </a>
                  <a
                    href={getPageUrl('terms')}
                    onClick={(e) => {
                      if (!isModifiedClick(e)) {
                        e.preventDefault();
                        handleNavClick('terms');
                      }
                    }}
                    className="w-full block text-left text-sm text-[#66726A] py-1.5 px-3 hover:text-[#242D27] cursor-pointer"
                  >
                    Information om köp
                  </a>
                  {user && isAdmin && (
                    <a
                      id="mobile-admin-link"
                      href={getPageUrl('admin')}
                      onClick={(e) => {
                        if (!isModifiedClick(e)) {
                          e.preventDefault();
                          handleNavClick('admin');
                        }
                      }}
                      className="w-full text-left text-sm font-medium text-[#242D27] py-2 px-3 hover:bg-[#F3EFE8] rounded-md transition-colors flex items-center justify-between cursor-pointer"
                      aria-label="Adminpanel"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-[#6B8E7B]" />
                        Adminpanel
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-40" />
                    </a>
                  )}
                </div>
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-[#E6DFD3] text-xs text-[#66726A] space-y-2">
              <p className="font-serif italic text-sm text-[#242D27]">
                Små maskor – stora leenden. ♡
              </p>
              <p>Stockholm, Sverige</p>
              <p>hello@sagomaskan.se</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
