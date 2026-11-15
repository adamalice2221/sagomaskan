import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchStorePaymentSettings,
  handleOrderConfirmationEmail,
  handleOrderStatusEmail,
  handleTestEmail,
  verifyAdminFirebaseToken
} from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevMode = process.argv.includes('--dev');
const app = express();
const httpServer = http.createServer(app);
const PORT = Number(process.env.PORT) || (isDevMode ? 3000 : 8080);
const distDir = path.join(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));

// Enkel minnesbaserad rate-limit per IP för publik orderbekräftelse
const confirmationRateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 25;
  const key = String(ip || 'unknown');
  const entry = confirmationRateMap.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    confirmationRateMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  if (confirmationRateMap.size > 500) {
    for (const [k, v] of confirmationRateMap.entries()) {
      if (now - v.windowStart > windowMs) confirmationRateMap.delete(k);
    }
  }
  return entry.count > maxRequests;
}

app.get('/api/email/status', async (_req, res) => {
  try {
    const settings = await fetchStorePaymentSettings();
    res.json({
      configured: Boolean(String(process.env.RESEND_API_KEY || '').trim()),
      hasCustomFrom: Boolean(String(process.env.RESEND_FROM_EMAIL || '').trim() || (settings.fromEmail && !settings.fromEmail.includes('onboarding@resend.dev'))),
      swishConfigured: Boolean(settings.swishNumber)
    });
  } catch (err) {
    res.status(500).json({ configured: false, message: err?.message || 'Statusfel' });
  }
});

app.post('/api/orders/confirmation', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ ok: false, code: 'RATE_LIMITED', message: 'För många förfrågningar. Vänta en stund.' });
  }

  try {
    const order = req.body?.order;
    const result = await handleOrderConfirmationEmail(order, req);
    const statusCode = result.ok ? 200 : result.status || 422;
    res.status(statusCode).json(result);
  } catch (err) {
    console.error('Fel i /api/orders/confirmation:', err);
    res.status(500).json({ ok: false, code: 'SERVER_ERROR', message: 'Kunde inte skicka orderbekräftelse.' });
  }
});

app.post('/api/orders/status-email', async (req, res) => {
  const authCheck = await verifyAdminFirebaseToken(req.headers.authorization);
  if (!authCheck.ok) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: authCheck.error });
  }

  try {
    const { order, status } = req.body || {};
    const result = await handleOrderStatusEmail(order, status, req);
    const statusCode = result.ok ? 200 : result.status || 422;
    res.status(statusCode).json(result);
  } catch (err) {
    console.error('Fel i /api/orders/status-email:', err);
    res.status(500).json({ ok: false, code: 'SERVER_ERROR', message: 'Kunde inte skicka statusmail.' });
  }
});

app.post('/api/orders/test-email', async (req, res) => {
  const authCheck = await verifyAdminFirebaseToken(req.headers.authorization);
  if (!authCheck.ok) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: authCheck.error });
  }

  try {
    const recipient = req.body?.to || authCheck.email;
    const result = await handleTestEmail(recipient, req);
    const statusCode = result.ok ? 200 : result.status || 422;
    res.status(statusCode).json(result);
  } catch (err) {
    console.error('Fel i /api/orders/test-email:', err);
    res.status(500).json({ ok: false, code: 'SERVER_ERROR', message: 'Kunde inte skicka testmail.' });
  }
});

if (isDevMode) {
  const { createServer: createViteServer } = await import('vite');
  const hmrDisabled = process.env.DISABLE_HMR === 'true';
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      ws: { server: httpServer },
      hmr: !hmrDisabled,
      watch: hmrDisabled ? null : {}
    },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  // Servera statiska filer från dist-mappen i produktion
  app.use(express.static(distDir));
  app.use((_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Hemsidan lyssnar på http://0.0.0.0:${PORT} (${isDevMode ? 'dev' : 'prod'})`);
});
