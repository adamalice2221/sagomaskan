import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Servera statiska filer från dist-mappen
app.use(express.static(path.join(__dirname, 'dist')));

// Skicka index.html för alla anrop
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hemsidan lyssnar på port ${PORT}`);
});
