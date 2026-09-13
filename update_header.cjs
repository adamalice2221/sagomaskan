const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');

// The brand block in desktop:
/*
          <button
            id="brand-logo"
            onClick={() => handleNavClick('home')}
            className="group flex flex-col items-center lg:items-start text-left focus:outline-none"
          >
            <span className="font-serif text-2xl sm:text-3xl font-medium tracking-[0.2em] text-[#242D27] uppercase transition-colors group-hover:text-[#6B8E7B]">
              SAGOMASKAN
            </span>
            <span className="text-[10px] tracking-[0.28em] text-[#66726A] font-medium uppercase -mt-0.5">
              VIRKADE PRODUKTER
            </span>
          </button>
*/

code = code.replace(
    /          <button\n            id="brand-logo"\n            onClick=\{\(\) => handleNavClick\('home'\)\}\n            className="group flex flex-col items-center lg:items-start text-left focus:outline-none"\n          >\n            <span className="font-serif text-2xl sm:text-3xl font-medium tracking-\[0\.2em\] text-\[#242D27\] uppercase transition-colors group-hover:text-\[#6B8E7B\]">\n              SAGOMASKAN\n            <\/span>\n            <span className="text-\[10px\] tracking-\[0\.28em\] text-\[#66726A\] font-medium uppercase -mt-0\.5">\n              VIRKADE PRODUKTER\n            <\/span>\n          <\/button>/,
    `          <button
            id="brand-logo"
            onClick={() => handleNavClick('home')}
            className="group flex flex-col items-center lg:items-start text-left focus:outline-none"
          >
            {settings?.logoImageUrl ? (
              <img src={settings.logoImageUrl} alt="Sagomaskan Logo" className="h-10 sm:h-12 object-contain" />
            ) : (
              <span className="font-serif text-2xl sm:text-3xl font-medium tracking-[0.2em] text-[#242D27] uppercase transition-colors group-hover:text-[#6B8E7B]">
                SAGOMASKAN
              </span>
            )}
            <span className="text-[10px] tracking-[0.28em] text-[#66726A] font-medium uppercase -mt-0.5">
              {settings?.logoTagline ?? 'VIRKADE PRODUKTER'}
            </span>
          </button>`
);

// The brand block in mobile drawer:
/*
              {/* Drawer Header *\/}
              <div className="flex items-center justify-between pb-6 border-b border-[#E6DFD3]">
                <div className="text-left">
                  <span className="font-serif text-xl font-medium tracking-[0.18em] text-[#242D27] uppercase">
                    SAGOMASKAN
                  </span>
                  <p className="text-[9px] tracking-[0.22em] text-[#66726A] uppercase">
                    VIRKADE PRODUKTER
                  </p>
                </div>
*/

code = code.replace(
    /                <div className="text-left">\n                  <span className="font-serif text-xl font-medium tracking-\[0\.18em\] text-\[#242D27\] uppercase">\n                    SAGOMASKAN\n                  <\/span>\n                  <p className="text-\[9px\] tracking-\[0\.22em\] text-\[#66726A\] uppercase">\n                    VIRKADE PRODUKTER\n                  <\/p>\n                <\/div>/,
    `                <div className="text-left">
                  {settings?.logoImageUrl ? (
                    <img src={settings.logoImageUrl} alt="Sagomaskan Logo" className="h-8 object-contain mb-1" />
                  ) : (
                    <span className="font-serif text-xl font-medium tracking-[0.18em] text-[#242D27] uppercase block">
                      SAGOMASKAN
                    </span>
                  )}
                  <p className="text-[9px] tracking-[0.22em] text-[#66726A] uppercase">
                    {settings?.logoTagline ?? 'VIRKADE PRODUKTER'}
                  </p>
                </div>`
);

fs.writeFileSync('src/components/Header.tsx', code);
console.log("Updated Header.tsx");
