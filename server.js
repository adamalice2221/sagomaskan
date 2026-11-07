const express = require('express');
const path = fontstyle = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servera statiska filer från dist-mappen
app.use(express.static(path.join(__dirname, 'dist')));

// Skicka index.html för alla andra anrop (viktigt för SPA/Vite)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hemsidan lyssnar på port ${PORT}`);
});
