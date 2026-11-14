import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const distDir = path.join(__dirname, 'dist');

// Servera statiska filer från dist-mappen
app.use(express.static(distDir));

// Skicka index.html för alla övriga anrop (SPA fallback)
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hemsidan lyssnar på http://0.0.0.0:${PORT}`);
});
