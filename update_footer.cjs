const fs = require('fs');
let code = fs.readFileSync('src/components/Footer.tsx', 'utf-8');

code = code.replace(
    /            <div className="inline-block">\n              <span className="font-serif text-2xl tracking-\[0\.2em\] uppercase font-medium">\n                \{brandName\}\n              <\/span>\n              \{tagline && \(\n                <p className="text-\[10px\] tracking-\[0\.25em\] text-\[#66726A\] uppercase">\n                  \{tagline\}\n                <\/p>\n              \)\}\n            <\/div>/,
    `            <div className="inline-block">
              {settings.logoImageUrl ? (
                <img src={settings.logoImageUrl} alt={brandName} className="h-10 sm:h-12 object-contain mb-1" />
              ) : (
                <span className="font-serif text-2xl tracking-[0.2em] uppercase font-medium block">
                  {brandName}
                </span>
              )}
              {tagline && (
                <p className="text-[10px] tracking-[0.25em] text-[#66726A] uppercase">
                  {settings.logoTagline ?? tagline}
                </p>
              )}
            </div>`
);

fs.writeFileSync('src/components/Footer.tsx', code);
console.log("Updated Footer.tsx");
