const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

// I will find the layout wrapper and replace it entirely with the activeTab logic.
// Let's locate the form starting point and ending point.

const startMarker = '<form onSubmit={handleSubmit} noValidate className="space-y-8">';
let startIndex = code.indexOf(startMarker);
console.log(startIndex);

// I will output the file around this to see what went wrong
