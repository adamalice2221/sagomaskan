const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

if (!code.includes('Base64-varning')) {
    const warningUI = `
      {products.some(p => p.images?.some(i => i.startsWith('data:image')) || p.image?.startsWith('data:image')) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Bilder behöver uppdateras</h3>
            <p className="text-xs text-yellow-700 mt-1 mb-2">
              Följande produkter använder gamla inbäddade bilder (Base64) som kan göra att databasen blir full. Vänligen redigera dessa produkter, ta bort bilden och ladda upp den på nytt:
            </p>
            <ul className="list-disc pl-5 text-xs text-yellow-700 space-y-1">
              {products.filter(p => p.images?.some(i => i.startsWith('data:image')) || p.image?.startsWith('data:image')).map(p => (
                <li key={p.id}><strong>{p.name}</strong></li>
              ))}
            </ul>
          </div>
        </div>
      )}
`;
    
    // insert right after {/* 2. Products List */}
    code = code.replace(
        "{/* 2. Products List */}\n      {currentTab === 'products' && (",
        "{/* 2. Products List */}\n      {currentTab === 'products' && (\n        <>\n" + warningUI
    );
    // and close the fragment
    code = code.replace(
        "          </div>\n        </div>\n      )}",
        "          </div>\n        </div>\n        </>\n      )}"
    );
    
    fs.writeFileSync('src/pages/AdminPage.tsx', code);
    console.log("Added Base64 warning UI");
}
