const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

code = code.replace('{/* Kontaktuppgifter */}', `{activeTab === 'contact' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Kontaktuppgifter */}`);

code = code.replace('{/* Startsida Hero text & bild */}', `        </div>
        )}

        {activeTab === 'hero' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Startsida Hero text & bild */}`);

code = code.replace('{/* Meddelanderad / Announcement Bar */}', `{/* Meddelanderad / Announcement Bar */}`); // Remains inside 'hero'

code = code.replace('{/* Om mig / Om hantverket */}', `        </div>
        )}

        {activeTab === 'about' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Om mig / Om hantverket */}`);

code = code.replace('{/* Frakt & leverans (Innehåll) */}', `        </div>
        )}

        {activeTab === 'info' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Frakt & leverans (Innehåll) */}`);

code = code.replace('{/* Köpvillkor & Information */}', `{/* Köpvillkor & Information */}`); // Remains inside 'info'
code = code.replace('{/* Vanliga frågor (FAQ) */}', `{/* Vanliga frågor (FAQ) */}`); // Remains inside 'info'

code = code.replace('{/* Populära söktermer (Sökmodal) */}', `        </div>
        )}

        {activeTab === 'search' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Populära söktermer (Sökmodal) */}`);

code = code.replace('{/* FOOTER SECTION */}', `        </div>
        )}

        {activeTab === 'footer' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* FOOTER SECTION */}`);

code = code.replace('{/* Submit */}', `        </div>
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

        {/* Submit */}`);

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Replaced");
