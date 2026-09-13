const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

code = code.replace('        {/* Frakt & leverans */}', `        </div>
        )}

        {activeTab === 'info' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Frakt & leverans */}`);

code = code.replace('        {/* Populära söktermer */}', `        </div>
        )}

        {activeTab === 'search' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Populära söktermer */}`);

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Fixed tabs");
