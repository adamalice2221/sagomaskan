import React, { useState } from 'react';
import { Mail, Instagram, Send, CheckCircle2, MessageSquare, ArrowUpRight, Heart } from 'lucide-react';
import { useData } from '../context/DataContext';

export const ContactPage: React.FC = () => {
  const { settings, settingsLoaded } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactEmail = settings?.email || 'hello@sagomaskan.se';
  const instagramHandle = settings?.instagram || '@sagomaskan';
  const instagramUrl = settings?.footerInstagramUrl || `https://instagram.com/${instagramHandle.replace('@', '')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      
      {/* 1 & 2. Hero / Intro */}
      <section className="text-center max-w-2xl mx-auto space-y-4 pt-2 sm:pt-4">
        {/* Handcrafted yarn stitch accent */}
        <div className="inline-flex items-center justify-center gap-2 text-[#6B8E7B] mb-1" aria-hidden="true">
          <span className="w-6 h-[1.5px] bg-[#6B8E7B]/30 rounded-full" />
          <svg className="w-10 h-3 text-[#6B8E7B]" viewBox="0 0 40 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 6c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
          </svg>
          <span className="w-6 h-[1.5px] bg-[#6B8E7B]/30 rounded-full" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#242D27] font-medium tracking-tight leading-tight">
          Hör gärna av dig
        </h1>

        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Har du en fråga, fundering eller vill du veta mer om någon av mina virkade skapelser? Jag hjälper dig gärna.
        </p>
      </section>

      {/* 4. Kontaktkort (2 columns on tablet/desktop, stacked on mobile) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Kort 1: Kontakta mig */}
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:border-[#6B8E7B]/50 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shrink-0 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#242D27]">
              Kontakta mig
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed">
            Har du frågor om produkter, beställningar eller något annat? Skicka gärna ett meddelande.
          </p>

          <div className="pt-2 border-t border-[#E6DFD3]/60">
            <div className="flex items-center justify-between text-xs text-[#66726A] pt-1">
              <span className="font-medium text-[#242D27]">E-postadress</span>
            </div>
            {!settingsLoaded ? (
              <div className="h-5 w-40 bg-[#E6DFD3]/50 animate-pulse rounded mt-1.5" />
            ) : (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-[#6B8E7B] hover:text-[#242D27] hover:underline transition-colors mt-1 break-all"
              >
                <span>{contactEmail}</span>
                <ArrowUpRight className="w-4 h-4 shrink-0 opacity-70" />
              </a>
            )}
          </div>
        </div>

        {/* Kort 2: Följ Sagomaskan */}
        <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:border-[#6B8E7B]/50 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center shrink-0 shadow-2xs">
              <Instagram className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#242D27]">
              Följ Sagomaskan
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed">
            Följ med bakom kulisserna och se nya skapelser på Instagram.
          </p>

          <div className="pt-2 border-t border-[#E6DFD3]/60">
            <div className="flex items-center justify-between text-xs text-[#66726A] pt-1">
              <span className="font-medium text-[#242D27]">Instagram</span>
            </div>
            {!settingsLoaded ? (
              <div className="h-5 w-28 bg-[#E6DFD3]/50 animate-pulse rounded mt-1.5" />
            ) : (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-[#6B8E7B] hover:text-[#242D27] hover:underline transition-colors mt-1"
              >
                <span>{instagramHandle}</span>
                <ArrowUpRight className="w-4 h-4 shrink-0 opacity-70" />
              </a>
            )}
          </div>
        </div>

      </section>

      {/* 5. Kontaktformuläret (Large, elegant card centered under the contact cards) */}
      <section className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs">
        {isSubmitted ? (
          <div className="py-12 sm:py-16 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#242D27] font-medium">
                Tack för ditt meddelande!
              </h3>
              <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed">
                Jag har tagit emot ditt meddelande och återkommer till <strong className="font-medium text-[#242D27]">{formData.email}</strong> så snart jag lagt ifrån mig virknålen.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className="px-8 py-3.5 bg-[#242D27] text-[#FAF8F5] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#6B8E7B] transition-colors cursor-pointer shadow-xs"
              >
                Skicka ett till meddelande
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Header with delicate decorative yarn & heart motif */}
            <div className="space-y-2 border-b border-[#E6DFD3]/70 pb-5">
              <div className="inline-flex items-center gap-2 text-[#6B8E7B]">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Kontaktformulär</span>
                <span className="text-[#E6DFD3]">•</span>
                <span className="inline-flex items-center text-xs text-[#D9A88F]">
                  <Heart className="w-3 h-3 fill-current inline-block" />
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-[#242D27]">
                Vad kan jag hjälpa dig med?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  Ditt namn <span className="text-[#6B8E7B]">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Förnamn och efternamn"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-3.5 text-sm sm:text-base text-[#242D27] placeholder-[#66726A]/50 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-[#242D27] mb-1.5">
                  E-postadress <span className="text-[#6B8E7B]">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="din.epost@exempel.se"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-3.5 text-sm sm:text-base text-[#242D27] placeholder-[#66726A]/50 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Ämne
              </label>
              <input
                id="contact-subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="T.ex. Fråga om produkt eller specialbeställning"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-3.5 text-sm sm:text-base text-[#242D27] placeholder-[#66726A]/50 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-medium text-[#242D27] mb-1.5">
                Meddelande <span className="text-[#6B8E7B]">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Skriv dina frågor eller funderingar här..."
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-3.5 text-sm sm:text-base text-[#242D27] placeholder-[#66726A]/50 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all resize-y min-h-[140px]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-4 bg-[#242D27] text-[#FAF8F5] rounded-xl text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center gap-2.5 hover:bg-[#6B8E7B] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
              >
                <span>Skicka meddelande</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 6. Personlig avslutning (Centered with subtle heart divider line) */}
      <section className="text-center max-w-xl mx-auto space-y-4 py-4 sm:py-6">
        {/* Subtle decorative line with small heart in center */}
        <div className="flex items-center justify-center gap-3 text-[#E6DFD3]" aria-hidden="true">
          <span className="h-[1px] w-12 sm:w-20 bg-[#E6DFD3]" />
          <Heart className="w-3.5 h-3.5 text-[#6B8E7B] fill-[#6B8E7B]/20" />
          <span className="h-[1px] w-12 sm:w-20 bg-[#E6DFD3]" />
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#242D27]">
            Har du en idé? Berätta!
          </h3>
          <p className="text-sm sm:text-base text-[#66726A] font-light leading-relaxed">
            Jag tycker om att höra från dig – oavsett om du har en fråga, vill beställa något eller bara vill säga hej.
          </p>
        </div>
      </section>

    </div>
  );
};


