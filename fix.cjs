const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

const startMarker = '<form onSubmit={handleSubmit} noValidate className="space-y-8">';
let startIndex = code.indexOf(startMarker);
console.log("Start index: ", startIndex);

if (startIndex !== -1) {
    let sub = code.substring(startIndex, startIndex + 500);
    console.log(sub);
}
