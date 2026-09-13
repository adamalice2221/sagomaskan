const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

const footerIndex = code.indexOf("{activeTab === 'footer' && (");
if (footerIndex !== -1) {
    let beforeFooter = code.substring(0, footerIndex);
    
    // Check if we need to close 'search' before footer
    // Wait, how did it look?
    
    let endOfFile = `        {activeTab === 'footer' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* FOOTER SECTION */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
            <Layout className="w-4 h-4 text-[#6B8E7B]" />
            <span>Sidfot (Footer)</span>
          </h2>

          {/* 1. VARUMÄRKE */}
          <div className="space-y-4 pt-1">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              1. Varumärke
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Märkesnamn (Visas i vänsterkolumnen)
                </label>
                <input
                  type="text"
                  value={footerBrandName}
                  onChange={(e) => setFooterBrandName(e.target.value)}
                  placeholder="SAGOMASKAN"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Tagline (Liten text under märkesnamnet)
                </label>
                <input
                  type="text"
                  value={footerTagline}
                  onChange={(e) => setFooterTagline(e.target.value)}
                  placeholder="VIRKADE PRODUKTER"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Kort beskrivning
                </label>
                <textarea
                  rows={2}
                  value={footerDescription}
                  onChange={(e) => setFooterDescription(e.target.value)}
                  placeholder="Handgjorda virkade produkter, skapade med omsorg och glädje."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>
          </div>

          {/* 2. SIDOR */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              2. Sidor (Navigeringslänkar)
            </h3>
            <div className="space-y-3">
              {footerPageLinks.map((link, idx) => (
                <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => handlePageLinkChange(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                    />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handlePageLinkChange(idx, 'label', e.target.value)}
                          placeholder="Länknamn (t.ex. Hem)"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => handlePageLinkChange(idx, 'href', e.target.value)}
                          placeholder="Mål (t.ex. home)"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] opacity-70"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. INFORMATION */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              3. Information (Hjälpsidor)
            </h3>
            <div className="space-y-3">
              {footerInfoLinks.map((link, idx) => (
                <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => handleInfoLinkChange(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                    />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleInfoLinkChange(idx, 'label', e.target.value)}
                          placeholder="Länknamn"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => handleInfoLinkChange(idx, 'href', e.target.value)}
                          placeholder="Mål"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] opacity-70"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. KONTAKT & FÖLJ */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              4. Kontakt & Följ
            </h3>
            <div className="space-y-3">
              {/* Instagram */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={footerInstagramEnabled}
                    onChange={(e) => setFooterInstagramEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={footerInstagramLabel}
                        onChange={(e) => setFooterInstagramLabel(e.target.value)}
                        placeholder="Titel (t.ex. Instagram)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={footerInstagramUrl}
                        onChange={(e) => setFooterInstagramUrl(e.target.value)}
                        placeholder="URL (t.ex. https://instagram.com/...)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* E-post */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] opacity-50"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={footerEmailLabel}
                        onChange={(e) => setFooterEmailLabel(e.target.value)}
                        placeholder="Titel (t.ex. E-post)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={footerEmail}
                        onChange={(e) => setFooterEmail(e.target.value)}
                        placeholder="E-postadress"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontaktformulär (Länk till kontaktsidan) */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={footerContactEnabled}
                    onChange={(e) => setFooterContactEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={footerContactLabel}
                        onChange={(e) => setFooterContactLabel(e.target.value)}
                        placeholder="Titel (t.ex. Kontakt)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={footerContactUrl}
                        onChange={(e) => setFooterContactUrl(e.target.value)}
                        placeholder="Mål (t.ex. contact)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] opacity-70"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. NEDRE FOOTER */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              5. Längst ner (Copyright & Signatur)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Copyright-text
                </label>
                <input
                  type="text"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  placeholder="© Sagomaskan. Alla rättigheter reserverade."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Signatur-text (Slogan längst ner)
                </label>
                <input
                  type="text"
                  value={footerSignature}
                  onChange={(e) => setFooterSignature(e.target.value)}
                  placeholder="Små maskor – stora leenden. ♡"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[#242D27] block">Visa "Admin"-länk i footern</span>
                  <p className="text-[10px] text-[#8C9890]">Gör en diskret "Admin"-länk synlig i footern för besökare.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={footerShowAdminLink}
                    onChange={(e) => setFooterShowAdminLink(e.target.checked)}
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                  />
                  <span className="text-xs text-[#242D27]">Visa länk</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        </div>
        )}

        {activeTab === 'orders' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 text-center space-y-3">
            <ShoppingBag className="w-8 h-8 text-[#6B8E7B] mx-auto opacity-50" />
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              Beställningar & meddelanden
            </h2>
            <p className="text-xs text-[#66726A]">
              Inga redigerbara inställningar för närvarande. Denna sektion är förberedd för framtida uppdateringar.
            </p>
          </div>
        </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Sparar...' : 'Spara ändringar'}</span>
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};
`;

    fs.writeFileSync('src/components/admin/AdminSettings.tsx', beforeFooter + endOfFile);
    console.log("Successfully replaced footer and end of file");
} else {
    console.log("Could not find footer section");
}
