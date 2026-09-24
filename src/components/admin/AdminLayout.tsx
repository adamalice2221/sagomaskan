import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Inbox,
  Tag,
  Settings,
  LogOut,
  Store,
  AlertCircle,
  RotateCcw,
  Menu,
  X,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AdminTab, Inquiry, Claim, Withdrawal } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onGoToShop: () => void;
  inquiries: Inquiry[];
  claims?: Claim[];
  withdrawals?: Withdrawal[];
  maintenanceMode?: boolean;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onGoToShop,
  inquiries,
  claims = [],
  withdrawals = [],
  maintenanceMode = false,
  children
}) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const newInquiriesCount = inquiries.filter((i) => i.status === 'Ny').length;
  const newClaimsCount = claims.filter((c) => c.status === 'Ny').length;
  const newWithdrawalsCount = withdrawals.filter((w) => w.status === 'Ny').length;

  const navGroups: {
    group: string;
    items: { tab: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[];
  }[] = [
    {
      group: 'ÖVERSIKT',
      items: [
        { tab: 'dashboard', label: 'Översikt', icon: LayoutDashboard }
      ]
    },
    {
      group: 'BUTIK',
      items: [
        { tab: 'products', label: 'Produkter', icon: Package },
        { tab: 'categories', label: 'Kategorier', icon: Layers },
        { tab: 'discounts', label: 'Rabatter', icon: Tag }
      ]
    },
    {
      group: 'KUNDÄRENDEN',
      items: [
        {
          tab: 'inquiries',
          label: 'Förfrågningar',
          icon: Inbox,
          badge: newInquiriesCount > 0 ? newInquiriesCount : undefined
        },
        {
          tab: 'claims',
          label: 'Reklamationer',
          icon: AlertCircle,
          badge: newClaimsCount > 0 ? newClaimsCount : undefined
        },
        {
          tab: 'withdrawals',
          label: 'Ångerärenden',
          icon: RotateCcw,
          badge: newWithdrawalsCount > 0 ? newWithdrawalsCount : undefined
        }
      ]
    },
    {
      group: 'INNEHÅLL',
      items: [
        { tab: 'settings', label: 'Inställningar', icon: Settings }
      ]
    }
  ];

  // Helper to determine active tab states
  const isTabActive = (tab: AdminTab) => {
    if (currentTab === tab) return true;
    if (tab === 'products' && (currentTab === 'create-product' || currentTab === 'edit-product')) return true;
    if (tab === 'inquiries' && currentTab === 'view-inquiry') return true;
    return false;
  };

  // Helper to get printable Page Title for Topbar
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Översikt';
      case 'products':
        return 'Produkter';
      case 'create-product':
        return 'Skapa produkt';
      case 'edit-product':
        return 'Redigera produkt';
      case 'categories':
        return 'Kategorier';
      case 'discounts':
        return 'Rabattkoder';
      case 'inquiries':
        return 'Beställningsförfrågningar';
      case 'view-inquiry':
        return 'Detaljer för förfrågan';
      case 'claims':
        return 'Reklamationer';
      case 'withdrawals':
        return 'Ångerärenden';
      case 'settings':
        return 'Inställningar';
      default:
        return 'Admin';
    }
  };

  const renderSidebarContent = (onLinkClick?: () => void) => (
    <div className="flex-1 flex flex-col justify-between h-full bg-[#FAF8F5]">
      {/* Top Section */}
      <div className="space-y-6 py-6 px-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-lg font-bold tracking-tight text-[#242D27]">
              SAGOMASKAN
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#EFF4F1] text-[#526E5F] border border-[#6B8E7B]/20">
              Admin
            </span>
          </div>
          {onLinkClick && (
            <button
              onClick={onLinkClick}
              className="lg:hidden p-1.5 rounded-lg text-[#66726A] hover:bg-[#F3EFE8]"
              aria-label="Stäng meny"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-5 pt-2">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest text-[#6B8E7B] block px-3">
                {group.group}
              </span>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isTabActive(item.tab);
                  return (
                    <li key={item.tab}>
                      <button
                        onClick={() => {
                          onSelectTab(item.tab);
                          if (onLinkClick) onLinkClick();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
                          isActive
                            ? 'bg-[#242D27] text-[#FAF8F5] shadow-xs'
                            : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#FAF8F5]' : 'text-[#6B8E7B]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-[#FAF8F5] text-[#242D27]' : 'bg-[#526E5F] text-[#FAF8F5]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#E6DFD3] bg-[#F7F4F0] space-y-3.5">
        <button
          onClick={() => {
            onGoToShop();
            if (onLinkClick) onLinkClick();
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#E6DFD3] bg-[#FAF8F5] text-xs font-semibold text-[#242D27] hover:bg-[#F3EFE8] hover:border-[#6B8E7B]/40 transition-all"
        >
          <Store className="w-3.5 h-3.5 text-[#6B8E7B]" />
          <span>Visa butik</span>
          <ExternalLink className="w-3 h-3 text-[#66726A] ml-0.5" />
        </button>

        <div className="flex items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#EBF3EE] text-[#526E5F] border border-[#6B8E7B]/10 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#242D27] truncate">
                Admin
              </p>
              <p className="text-[9px] text-[#66726A] truncate font-light">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logga ut"
            className="p-1.5 rounded-lg text-[#66726A] hover:text-[#8C5248] hover:bg-[#FAF4F3] transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#242D27] flex flex-row">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#FAF8F5] border-r border-[#E6DFD3] shrink-0 sticky top-0 h-screen z-20">
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#242D27]/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          />
          {/* Drawer Content */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#FAF8F5] border-r border-[#E6DFD3] z-50 lg:hidden flex flex-col justify-between shadow-2xl transition-transform duration-300 transform translate-x-0">
            {renderSidebarContent(() => setIsMobileMenuOpen(false))}
          </aside>
        </>
      )}

      {/* 3. MAIN SECTION */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* TOPBAR */}
        <header className="bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6DFD3] sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#66726A] hover:bg-[#F3EFE8] rounded-xl transition-colors cursor-pointer"
              aria-label="Öppna meny"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Page indicator */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <span className="text-[#6B8E7B] hover:text-[#242D27] transition-colors font-semibold hidden sm:inline">
                Sagomaskan Admin
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#C8BFB0] hidden sm:inline" />
              <span className="font-serif text-[#242D27] font-semibold text-sm sm:text-base">
                {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Topbar Actions & Status */}
          <div className="flex items-center gap-4">
            {/* Maintenance indicator */}
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              title="Hantera webbplatsstatus i inställningar"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border transition-all cursor-pointer ${
                maintenanceMode
                  ? 'bg-[#FAF4F3] text-[#8C5248] border-[#8C5248]/20 hover:border-[#8C5248]/40'
                  : 'bg-[#EFF4F1] text-[#526E5F] border-[#6B8E7B]/20 hover:border-[#6B8E7B]/40'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${maintenanceMode ? 'bg-[#8C5248] animate-pulse' : 'bg-[#6B8E7B]'}`} />
              <span>{maintenanceMode ? 'Underhållsläge' : 'Butik öppen'}</span>
            </button>
          </div>
        </header>

        {/* ADMIN CONTENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl xl:max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
