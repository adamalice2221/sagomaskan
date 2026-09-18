import React, { useState } from 'react';
import { Mail, Instagram, Send, CheckCircle2, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageRoute } from '../types';

interface ContactPageProps {
  onNavigate?: (page: PageRoute) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Hör av dig
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#242D27] font-medium">
          Kontakt
        </h1>
        <p className="text-base sm:text-lg text-[#66726A] font-light leading-relaxed">
          Har du frågor om mina produkter, önskemål om färgval eller vill du skicka en förfrågan? Hör gärna av dig!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left: Contact Info & Socials (5 cols) */}
        <div className="md:col-span-5 space-y-8">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <h3 className="font-serif text-xl font-medium text-[#242D27]">
              Kontaktvägar
            </h3>

            <div className="space-y-4 text-xs text-[#66726A]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-medium text-[#242D27] block">E-post</span>
                  {!settingsLoaded ? (
                    <div className="h-4 w-32 bg-[#E6DFD3]/50 animate-pulse rounded my-0.5" />
                  ) : (
                    <a href={`mailto:${contactEmail}`} className="text-[#6B8E7B] hover:underline text-sm font-medium">
                      {contactEmail}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#EFF4F1] text-[#6B8E7B] shrink-0">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-medium text-[#242D27] block">Instagram</span>
                  {!settingsLoaded ? (
                    <div className="h-4 w-28 bg-[#E6DFD3]/50 animate-pulse rounded my-0.5" />
                  ) : (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#6B8E7B] hover:underline text-sm font-medium"
                    >
                      {instagramHandle}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#F3EFE8]/70 border border-[#E6DFD3] space-y-2 text-xs text-[#66726A]">
            <p className="font-serif text-sm font-medium text-[#242D27]">
              Önskemål och frågor
            </p>
            <p className="font-light leading-relaxed">
              Skriv gärna i formuläret om du undrar över garnval, storlekar eller har särskilda önskemål kring en beställning.
            </p>
          </div>

          {onNavigate && (
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD3] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#526E5F] font-semibold">
                <FileText className="w-4 h-4" />
                <span>Gäller ärendet en reklamation?</span>
              </div>
              <p className="text-[#66726A] font-light leading-relaxed">
                Om du vill reklamera en skadad produkt eller felexpedition, använd vårt officiella reklamationsformulär för snabbare handläggning och ärendenummer.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('claim')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#242D27] hover:text-[#526E5F] transition-colors cursor-pointer group"
              >
                <span>Till reklamationsformuläret</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Contact Form (7 cols) */}
        <div className="md:col-span-7 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 shadow-xs">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EFF4F1] text-[#6B8E7B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-[#242D27]">
                Tack för ditt meddelande!
              </h3>
              <p className="text-sm text-[#66726A] max-w-sm mx-auto font-light leading-relaxed">
                Jag har tagit emot ditt meddelande och återkommer till <strong className="text-[#242D27]">{formData.email}</strong> så snart jag lagt ifrån mig virknålen.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className="px-6 py-2.5 bg-[#242D27] text-[#FAF8F5] text-xs font-medium rounded-lg hover:bg-[#6B8E7B] transition-colors"
              >
                Skicka ett till meddelande
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-serif text-xl font-medium text-[#242D27] mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#6B8E7B]" />
                <span>Skicka ett meddelande</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Ditt namn *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Förnamn och efternamn"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  E-postadress *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="din.epost@exempel.se"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Ämne
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="T.ex. Fråga om produkt eller specialbeställning"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Meddelande *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Skriv dina frågor eller funderingar här..."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3.5 py-2.5 text-sm text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#242D27] text-[#FAF8F5] rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#6B8E7B] transition-colors shadow-sm"
              >
                <span>Skicka meddelande</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
