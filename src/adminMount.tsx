import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './adminDashboard.css';
import { AdminDashboardOverview, StoreKpis } from './components/AdminDashboardOverview';

function readDomStoreKpis(): StoreKpis {
  const readNum = (id: string) => {
    const el = document.getElementById(id);
    const parsed = Number.parseInt(el?.textContent || '0', 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const emailEl = document.getElementById('adminCurrentEmailDisplay');
  const activeTabBtn = document.querySelector('.admin-tab-btn.is-active');
  const activeTab = activeTabBtn?.getAttribute('data-admin-tab') || 'all';

  return {
    products: readNum('adminKpiProductsCount'),
    orders: readNum('adminKpiOrdersCount'),
    unreadMessages: readNum('adminKpiUnreadMessagesCount'),
    discounts: readNum('adminKpiDiscountsCount'),
    adminEmail: emailEl?.textContent?.trim() || 'sagomaskan@outlook.com',
    activeTab,
  };
}

const AdminDashboardBridge: React.FC = () => {
  const [storeKpis, setStoreKpis] = useState<StoreKpis>(() => readDomStoreKpis());
  const [bannerText, setBannerText] = useState<string>(() => {
    return document.querySelector('.top-banner-text')?.textContent?.trim() || '';
  });

  useEffect(() => {
    const syncState = () => {
      setStoreKpis(readDomStoreKpis());
      const bannerEl = document.querySelector('.top-banner-text');
      if (bannerEl) {
        setBannerText(bannerEl.textContent?.trim() || '');
      }
    };

    syncState();

    const observer = new MutationObserver(() => {
      syncState();
    });

    const targetIds = [
      'adminKpiProductsCount',
      'adminKpiOrdersCount',
      'adminKpiUnreadMessagesCount',
      'adminKpiDiscountsCount',
      'adminCurrentEmailDisplay',
    ];
    targetIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      }
    });

    const tabList = document.querySelector('#adminView [role="tablist"]');
    if (tabList) {
      observer.observe(tabList, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class'],
      });
    }

    const bannerEl = document.querySelector('.top-banner-text');
    if (bannerEl) {
      observer.observe(bannerEl, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    const onCustomSync = () => syncState();
    window.addEventListener('sagomaskan-admin-sync', onCustomSync);

    return () => {
      observer.disconnect();
      window.removeEventListener('sagomaskan-admin-sync', onCustomSync);
    };
  }, []);

  const handleSelectAdminTab = (tab: string) => {
    const targetBtn = document.querySelector(
      `.admin-tab-btn[data-admin-tab="${tab}"]`
    ) as HTMLButtonElement | null;
    if (targetBtn) {
      targetBtn.click();
      setStoreKpis(readDomStoreKpis());
    }
  };

  const handleSignOut = () => {
    const btn = document.getElementById('adminSignOutBtn') as HTMLButtonElement | null;
    btn?.click();
  };

  const handleTogglePinForm = () => {
    const btn = document.getElementById('adminToggleChangePinBtn') as HTMLButtonElement | null;
    btn?.click();
    const form = document.getElementById('adminChangePinForm');
    if (form && !form.hidden) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleLockAdmin = () => {
    const btn = document.getElementById('adminLockBtn') as HTMLButtonElement | null;
    btn?.click();
  };

  const handleBroadcastAnnouncement = (text: string, bgColor?: string) => {
    const win = window as any;
    if (typeof win.sagomaskanUpdateSystemAnnouncement === 'function') {
      win.sagomaskanUpdateSystemAnnouncement(text, bgColor);
    }
    setBannerText(text);
  };

  const handleNotify = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const win = window as any;
    if (typeof win.showToast === 'function') {
      win.showToast(message, type);
    }
  };

  return (
    <AdminDashboardOverview
      storeKpis={storeKpis}
      onSelectAdminTab={handleSelectAdminTab}
      onSignOut={handleSignOut}
      onTogglePinForm={handleTogglePinForm}
      onLockAdmin={handleLockAdmin}
      onBroadcastAnnouncement={handleBroadcastAnnouncement}
      currentBannerText={bannerText}
      onNotify={handleNotify}
    />
  );
};

function mountAdminDashboard() {
  const container = document.getElementById('adminDashboardReactRoot');
  if (!container) return;
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AdminDashboardBridge />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAdminDashboard);
} else {
  mountAdminDashboard();
}
