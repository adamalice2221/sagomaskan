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

  const totalToDos = newInquiries.length + newClaims.length + newWithdrawals.length;

  return (
    <div className="space-y-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E6DFD3]">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B8E7B] font-bold">
            Översikt
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-semibold leading-tight">
            Sagomaskan Admin
          </h1>
          <p className="text-sm text-[#66726A] font-light">
            Din överblick över shoppen, lagret och inkomna ärenden.
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <button
            onClick={() => onNavigateTab('create-product')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-semibold hover:bg-[#344038] transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-[#6B8E7B] focus:outline-none"
          >
            <Plus className="w-4 h-4 text-[#6B8E7B]" />
            <span>Skapa produkt</span>
          </button>
        </div>
      </div>

      {/* 2. ATT GÖRA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-[#6B8E7B] font-bold">
            ATT GÖRA JUST NU
          </h2>
          {totalToDos > 0 ? (
            <span className="text-[10px] sm:text-xs text-[#8C5248] font-semibold bg-[#FAF4F3] px-3 py-1 rounded-full border border-[#8C5248]/15">
              {totalToDos} nya ärenden kräver uppmärksamhet
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs text-[#526E5F] font-semibold bg-[#EFF4F1] px-3 py-1 rounded-full border border-[#6B8E7B]/15">
              Alla ärenden är hanterade &bull; Snyggt jobbat!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Förfrågningar card */}
          <div
            onClick={() => onNavigateTab('inquiries')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] ${
              newInquiries.length > 0
                ? 'bg-[#FAF8F5] border-[#D5E5DC] hover:border-[#6B8E7B] hover:shadow-xs'
                : 'bg-[#FAF8F5] border-[#E6DFD3] hover:border-[#6B8E7B]/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#66726A]">Förfrågningar</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  newInquiries.length > 0
                    ? 'bg-[#EFF4F1] text-[#526E5F]'
                    : 'bg-[#F3EFE8] text-[#8C9B90]'
                }`}
              >
                <Inbox className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-3xl font-serif font-bold text-[#242D27]">
                {newInquiries.length}
              </div>
              <p className="text-[10px] sm:text-[11px] mt-1 font-light leading-relaxed">
                {newInquiries.length > 0 ? (
                  <span className="text-[#526E5F] font-semibold">
                    {newInquiries.length} {newInquiries.length === 1 ? 'ny förfrågan väntar' : 'nya förfrågningar väntar'}
                  </span>
                ) : (
                  <span className="text-[#66726A]">Inga nya förfrågningar</span>
                )}
              </p>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#E6DFD3]/60 flex items-center justify-between text-[11px] font-medium text-[#526E5F] group-hover:underline">
              <span>Hantera förfrågningar</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C9B90] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Reklamationer card */}
          <div
            onClick={() => onNavigateTab('claims')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] ${
              newClaims.length > 0
                ? 'bg-[#FAF8F5] border-[#E8C5C0] hover:border-[#8C5248] hover:shadow-xs'
                : 'bg-[#FAF8F5] border-[#E6DFD3] hover:border-[#6B8E7B]/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#66726A]">Reklamationer</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  newClaims.length > 0
                    ? 'bg-[#FAF4F3] text-[#8C5248]'
                    : 'bg-[#F3EFE8] text-[#8C9B90]'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-3xl font-serif font-bold text-[#242D27]">
                {newClaims.length}
              </div>
              <p className="text-[10px] sm:text-[11px] mt-1 font-light leading-relaxed">
                {newClaims.length > 0 ? (
                  <span className="text-[#8C5248] font-semibold">
                    {newClaims.length} {newClaims.length === 1 ? 'nytt reklamationsärende' : 'nya reklamationer'}
                  </span>
                ) : (
                  <span className="text-[#66726A]">Inga nya reklamationer</span>
                )}
              </p>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#E6DFD3]/60 flex items-center justify-between text-[11px] font-medium text-[#526E5F] group-hover:underline">
              <span>Hantera reklamationer</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C9B90] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Ångerärenden card */}
          <div
            onClick={() => onNavigateTab('withdrawals')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] ${
              newWithdrawals.length > 0
                ? 'bg-[#FAF8F5] border-[#E8C5C0] hover:border-[#8C5248] hover:shadow-xs'
                : 'bg-[#FAF8F5] border-[#E6DFD3] hover:border-[#6B8E7B]/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#66726A]">Ångerärenden</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  newWithdrawals.length > 0
                    ? 'bg-[#FAF4F3] text-[#8C5248]'
                    : 'bg-[#F3EFE8] text-[#8C9B90]'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-3xl font-serif font-bold text-[#242D27]">
                {newWithdrawals.length}
              </div>
              <p className="text-[10px] sm:text-[11px] mt-1 font-light leading-relaxed">
                {newWithdrawals.length > 0 ? (
                  <span className="text-[#8C5248] font-semibold">
                    {newWithdrawals.length} {newWithdrawals.length === 1 ? 'nytt ångerärende' : 'nya ångerärenden'}
                  </span>
                ) : (
                  <span className="text-[#66726A]">Inga nya ångerärenden</span>
                )}
              </p>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#E6DFD3]/60 flex items-center justify-between text-[11px] font-medium text-[#526E5F] group-hover:underline">
              <span>Hantera ångerärenden</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C9B90] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BUTIKSÖVERSIKT / STATISTIK */}
      <div className="space-y-4">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-[#6B8E7B] font-bold">
          BUTIKSÖVERSIKT & LAGER
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Produkter */}
          <div
            onClick={() => onNavigateTab('products')}
            className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#66726A]">Totalt antal produkter</span>
              <div className="w-7 h-7 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-[#6B8E7B]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-[#242D27]">
                {products.length}
              </div>
              <p className="text-[11px] text-[#66726A] mt-1 font-light">
                {unpublishedProducts.length > 0 ? (
                  <span className="text-[#8C5248] font-medium">{unpublishedProducts.length} är dolda/opublicerade</span>
                ) : (
                  <span>Alla produkter publicerade</span>
                )}
              </p>
            </div>
          </div>

          {/* Kategorier */}
          <div
            onClick={() => onNavigateTab('categories')}
            className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#66726A]">Kategorier</span>
              <div className="w-7 h-7 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-[#6B8E7B]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-[#242D27]">
                {categories.length}
              </div>
              <p className="text-[11px] text-[#66726A] mt-1 font-light">
                Aktiva produktkategorier
              </p>
            </div>
          </div>

          {/* Pågående förfrågningar */}
          <div
            onClick={() => onNavigateTab('inquiries')}
            className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] hover:border-[#6B8E7B]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#66726A]">Pågående arbete</span>
              <div className="w-7 h-7 rounded-full bg-[#F3EFE8] text-[#66726A] flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#6B8E7B]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-[#242D27]">
                {ongoingInquiries.length}
              </div>
              <p className="text-[11px] text-[#66726A] mt-1 font-light">
                {ongoingInquiries.length > 0 ? (
                  <span>{ongoingInquiries.length} förfrågningar under behandling</span>
                ) : (
                  <span>Inget aktivt arbete för tillfället</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SENASTE FÖRFRÅGNINGAR & NYLIGEN SKAPADE PRODUKTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Senaste förfrågningar (Left, occupies 60-65% space) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
            <div>
              <h2 className="font-serif text-lg text-[#242D27] font-semibold">
                Senaste förfrågningar
              </h2>
              <p className="text-xs text-[#66726A] font-light">
                Inkomna kundbeställningar och handgjorda förfrågningar
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('inquiries')}
              className="text-xs font-semibold text-[#526E5F] hover:text-[#242D27] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl hover:bg-[#F3EFE8] transition-colors cursor-pointer"
            >
              <span>Visa alla</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#6B8E7B]" />
            </button>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#66726A] font-light">
              Inga förfrågningar har inkommit ännu.
            </div>
          ) : (
            <div className="divide-y divide-[#E6DFD3]/40">
              {recentInquiries.map((inquiry) => {
                const itemCount = inquiry.items ? inquiry.items.length : 0;
                return (
                  <div
                    key={inquiry.id}
                    onClick={() => onNavigateTab('view-inquiry', inquiry.id)}
                    className="py-3.5 flex items-center justify-between hover:bg-[#F3EFE8]/30 px-3 -mx-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 pr-3 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#242D27] font-mono tracking-tight bg-[#F3EFE8] px-1.5 py-0.5 rounded border border-[#E6DFD3]">
                          {inquiry.inquiryNumber || `#${inquiry.id.slice(0, 6)}`}
                        </span>
                        <span className="text-xs text-[#242D27] font-semibold truncate">
                          {inquiry.customerName || 'Kund'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#66726A] font-light">
                        {itemCount} {itemCount === 1 ? 'produkt' : 'produkter'} &bull; <strong className="font-semibold text-[#242D27]">{inquiry.estimatedTotal || 0} kr</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          inquiry.status === 'Ny'
                            ? 'bg-[#EFF4F1] text-[#2E6B4B] border-[#2E6B4B]/20'
                            : inquiry.status === 'Klar'
                            ? 'bg-[#F3EFE8] text-[#242D27] border-transparent'
                            : ['Kontaktad', 'Bekräftad', 'Under arbete'].includes(inquiry.status)
                            ? 'bg-[#FAF8F5] text-[#526E5F] border-[#6B8E7B]/20'
                            : 'bg-[#F7F4F0] text-[#8C7A70] border-transparent'
                        }`}
                      >
                        {inquiry.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8C9B90] group-hover:text-[#242D27] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nyligen skapade produkter (Right, occupies 35-40% space) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Warning for unpublished/hidden products */}
          {unpublishedProducts.length > 0 && (
            <div className="bg-[#FAF4ED] border border-[#E6D7C3] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center gap-2 text-[#7A5930] font-semibold text-xs">
                <EyeOff className="w-4 h-4 shrink-0 text-[#C89D6B]" />
                <span>{unpublishedProducts.length} dolda alster</span>
              </div>
              <p className="text-[11px] text-[#7A5930]/90 leading-relaxed font-light">
                Dessa syns för tillfället inte för dina besökare i butiken.
              </p>
              <div className="space-y-1 pt-1.5">
                {unpublishedProducts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigateTab('edit-product', p.id)}
                    className="text-xs text-[#242D27] hover:underline cursor-pointer flex items-center justify-between py-0.5"
                  >
                    <span className="truncate max-w-[150px] font-medium">{p.name}</span>
                    <span className="text-[10px] text-[#7A5930] shrink-0 font-semibold">Redigera &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently created products */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
              <div>
                <h2 className="font-serif text-lg text-[#242D27] font-semibold">
                  Nyligen skapade
                </h2>
                <p className="text-xs text-[#66726A] font-light">
                  De senaste alstren från din ateljé
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs font-semibold text-[#526E5F] hover:text-[#242D27] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              >
                <span>Alla</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B8E7B]" />
              </button>
            </div>

            {recentProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#66726A] font-light">
                Inga produkter registrerade.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentProducts.map((p) => {
                  const productImage = p.images?.[0] || p.image;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onNavigateTab('edit-product', p.id)}
                      className="flex items-center gap-3 p-2 hover:bg-[#F3EFE8]/40 rounded-xl transition-all cursor-pointer group"
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-[#F3EFE8] border border-[#E6DFD3] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#F3EFE8] border border-[#E6DFD3] flex items-center justify-center shrink-0 text-[#8C9B90]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#242D27] group-hover:text-[#526E5F] transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#66726A] font-light">
                          {p.category || 'Produkt'} &bull; <span className="font-medium text-[#242D27]">{p.price} kr</span>
                        </div>
                      </div>

                      {p.featured && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#EFF4F1] text-[#2E6B4B] font-bold shrink-0 border border-[#2E6B4B]/10">
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
