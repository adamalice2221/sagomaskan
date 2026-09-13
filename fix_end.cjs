const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

// I will locate the start of FOOTER SECTION
let footerIndex = code.indexOf('{activeTab === \'footer\' && (');
if (footerIndex !== -1) {
   let submitIndex = code.indexOf('{/* Submit */}');
   if (submitIndex !== -1) {
       // We need to clean up everything from submitIndex to the end, well, up to the end of form.
       // Let's just fix the duplicated orders block.
       code = code.replace(/        <\/div>\n        \)}\n        {activeTab === 'orders' && \(\n        <div className="space-y-8">\n          <div className="bg-\[#FBF9F5\] border border-\[#E6DFD3\] rounded-3xl p-6 sm:p-8 text-center space-y-3\">\n            <ShoppingBag className="w-8 h-8 text-\[#6B8E7B\] mx-auto opacity-50\" \/>\n            <h2 className="font-serif text-xl text-\[#242D27\] font-medium\">\n              Beställningar & meddelanden\n            <\/h2>\n            <p className="text-xs text-\[#66726A\]\">\n              Inga redigerbara inställningar för närvarande.\n            <\/p>\n          <\/div>\n        <\/div>\n        \)}\n        \n        <\/div>\n        \)}\n        {activeTab === 'orders' && \(\n        <div className="space-y-8 animate-in fade-in duration-300\">\n          <div className="bg-\[#FBF9F5\] border border-\[#E6DFD3\] rounded-3xl p-6 sm:p-8 text-center space-y-3\">\n            <ShoppingBag className="w-8 h-8 text-\[#6B8E7B\] mx-auto opacity-50\" \/>\n            <h2 className="font-serif text-xl text-\[#242D27\] font-medium\">\n              Beställningar & meddelanden\n            <\/h2>\n            <p className="text-xs text-\[#66726A\]\">\n              Inga redigerbara inställningar för närvarande. Denna sektion är förberedd för framtida uppdateringar.\n            <\/p>\n          <\/div>\n        <\/div>\n        \)}/g, `        </div>
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
        )}`);

       fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
       console.log("Fixed duplicates");
   }
}
