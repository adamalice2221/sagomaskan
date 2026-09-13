const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

// I will re-do the wrapper with active tabs.
code = code.replace('{/* Kontaktuppgifter */}', "{activeTab === 'contact' && (\n        <div className=\"space-y-8\">\n        {/* Kontaktuppgifter */}");
code = code.replace('        {/* Startsida Hero text & bild */}', "        </div>\n        )}\n\n        {activeTab === 'hero' && (\n        <div className=\"space-y-8\">\n        {/* Startsida Hero text & bild */}");
code = code.replace('        {/* Om mig / Om hantverket */}', "        </div>\n        )}\n\n        {activeTab === 'about' && (\n        <div className=\"space-y-8\">\n        {/* Om mig / Om hantverket */}");
code = code.replace('        {/* Frakt & leverans (Innehåll) */}', "        </div>\n        )}\n\n        {activeTab === 'info' && (\n        <div className=\"space-y-8\">\n        {/* Frakt & leverans (Innehåll) */}");
code = code.replace('        {/* Populära söktermer (Sökmodal) */}', "        </div>\n        )}\n\n        {activeTab === 'search' && (\n        <div className=\"space-y-8\">\n        {/* Populära söktermer (Sökmodal) */}");
code = code.replace('        {/* FOOTER SECTION */}', "        </div>\n        )}\n\n        {activeTab === 'footer' && (\n        <div className=\"space-y-8\">\n        {/* FOOTER SECTION */}");
code = code.replace('        {/* Submit */}', "        </div>\n        )}\n\n        {activeTab === 'orders' && (\n        <div className=\"space-y-8\">\n          <div className=\"bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 text-center space-y-3\">\n            <ShoppingBag className=\"w-8 h-8 text-[#6B8E7B] mx-auto opacity-50\" />\n            <h2 className=\"font-serif text-xl text-[#242D27] font-medium\">\n              Beställningar & meddelanden\n            </h2>\n            <p className=\"text-xs text-[#66726A]\">\n              Inga redigerbara inställningar för närvarande.\n            </p>\n          </div>\n        </div>\n        )}\n\n        {/* Submit */}");

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Done");
