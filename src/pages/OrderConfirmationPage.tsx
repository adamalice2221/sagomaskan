import React from 'react';
import { CheckCircle, Heart, Mail, Clock, Home } from 'lucide-react';
import { OrderInquiry, PageRoute } from '../types';
import { getPageUrl, isModifiedClick } from '../utils/navigation';

interface OrderConfirmationPageProps {
  order: OrderInquiry | null;
  onNavigate: (page: PageRoute) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onNavigate
}) => {
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#242D27]">
          Ingen beställningsförfrågan hittades
        </h2>
        <p className="text-sm text-[#66726A] font-light">
          Gå till shoppen för att titta på våra handgjorda produkter och skapa en beställningsförfrågan.
        </p>
        <a
          href={getPageUrl('home')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('home');
            }
          }}
          className="inline-block px-6 py-2.5 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors cursor-pointer"
        >
          Tillbaka till startsidan
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      {/* Top Thank You Banner */}
      <div className="text-center space-y-4 bg-[#EFF4F1] border border-[#6B8E7B]/30 rounded-3xl p-8 sm:p-12">
        <div className="w-16 h-16 rounded-full bg-[#6B8E7B] text-[#FAF8F5] flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl text-[#242D27] font-medium tracking-tight">
          Tack för din beställningsförfrågan!
        </h1>

        <p className="text-base sm:text-lg text-[#526E5F] max-w-xl mx-auto font-light leading-relaxed">
          Jag har tagit emot din förfrågan och återkommer personligen inom kort.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#242D27] font-medium">
          <span>Referensnummer:</span>
          <strong className="font-semibold text-[#6B8E7B]">{order.inquiryNumber || order.id}</strong>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#66726A] max-w-md mx-auto pt-2">
          <Mail className="w-4 h-4 text-[#6B8E7B] shrink-0" />
          <span>
            En sammanfattning och bekräftelse skickas till <strong className="font-medium text-[#242D27]">{order.customer.email}</strong>.
          </span>
        </div>
      </div>

      {/* Process information */}
      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-serif text-xl font-medium text-[#242D27] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#6B8E7B]" />
          <span>Vad händer nu?</span>
        </h3>
        
        <p className="text-sm text-[#66726A] leading-relaxed font-light">
          Jag går personligen igenom ditt önskemål och garnlager. Därefter återkommer jag till dig via e-post med:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-[#66726A]">
          <div className="p-4 rounded-xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-1">
            <span className="font-medium text-[#242D27] block">1. Bekräftelse</span>
            <p>Att produkterna kan skapas och svar på eventuella önskemål.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-1">
            <span className="font-medium text-[#242D27] block">2. Leveranstid</span>
            <p>Beräknad tillverkningstid och när paketet kan skickas.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-1">
            <span className="font-medium text-[#242D27] block">3. Betalningsdetaljer</span>
            <p>Information om pris, eventuell frakt och betalning.</p>
          </div>
        </div>
      </div>

      {/* Sammanfattning av vad kunden önskat */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Products requested (7 cols) */}
        <div className="md:col-span-7 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 space-y-4">
          <h3 className="font-serif text-lg font-medium text-[#242D27] pb-2 border-b border-[#E6DFD3]">
            Önskade produkter
          </h3>

          <div className="divide-y divide-[#E6DFD3]">
            {order.items.map((item, index) => (
              <div key={index} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image || item.product.images[0]}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-[#F3EFE8] border border-[#E6DFD3]"
                  />
                  <div>
                    <h4 className="font-serif text-sm font-medium text-[#242D27]">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-[#66726A]">
                      Färg: <span className="text-[#242D27] font-medium">{item.selectedColor}</span>
                      {item.selectedSize && (
                        <> • Storlek: <span className="text-[#242D27] font-medium">{item.selectedSize}</span></>
                      )}
                      {' '}• {item.quantity} st
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#242D27]">
                  {item.product.price * item.quantity} kr
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E6DFD3] space-y-1.5 text-sm">
            {order.discountCode && (
              <div className="flex justify-between items-center text-xs text-[#526E5F] font-medium">
                <span className="flex items-center gap-1.5">
                  <span>Rabattkod</span>
                  <span className="font-mono bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#CDE0D4] text-[11px]">
                    {order.discountCode}
                  </span>
                </span>
                <span>−{order.discountAmount} kr</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-serif text-base text-[#242D27]">Beräknad totalsumma</span>
              <span className="text-lg font-bold text-[#242D27]">{order.estimatedTotal} kr</span>
            </div>
          </div>
        </div>

        {/* Customer & delivery details (5 cols) */}
        <div className="md:col-span-5 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 space-y-4">
          <h3 className="font-serif text-lg font-medium text-[#242D27] pb-2 border-b border-[#E6DFD3]">
            Dina kontaktuppgifter
          </h3>

          <div className="text-xs text-[#66726A] space-y-1.5 leading-relaxed">
            <p className="font-medium text-[#242D27] text-sm">
              {order.customer.name}
            </p>
            <p>{order.customer.address}</p>
            <p>{order.customer.postalCode} {order.customer.city}</p>
            <div className="pt-2 border-t border-[#E6DFD3]/80 space-y-1">
              <p>E-post: <strong className="text-[#242D27]">{order.customer.email}</strong></p>
              {order.customer.phone && <p>Telefon: {order.customer.phone}</p>}
            </div>

            {order.customer.message && (
              <div className="pt-2 border-t border-[#E6DFD3]/80">
                <span className="text-[11px] font-medium text-[#242D27] block mb-0.5">
                  Dina önskemål:
                </span>
                <p className="italic text-[#242D27] bg-[#F3EFE8]/70 p-2.5 rounded-lg">
                  "{order.customer.message}"
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Button back to homepage */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <a
          href={getPageUrl('home')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('home');
            }
          }}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#242D27] text-[#FAF8F5] rounded-xl text-xs font-medium hover:bg-[#6B8E7B] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Tillbaka till startsidan</span>
        </a>

        <a
          href={getPageUrl('shop')}
          onClick={(e) => {
            if (!isModifiedClick(e)) {
              e.preventDefault();
              onNavigate('shop');
            }
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] rounded-xl text-xs font-medium hover:bg-[#F3EFE8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Utforska fler produkter</span>
        </a>
      </div>

      <div className="text-center pt-4">
        <p className="font-serif italic text-sm text-[#242D27] flex items-center justify-center gap-1.5">
          <span>Tack för att du väljer handgjort och personligt hantverk</span>
          <Heart className="w-4 h-4 fill-[#6B8E7B] text-[#6B8E7B]" />
        </p>
      </div>

    </div>
  );
};
