import React from 'react';
import {
  Inbox,
  Package,
  Layers,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  EyeOff,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Sparkles
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
  const recentInquiries = inquiries.slice(0, 6);
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      
      {/* 1. HEADER / INTRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DFD3]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            ÖVERSIKT
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-medium mt-1">
            Sagomaskan Admin
          </h1>
          <p className="text-sm text-[#66726A] font-light mt-1">
            Din överblick över shoppen och nya ärenden.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dashboard-create-prod-btn"
            onClick={() => onNavigateTab('create-product')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Skapa produkt</span>
          </button>
        </div>
      </div>

      {/* 2. ATT GÖRA-SEKTION */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#66726A] font-semibold">
            ATT GÖRA
          </h2>
          {(newInquiries.length > 0 || newClaims.length > 0 || newWithdrawals.length > 0) ? (
            <span className="text-[11px] text-[#526E5F] font-medium bg-[#EBF3EE] px-2 py-0.5 rounded-full border border-[#D5E5DC]">
              {newInquiries.length + newClaims.length + newWithdrawals.length} aktiva ärenden
            </span>
          ) : (
            <span className="text-[11px] text-[#66726A] font-light">
              Alla ärenden hanterade
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Förfrågningar att göra */}
          <div
            onClick={() => onNavigateTab('inquiries')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              newInquiries.length > 0
                ? 'bg-[#FAF8F5] border-[#D5E5DC] hover:border-[#6B8E7B] shadow-xs'
                : 'bg-[#FBF9F5] border-[#E6DFD3] hover:border-[#C8BFB0]'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-[#66726A]">Förfrågningar</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  newInquiries.length > 0
                    ? 'bg-[#EBF3EE] text-[#526E5F]'
                    : 'bg-[#F3EFE8] text-[#8C9B90]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-serif font-medium text-[#242D27]">
                {newInquiries.length}
              </div>
              <p className="text-[11px] mt-1 flex items-center gap-1 font-light">
                {newInquiries.length > 0 ? (
                  <span className="text-[#526E5F] font-medium">
                    {newInquiries.length} {newInquiries.length === 1 ? 'ny att hantera' : 'nya att hantera'}
                  </span>
                ) : (
                  <span className="text-[#66726A]">Inget att hantera</span>
                )}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E6DFD3]/60 flex items-center justify-between text-[11px] text-[#526E5F] group-hover:underline">
              <span>Se förfrågningar</span>
              <ChevronRight className="w-3 h-3 text-[#8C9B90] group-hover:text-[#526E5F] transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* Reklamationer att göra */}
          <div
            onClick={() => onNavigateTab('claims')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              newClaims.length > 0
                ? 'bg-[#FAF8F5] border-[#D5E5DC] hover:border-[#6B8E7B] shadow-xs'
                : 'bg-[#FBF9F5] border-[#E6DFD3] hover:border-[#C8BFB0]'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-[#66726A]">Reklamationer</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  newClaims.length > 0
                    ? 'bg-[#EBF3EE] text-[#526E5F]'
                    : 'bg-[#F3EFE8] text-[#8C9B90]'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-serif font-medium text-[#242D27]">
                {newClaims.length}
              </div>
              <p className="text-[11px] mt-1 flex items-center gap-1 font-light">
                {newClaims.length > 0 ? (
                  <span className="text-[#526E5F] font-medium">
                    {newClaims.length} {newClaims.length === 1 ? 'ny att granska' : 'nya att granska'}
                  </span>
                ) : (
                  <span className="text-[#66726A]">Inget att hantera</span>
                )}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E6DFD3]/60 flex items-center justify-between text-[11px] text-[#526E5F] group-hover:underline">
              <span>Se reklamationer</span>
              <ChevronRight className="w-3 h-3 text-[#8C9B90] group-hover:text-[#526E5F] transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* Ångerärenden att göra */}
          <div
            onClick={() => onNavigateTab('withdrawals')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              newWithdrawals.length > 0
                ? 'bg-[#FAF8F5] border-[#D5E5DC] hover:border-[#6B8E7B] shadow-xs'
                : 'bg-[#FBF9F5] border-[#E6DFD3] hover:border-[#C8BFB0]'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-[#66726A]">Ångerärenden</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  newWithdrawals.length > 0
                    ? 'bg-[#EBF3EE] text-[#526E5F]'
                    : 'bg-[#F3EFE8] text-[#8C9B90]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-serif font-medium text-[#242D27]">
                {newWithdrawals.length}
              </div>
              <p className="text-[11px] mt-1 flex items-center gap-1 font-light">
                {newWithdrawals.length > 0 ? (
                  <span className="text-[#526E5F] font-medium">
                    {newWithdrawals.length} {newWithdrawals.length === 1 ? 'ny att hantera' : 'nya att hantera'}
                  </span>
                ) : (
                  <span className="text-[#66726A]">Inget att hantera</span>
                )}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E6DFD3]/60 flex items-center justify-between text-[11px] text-[#526E5F] group-hover:underline">
              <span>Se ångerärenden</span>
              <ChevronRight className="w-3 h-3 text-[#8C9B90] group-hover:text-[#526E5F] transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

        </div>
      </div>

      {/* 3. STATISTIK */}
      <div>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#66726A] font-semibold mb-3">
          BUTIKSÖVERSIKT
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Produkter */}
          <div
            onClick={() => onNavigateTab('products')}
            className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#66726A]">Produkter</span>
              <div className="w-7 h-7 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-3xl font-serif font-medium text-[#242D27]">
              {products.length}
            </div>
            <div className="text-[11px] text-[#66726A] mt-1 font-light">
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
            className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#66726A]">Kategorier</span>
              <div className="w-7 h-7 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-3xl font-serif font-medium text-[#242D27]">
              {categories.length}
            </div>
            <div className="text-[11px] text-[#66726A] mt-1 font-light">
              Aktiva kategorier
            </div>
          </div>

          {/* Pågående */}
          <div
            onClick={() => onNavigateTab('inquiries')}
            className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD3] hover:border-[#6B8E7B] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#66726A]">Pågående</span>
              <div className="w-7 h-7 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-3xl font-serif font-medium text-[#242D27]">
              {ongoingInquiries.length}
            </div>
            <div className="text-[11px] text-[#66726A] mt-1 font-light">
              {ongoingInquiries.length > 0 ? (
                <span>{ongoingInquiries.length} under arbete</span>
              ) : (
                <span>Inget att hantera</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. REKLAMATIONER + ÅNGERÄRENDEN ARBETSKORT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Reklamationer kort */}
        <div
          onClick={() => onNavigateTab('claims')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
            newClaims.length > 0
              ? 'bg-[#FAF8F5] border-[#D5E5DC] hover:border-[#6B8E7B]'
              : 'bg-[#FBF9F5] border-[#E6DFD3] hover:border-[#6B8E7B]'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#66726A] font-semibold">
                REKLAMATIONER
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-medium text-[#242D27]">
                  {claims.length}
                </span>
                <span className="text-xs text-[#66726A] font-light">totalt</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EFF4F1] text-[#526E5F] flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-[#66726A] font-light">
              {newClaims.length > 0 ? (
                <span className="text-[#526E5F] font-medium">
                  {newClaims.length} {newClaims.length === 1 ? 'nytt ärende behöver hanteras' : 'nya ärenden behöver hanteras'}
                </span>
              ) : (
                <span>Inget att hantera</span>
              )}
            </p>

            <div className="pt-2 border-t border-[#E6DFD3]/60 flex items-center justify-between text-xs text-[#526E5F] font-medium group-hover:underline">
              <span>&rarr; Hantera reklamationer</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C9B90] group-hover:text-[#526E5F] transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Ångerärenden kort */}
        <div
          onClick={() => onNavigateTab('withdrawals')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
            newWithdrawals.length > 0
              ? 'bg-[#FAF8F5] border-[#D5E5DC] hover:border-[#6B8E7B]'
              : 'bg-[#FBF9F5] border-[#E6DFD3] hover:border-[#6B8E7B]'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#66726A] font-semibold">
                ÅNGERÄRENDEN
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-medium text-[#242D27]">
                  {withdrawals.length}
                </span>
                <span className="text-xs text-[#66726A] font-light">totalt</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EFF4F1] text-[#526E5F] flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-[#66726A] font-light">
              {newWithdrawals.length > 0 ? (
                <span className="text-[#526E5F] font-medium">
                  {newWithdrawals.length} {newWithdrawals.length === 1 ? 'ny anmälan behöver hanteras' : 'nya anmälningar behöver hanteras'}
                </span>
              ) : (
                <span>Inget att hantera</span>
              )}
            </p>

            <div className="pt-2 border-t border-[#E6DFD3]/60 flex items-center justify-between text-xs text-[#526E5F] font-medium group-hover:underline">
              <span>&rarr; Hantera ångerärenden</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C9B90] group-hover:text-[#526E5F] transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

      </div>

      {/* 5 & 6. SENASTE FÖRFRÅGNINGAR (60-65%) OCH NYLIGEN SKAPADE (35-40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 5. Senaste förfrågningar (60-65% width on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
            <div>
              <h2 className="font-serif text-xl text-[#242D27] font-medium">
                Senaste förfrågningar
              </h2>
              <p className="text-xs text-[#66726A] font-light mt-0.5">
                Senast inkomna kundbeställningar och förfrågningar
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('inquiries')}
              className="text-xs font-medium text-[#526E5F] hover:text-[#242D27] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F3EFE8] transition-colors cursor-pointer"
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
            <div className="divide-y divide-[#E6DFD3]/70">
              {recentInquiries.map((inquiry) => {
                const itemCount = inquiry.items ? inquiry.items.length : 0;
                return (
                  <div
                    key={inquiry.id}
                    onClick={() => onNavigateTab('view-inquiry', inquiry.id)}
                    className="py-3 sm:py-3.5 flex items-center justify-between hover:bg-[#F3EFE8]/50 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 pr-3 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#242D27] font-mono">
                          {inquiry.inquiryNumber || `#${inquiry.id.slice(0, 6)}`}
                        </span>
                        <span className="text-xs text-[#242D27] font-medium truncate">
                          {inquiry.customerName || 'Kund'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#66726A] font-light truncate">
                        {itemCount} {itemCount === 1 ? 'produkt' : 'produkter'} &bull; {inquiry.estimatedTotal || 0} kr
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                          inquiry.status === 'Ny'
                            ? 'bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]'
                            : inquiry.status === 'Klar'
                            ? 'bg-[#E6DFD3] text-[#242D27]'
                            : ['Kontaktad', 'Bekräftad', 'Under arbete'].includes(inquiry.status)
                            ? 'bg-[#F3EFE8] text-[#526E5F] border border-[#E6DFD3]'
                            : 'bg-[#F7F4F0] text-[#8C7A70]'
                        }`}
                      >
                        {inquiry.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8C9B90] group-hover:text-[#242D27] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Nyligen skapade (35-40% width on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          
          {/* Opublicerade produkter info om sådana finns */}
          {unpublishedProducts.length > 0 && (
            <div className="bg-[#FAF4ED] border border-[#E6D7C3] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#7A5930] font-medium text-xs">
                <EyeOff className="w-4 h-4 shrink-0" />
                <span>{unpublishedProducts.length} opublicerad(e) produkt(er)</span>
              </div>
              <p className="text-[11px] text-[#7A5930]/90 leading-relaxed font-light">
                Dessa syns inte i butiken förrän du publicerar dem.
              </p>
              <div className="space-y-1 pt-1">
                {unpublishedProducts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigateTab('edit-product', p.id)}
                    className="text-xs text-[#242D27] hover:underline cursor-pointer flex items-center justify-between py-0.5"
                  >
                    <span className="truncate max-w-[180px]">{p.name}</span>
                    <span className="text-[10px] text-[#7A5930] shrink-0">Redigera &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nyligen skapade produkter */}
          <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
              <div>
                <h2 className="font-serif text-xl text-[#242D27] font-medium">
                  Nyligen skapade
                </h2>
                <p className="text-xs text-[#66726A] font-light mt-0.5">
                  Senaste produkterna i ateljén
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs font-medium text-[#526E5F] hover:text-[#242D27] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              >
                <span>Alla</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#66726A] font-light">
                Inga produkter skapade ännu.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentProducts.map((p) => {
                  const productImage = p.images?.[0] || p.image;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onNavigateTab('edit-product', p.id)}
                      className="flex items-center gap-3 p-2 hover:bg-[#F3EFE8]/60 rounded-xl transition-all cursor-pointer group"
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={p.name}
                          className="w-11 h-11 rounded-lg object-cover bg-[#F3EFE8] border border-[#E6DFD3] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-[#F3EFE8] border border-[#E6DFD3] flex items-center justify-center shrink-0 text-[#8C9B90]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-[#242D27] group-hover:text-[#526E5F] transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#66726A] font-light">
                          {p.category || 'Produkt'} &bull; {p.price} kr
                        </div>
                      </div>

                      {p.featured && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#526E5F] font-semibold shrink-0">
                          Utvald
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
