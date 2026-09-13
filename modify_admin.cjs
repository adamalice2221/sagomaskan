const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

// Replace the max-w-3xl wrapper with max-w-5xl and add the layout
code = code.replace('<div className="max-w-3xl mx-auto space-y-8 pb-16">', '<div className="max-w-5xl mx-auto space-y-8 pb-16">');

const headerBlock = `      <div className="pb-4 border-b border-[#E6DFD3]">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Webbplats
        </span>
        <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
          Innehåll & Inställningar
        </h1>
        <p className="text-xs text-[#66726A] font-light mt-0.5">
          Ändra texter, hjältebild, kontaktuppgifter och sidfotsinställningar på kundsidan.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>&times;</button>
        </div>
      )}`;

const layoutStart = `
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Vänster Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-1 bg-[#FBF9F5] p-2 border border-[#E6DFD3] rounded-2xl flex lg:flex-col overflow-x-auto lg:overflow-visible snap-x">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={\`snap-start flex-shrink-0 text-left px-4 py-3 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 whitespace-nowrap \${
                  activeTab === tab.id
                    ? 'bg-[#EBF3EE] text-[#242D27]'
                    : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
                }\`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Innehållsyta */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">`;

code = code.replace(headerBlock + '\n\n      <form onSubmit={handleSubmit} noValidate className="space-y-8">', headerBlock + layoutStart);

// Now wrap sections.
// Kontaktuppgifter -> contact
code = code.replace('{/* Kontaktuppgifter */}', "{activeTab === 'contact' && (\n        <div className=\"space-y-8\">\n        {/* Kontaktuppgifter */}");
code = code.replace('        {/* Startsida Hero text & bild */}', "        </div>\n        )}\n\n        {activeTab === 'hero' && (\n        <div className=\"space-y-8\">\n        {/* Startsida Hero text & bild */}");
code = code.replace('        {/* Om mig / Om hantverket */}', "        </div>\n        )}\n\n        {activeTab === 'about' && (\n        <div className=\"space-y-8\">\n        {/* Om mig / Om hantverket */}");
code = code.replace('        {/* Frakt & leverans (Innehåll) */}', "        </div>\n        )}\n\n        {activeTab === 'info' && (\n        <div className=\"space-y-8\">\n        {/* Frakt & leverans (Innehåll) */}");
code = code.replace('        {/* Populära söktermer (Sökmodal) */}', "        </div>\n        )}\n\n        {activeTab === 'search' && (\n        <div className=\"space-y-8\">\n        {/* Populära söktermer (Sökmodal) */}");
code = code.replace('        {/* FOOTER SECTION */}', "        </div>\n        )}\n\n        {activeTab === 'footer' && (\n        <div className=\"space-y-8\">\n        {/* FOOTER SECTION */}");
code = code.replace('        {/* Submit Button */}', "        </div>\n        )}\n\n        {activeTab === 'orders' && (\n        <div className=\"space-y-8\">\n          <div className=\"bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 text-center space-y-3\">\n            <ShoppingBag className=\"w-8 h-8 text-[#6B8E7B] mx-auto opacity-50\" />\n            <h2 className=\"font-serif text-xl text-[#242D27] font-medium\">\n              Beställningar & meddelanden\n            </h2>\n            <p className=\"text-xs text-[#66726A]\">\n              Inga redigerbara inställningar för närvarande.\n            </p>\n          </div>\n        </div>\n        )}\n\n        {/* Submit Button */}");

// Close the flex container at the end
code = code.replace('</form>\n    </div>', '</form>\n        </div>\n      </div>\n    </div>');

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Done");
