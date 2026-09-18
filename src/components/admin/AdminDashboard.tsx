import React from 'react';
import {
  Inbox,
  Package,
  Layers,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Product, Category, Inquiry, Claim, Withdrawal, AdminTab } from '../../types';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  inquiries: Inquiry[];
  claims?: Claim[];
  withdrawals?: Withdrawal[];
  onNavigateTab: (tab: AdminTab, contextId?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  inquiries,
  claims = [],
  withdrawals = [],
  onNavigateTab
}) => {
  const newInquiries = inquiries.filter((i) => i.status === 'Ny');
  const ongoingInquiries = inquiries.filter((i) =>
    ['Kontaktad', 'Bekräftad', 'Under arbete'].includes(i.status)
  );
  const newClaims = claims.filter((c) => c.status === 'Ny');
  const newWithdrawals = withdrawals.filter((w) => w.status === 'Ny');
  const unpublishedProducts = products.filter((p) => !p.published);
  const recentInquiries = inquiries.slice(0, 5);
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DFD3]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Översikt
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium mt-1">
            Sagomaskan Admin
          </h1>
          <p className="text-sm text-[#66726A] font-light mt-1">
            Välkommen till ateljéns kontrollpanel för produkter, sagor och kundförfrågningar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dashboard-create-prod-btn"
            onClick={() => onNavigateTab('create-product')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Skapa produkt</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Nya förfrågningar */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#66726A]">Nya förfrågningar</span>
            <div className="w-8 h-8 rounded-full bg-[#EBF3EE] text-[#526E5F] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-medium text-[#242D27]">
            {newInquiries.length}
          </div>
          <div className="text-[11px] text-[#6B8E7B] mt-1 font-medium group-hover:underline inline-flex items-center gap-1">
            <span>Se nya</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Pågående förfrågningar */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#66726A]">Pågående</span>
            <div className="w-8 h-8 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-medium text-[#242D27]">
            {ongoingInquiries.length}
          </div>
          <div className="text-[11px] text-[#66726A] mt-1 group-hover:text-[#242D27] inline-flex items-center gap-1">
            <span>Hantera</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Produkter */}
        <div
          onClick={() => onNavigateTab('products')}
          className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#66726A]">Produkter</span>
            <div className="w-8 h-8 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-medium text-[#242D27]">
            {products.length}
          </div>
          <div className="text-[11px] text-[#66726A] mt-1">
            {unpublishedProducts.length > 0 ? (
              <span className="text-[#8C5248] font-medium">{unpublishedProducts.length} opublicerad(e)</span>
            ) : (
              <span>Alla publicerade</span>
            )}
          </div>
        </div>

        {/* Kategorier */}
        <div
          onClick={() => onNavigateTab('categories')}
          className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#66726A]">Kategorier</span>
            <div className="w-8 h-8 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-serif font-medium text-[#242D27]">
            {categories.length}
          </div>
          <div className="text-[11px] text-[#66726A] mt-1 group-hover:text-[#242D27] inline-flex items-center gap-1">
            <span>Hantera</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Customer Service & Post-Purchase Cases */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTab('claims')}
          className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F1] text-[#526E5F] flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#66726A] font-medium">Reklamationer</div>
              <div className="text-xl font-serif font-medium text-[#242D27] flex items-center gap-2">
                <span>{claims.length}</span>
                {newClaims.length > 0 && (
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#526E5F] font-semibold">
                    {newClaims.length} nya
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-[#6B8E7B] group-hover:underline flex items-center gap-1 font-medium">
            <span>Hantera reklamationer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('withdrawals')}
          className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4F1] text-[#526E5F] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#66726A] font-medium">Ångerärenden</div>
              <div className="text-xl font-serif font-medium text-[#242D27] flex items-center gap-2">
                <span>{withdrawals.length}</span>
                {newWithdrawals.length > 0 && (
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#526E5F] font-semibold">
                    {newWithdrawals.length} nya
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-[#6B8E7B] group-hover:underline flex items-center gap-1 font-medium">
            <span>Hantera ångeranmälningar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main 2-column layout for Recent Inquiries & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Senaste Förfrågningar */}
        <div className="lg:col-span-7 bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              Senaste förfrågningar
            </h2>
            <button
              onClick={() => onNavigateTab('inquiries')}
              className="text-xs font-medium text-[#526E5F] hover:text-[#242D27] inline-flex items-center gap-1"
            >
              <span>Visa alla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#66726A] font-light">
              Inga förfrågningar har inkommit ännu.
            </div>
          ) : (
            <div className="divide-y divide-[#E6DFD3]">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => onNavigateTab('view-inquiry', inquiry.id)}
                  className="py-3.5 flex items-center justify-between hover:bg-[#F3EFE8]/50 px-3 -mx-3 rounded-xl transition-all cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#242D27]">
                        {inquiry.inquiryNumber}
                      </span>
                      <span className="text-xs text-[#242D27]">
                        {inquiry.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#66726A] font-light">
                      {inquiry.items.length} produkt(er) &bull; {inquiry.estimatedTotal} kr
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                        inquiry.status === 'Ny'
                          ? 'bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]'
                          : inquiry.status === 'Klar'
                          ? 'bg-[#E6DFD3] text-[#242D27]'
                          : 'bg-[#F3EFE8] text-[#66726A]'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#8C9B90]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Nyligen skapade & Opublicerade produkter */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Opublicerade produkter varning if any */}
          {unpublishedProducts.length > 0 && (
            <div className="bg-[#FAF4ED] border border-[#E6D7C3] rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#7A5930] font-medium text-xs">
                <EyeOff className="w-4 h-4" />
                <span>{unpublishedProducts.length} opublicerad(e) produkt(er)</span>
              </div>
              <p className="text-[11px] text-[#7A5930]/90 leading-relaxed font-light">
                Dessa syns inte för kunderna i butiken förrän du väljer att publicera dem.
              </p>
              <div className="space-y-1.5 pt-1">
                {unpublishedProducts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigateTab('edit-product', p.id)}
                    className="text-xs text-[#242D27] hover:underline cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate max-w-[200px]">{p.name}</span>
                    <span className="text-[10px] text-[#7A5930]">Redigera &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nyligen skapade produkter */}
          <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
              <h2 className="font-serif text-xl text-[#242D27] font-medium">
                Nyligen skapade
              </h2>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs font-medium text-[#526E5F] hover:text-[#242D27]"
              >
                Alla
              </button>
            </div>

            <div className="space-y-3">
              {recentProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigateTab('edit-product', p.id)}
                  className="flex items-center gap-3 p-2 hover:bg-[#F3EFE8]/60 rounded-xl transition-all cursor-pointer"
                >
                  <img
                    src={p.images?.[0] || p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-[#F3EFE8] border border-[#E6DFD3]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[#242D27] truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-[#66726A]">
                      {p.category} &bull; {p.price} kr
                    </div>
                  </div>
                  {p.featured && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#526E5F] font-semibold">
                      Utvald
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
