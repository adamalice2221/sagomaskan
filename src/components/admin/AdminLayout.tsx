import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Inbox,
  Tag,
  Settings,
  LogOut,
  ExternalLink,
  Store,
  Sparkles,
  ChevronRight,
  AlertCircle,
  RotateCcw
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
  const newInquiriesCount = inquiries.filter((i) => i.status === 'Ny').length;
  const newClaimsCount = claims.filter((c) => c.status === 'Ny').length;
  const newWithdrawalsCount = withdrawals.filter((w) => w.status === 'Ny').length;

  const navItems: { tab: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { tab: 'dashboard', label: 'Översikt', icon: LayoutDashboard },
    { tab: 'products', label: 'Produkter', icon: Package },
    { tab: 'categories', label: 'Kategorier', icon: Layers },
    { tab: 'discounts', label: 'Rabatter', icon: Tag },
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
    },
    { tab: 'settings', label: 'Inställningar', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#242D27] flex flex-col">
      
      {/* Top Bar */}
      <header className="bg-[#FBF9F5] border-b border-[#E6DFD3] sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <span className="font-serif text-xl font-bold tracking-tight text-[#242D27]">
              Sagomaskan
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]">
              Admin
            </span>
          </button>

          {/* Webbplatsstatus indikator */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            title="Klicka för att hantera webbplatsstatus i inställningar"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
              maintenanceMode
                ? 'bg-[#FDF3F2] text-[#8C5248] border-[#E8C5C0] hover:bg-[#FBE8E6]'
                : 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4] hover:bg-[#E0EFE5]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-[#8C5248] animate-pulse' : 'bg-[#526E5F]'}`} />
            <span className="font-semibold">{maintenanceMode ? '🔴 Underhåll' : '🟢 Öppen'}</span>
          </button>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={onGoToShop}
            className="inline-flex items-center gap-1.5 text-xs text-[#66726A] hover:text-[#242D27] font-medium transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visa butiken</span>
          </button>

          <div className="h-4 w-px bg-[#E6DFD3] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#66726A] font-light hidden md:inline">
              {user?.email}
            </span>
            <button
              onClick={logout}
              title="Logga ut"
              className="p-1.5 rounded-xl bg-[#F3EFE8] hover:bg-[#E6DFD3] text-[#66726A] hover:text-[#8C5248] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Subnav / Tabs bar */}
      <div className="bg-[#FBF9F5]/80 backdrop-blur-xs border-b border-[#E6DFD3] px-4 sm:px-8 py-2 sticky top-[57px] z-30 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected =
              currentTab === item.tab ||
              (item.tab === 'products' && (currentTab === 'create-product' || currentTab === 'edit-product')) ||
              (item.tab === 'inquiries' && currentTab === 'view-inquiry');

            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#242D27] text-[#FAF8F5] shadow-xs'
                    : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-[#FAF8F5] text-[#242D27]'
                        : 'bg-[#526E5F] text-[#FAF8F5]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>

    </div>
  );
};
