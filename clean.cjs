const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

// The duplicates look like:
/*
        {activeTab === 'hero' && (
        <div className="space-y-8">
        </div>
        )}

        {activeTab === 'hero' && (
        <div className="space-y-8">
                </div>
        )}
*/
// Let's just remove empty or mostly empty activeTab blocks.
code = code.replace(/        \{activeTab === '\w+' && \(\n        <div className="space-y-8">\n\s*<\/div>\n        \)\}\n\n/g, '');

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Cleaned");
