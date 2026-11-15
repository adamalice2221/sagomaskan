import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_EMAIL = 'sagomaskan@outlook.com';
const DEFAULT_FROM_EMAIL = 'Sagomaskan <onboarding@resend.dev>';

let cachedFirebaseConfig = null;
function getFirebaseConfig() {
  if (cachedFirebaseConfig) return cachedFirebaseConfig;
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8');
    cachedFirebaseConfig = JSON.parse(raw);
    return cachedFirebaseConfig;
  } catch (err) {
    console.warn('Kunde inte läsa firebase-applet-config.json:', err?.message || err);
    return null;
  }
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function formatPriceKr(amount) {
  const num = Number(amount) || 0;
  return `${Math.round(num)} kr`;
}

export function formatOrderDateSv(isoString) {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    return d.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

export function resolveOrderTrackingInfo(rawTrackingVal) {
  const cleaned = String(rawTrackingVal || '').trim();
  if (!cleaned) {
    return {
      hasValue: false,
      raw: '',
      href: '',
      displayText: ''
    };
  }
  const isHttpUrl = /^https?:\/\//i.test(cleaned);
  const isDomainLike =
    !isHttpUrl &&
    /^(www\.|[a-z0-9-]+\.(se|com|nu|net|org|io|eu|dk|no|fi)(\/|$))/i.test(cleaned);
  if (isHttpUrl) {
    return {
      hasValue: true,
      raw: cleaned,
      href: cleaned,
      displayText: cleaned
    };
  }
  if (isDomainLike) {
    return {
      hasValue: true,
      raw: cleaned,
      href: `https://${cleaned}`,
      displayText: `https://${cleaned}`
    };
  }
  return {
    hasValue: true,
    raw: cleaned,
    href: `https://portal.postnord.com/tracking/details/${encodeURIComponent(cleaned)}`,
    displayText: cleaned
  };
}

function decodeFirestoreValue(val) {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const out = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(decodeFirestoreValue);
  }
  return undefined;
}

export async function fetchStorePaymentSettings() {
  const envDefaults = {
    swishNumber: String(process.env.SWISH_NUMBER || '').trim(),
    swishRecipient: String(process.env.SWISH_RECIPIENT_NAME || 'Sagomaskan').trim() || 'Sagomaskan',
    replyToEmail: String(process.env.STORE_OWNER_EMAIL || ADMIN_EMAIL).trim() || ADMIN_EMAIL,
    fromEmail: String(process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL).trim() || DEFAULT_FROM_EMAIL,
    sendOwnerOrderCopy: false
  };

  const cfg = getFirebaseConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId) {
    return envDefaults;
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/${encodeURIComponent(cfg.firestoreDatabaseId)}/documents/settings/storefront`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return envDefaults;
    const json = await res.json();
    const ps = decodeFirestoreValue(json?.fields?.paymentSettings);
    if (!ps || typeof ps !== 'object') return envDefaults;

    return {
      swishNumber: String(ps.swishNumber || envDefaults.swishNumber || '').trim(),
      swishRecipient: String(ps.swishRecipient || envDefaults.swishRecipient || 'Sagomaskan').trim() || 'Sagomaskan',
      replyToEmail: isValidEmail(ps.replyToEmail) ? String(ps.replyToEmail).trim() : envDefaults.replyToEmail,
      fromEmail: String(process.env.RESEND_FROM_EMAIL || ps.fromEmail || DEFAULT_FROM_EMAIL).trim() || DEFAULT_FROM_EMAIL,
      sendOwnerOrderCopy: Boolean(ps.sendOwnerOrderCopy)
    };
  } catch (err) {
    console.warn('Kunde inte hämta settings/storefront från Firestore REST:', err?.message || err);
    return envDefaults;
  }
}

export async function verifyAdminFirebaseToken(authHeader) {
  const match = String(authHeader || '').match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, error: 'Saknar administratörs-token.' };
  }
  const idToken = match[1].trim();
  const cfg = getFirebaseConfig();
  if (!cfg?.apiKey) {
    return { ok: false, error: 'Firebase-konfiguration saknas på servern.' };
  }

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    if (!resp.ok) {
      return { ok: false, error: 'Ogiltig eller utgången administratörssession.' };
    }
    const data = await resp.json();
    const user = Array.isArray(data?.users) ? data.users[0] : null;
    if (!user || !user.email) {
      return { ok: false, error: 'Kunde inte verifiera administratörskonto.' };
    }
    if (String(user.email).toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return { ok: false, error: 'Endast administratörskontot har behörighet att skicka ordermail.' };
    }
    if (!user.emailVerified) {
      return { ok: false, error: 'Administratörens e-postadress är inte verifierad.' };
    }
    return { ok: true, email: user.email };
  } catch (err) {
    console.error('Fel vid verifiering av admin-token:', err);
    return { ok: false, error: 'Kunde inte verifiera administratörsbehörighet.' };
  }
}

function getAppBaseUrl(req) {
  if (process.env.APP_URL && /^https?:\/\//i.test(process.env.APP_URL)) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  if (req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    if (host) return `${proto}://${host}`.replace(/\/+$/, '');
  }
  return 'https://sagomaskan.se';
}

function buildItemsTableHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map((item) => {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = Number(item.price) || 0;
      const lineTotal = item.lineTotal !== undefined ? Number(item.lineTotal) : unitPrice * qty;
      const pdfTag = item.isDigitalPdf
        ? ' <span style="display:inline-block; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-size:11px; padding:1px 7px; border-radius:999px; font-weight:600; margin-left:4px;">PDF-mönster</span>'
        : '';
      return `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #ece8df; font-size:14px; color:#171717;">
            <strong>${qty}×</strong> ${escapeHtml(item.name || 'Handvirkat alster')}${pdfTag}
            <div style="font-size:12px; color:#737373; margin-top:2px;">${formatPriceKr(unitPrice)} / st</div>
          </td>
          <td style="padding:10px 0; border-bottom:1px solid #ece8df; font-size:14px; font-weight:600; color:#171717; text-align:right; white-space:nowrap; vertical-align:top;">
            ${formatPriceKr(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join('');

  const discountRow =
    order.discountCode && Number(order.discountAmount) > 0
      ? `
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#166534;">Rabattkod (${escapeHtml(order.discountCode)})</td>
          <td style="padding:8px 0; font-size:13px; color:#166534; font-weight:600; text-align:right;">−${formatPriceKr(order.discountAmount)}</td>
        </tr>
      `
      : '';

  const giftBoxRow =
    order.giftBox && order.giftBox.type && order.giftBox.type !== 'none'
      ? `
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#2f3e3b;">
            Presentask: ${escapeHtml(order.giftBox.label || order.giftBox.type)}
            ${
              order.giftBox.greeting
                ? `<div style="margin-top:4px; padding:6px 10px; background:#F4F2EC; border-radius:6px; font-size:12px; color:#3d3a36;"><em>Hälsning: "${escapeHtml(order.giftBox.greeting)}"</em></div>`
                : ''
            }
          </td>
          <td style="padding:8px 0; font-size:13px; color:#171717; font-weight:600; text-align:right; vertical-align:top;">
            +${formatPriceKr(order.giftBox.price || 0)}
          </td>
        </tr>
      `
      : '';

  const shippingFee = Number(order.shippingFee) || 0;
  const shippingText = order.isDigitalOnly
    ? 'Digital leverans (0 kr)'
    : shippingFee === 0
    ? 'Fri frakt (0 kr)'
    : formatPriceKr(shippingFee);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${rows}
      ${discountRow}
      ${giftBoxRow}
      <tr>
        <td style="padding:8px 0; font-size:13px; color:#525252;">Frakt</td>
        <td style="padding:8px 0; font-size:13px; color:${shippingFee === 0 ? '#166534' : '#171717'}; font-weight:600; text-align:right;">${escapeHtml(shippingText)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0 0; border-top:2px solid #2f3e3b; font-size:16px; font-weight:700; color:#171717;">Totalt</td>
        <td style="padding:12px 0 0 0; border-top:2px solid #2f3e3b; font-size:16px; font-weight:700; color:#171717; text-align:right;">${formatPriceKr(order.totalPrice)}</td>
      </tr>
    </table>
  `;
}

function buildSwishPaymentBoxHtml(order, settings, { compact = false } = {}) {
  const totalAmount = formatPriceKr(order.totalPrice);
  const orderNumber = escapeHtml(order.orderNumber || '#SM');
  const swishNumber = settings.swishNumber ? escapeHtml(settings.swishNumber) : '';
  const swishRecipient = escapeHtml(settings.swishRecipient || 'Sagomaskan');

  if (!swishNumber) {
    return `
      <div style="background:#fdf8f3; border:1px solid #ebd9c8; border-radius:12px; padding:18px; margin:20px 0;">
        <div style="font-size:14px; font-weight:700; color:#2f3e3b; margin-bottom:6px;">Betalning via Swish</div>
        <p style="margin:0; font-size:13px; line-height:1.55; color:#525252;">
          Sagomaskan drivs som hantverks- och hobbyverksamhet. Vi har mottagit din beställning <strong>${orderNumber}</strong> (${totalAmount}) och återkommer inom kort med Swish-nummer så att du kan genomföra betalningen.
        </p>
      </div>
    `;
  }

  return `
    <div style="background:#f3f7f4; border:1px solid #b9d3c3; border-radius:12px; padding:20px; margin:20px 0;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#2f3e3b; font-weight:700; margin-bottom:6px;">
        ${compact ? 'Swish-uppgifter för din order' : 'Betala enkelt med Swish'}
      </div>
      <div style="font-size:16px; font-weight:700; color:#171717; margin-bottom:12px;">
        Swisha ${escapeHtml(totalAmount)} till ${swishRecipient}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; background:#ffffff; border-radius:10px; border:1px solid #dce7e0;">
        <tr>
          <td style="padding:10px 14px; border-bottom:1px solid #eef2ef; font-size:13px; color:#525252;">Swish-nummer</td>
          <td style="padding:10px 14px; border-bottom:1px solid #eef2ef; font-size:15px; font-weight:700; color:#171717; text-align:right; letter-spacing:0.03em;">${swishNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px; border-bottom:1px solid #eef2ef; font-size:13px; color:#525252;">Mottagare</td>
          <td style="padding:10px 14px; border-bottom:1px solid #eef2ef; font-size:14px; font-weight:600; color:#171717; text-align:right;">${swishRecipient}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px; border-bottom:1px solid #eef2ef; font-size:13px; color:#525252;">Belopp</td>
          <td style="padding:10px 14px; border-bottom:1px solid #eef2ef; font-size:15px; font-weight:700; color:#2f3e3b; text-align:right;">${escapeHtml(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px; font-size:13px; color:#525252;">Meddelande i Swish</td>
          <td style="padding:10px 14px; font-size:14px; font-weight:700; color:#171717; text-align:right;">${orderNumber}</td>
        </tr>
      </table>
      <p style="margin:12px 0 0 0; font-size:12px; line-height:1.5; color:#3d4d48;">
        Viktigt: Ange <strong>${orderNumber}</strong> som meddelande i Swish så att vi snabbt kan matcha din betalning.
        ${
          order.hasDigitalItems
            ? ' När din betalning är verifierad låses dina digitala PDF-mönster upp direkt under Mina sidor (du får ett nytt mail när de är klara).'
            : ' Så snart betalningen har kommit in påbörjas tillverkning/packning av din order.'
        }
      </p>
    </div>
  `;
}

function buildTrackingBoxHtml(trackingMeta) {
  if (!trackingMeta?.hasValue) return '';
  return `
    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px; margin:20px 0;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#1e3a8a; font-weight:700; margin-bottom:6px;">
        Spårning av ditt paket
      </div>
      <div style="font-size:15px; font-weight:700; color:#0f172a; margin-bottom:6px;">
        Ditt paket är på väg!
      </div>
      <p style="margin:0 0 14px 0; font-size:13px; color:#334155; line-height:1.5; word-break:break-word;">
        Spårningsnummer / Länk: <strong style="color:#0f172a;">${escapeHtml(trackingMeta.displayText)}</strong>
      </p>
      <a href="${escapeHtml(trackingMeta.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#1e3a8a; color:#ffffff; text-decoration:none; font-size:13px; font-weight:600; padding:11px 22px; border-radius:999px;">
        Spåra ditt paket &rarr;
      </a>
    </div>
  `;
}

function wrapEmailLayout({ heading, preheader, badgeText, badgeBg = '#F4F2EC', badgeColor = '#2f3e3b', bodyHtml, appUrl }) {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F2EC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#171717;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader || heading)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F4F2EC; padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e7e3da; box-shadow:0 8px 30px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:#2f3e3b; padding:26px 28px; text-align:center;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:24px; letter-spacing:0.18em; color:#ffffff; font-weight:500;">SAGOMASKAN</div>
              <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#cbd5d1; margin-top:6px;">Handvirkade alster skapade med kärlek</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 22px;">
              ${
                badgeText
                  ? `<div style="display:inline-block; background:${badgeBg}; color:${badgeColor}; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:5px 12px; border-radius:999px; margin-bottom:14px;">${escapeHtml(badgeText)}</div>`
                  : ''
              }
              <h1 style="margin:0 0 12px 0; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:500; color:#171717; line-height:1.3;">
                ${escapeHtml(heading)}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#FBFBF9; border-top:1px solid #ece8df; padding:18px 28px; text-align:center; font-size:12px; color:#737373; line-height:1.6;">
              <div>Du kan alltid följa din order under <a href="${escapeHtml(appUrl)}/#konto" style="color:#2f3e3b; font-weight:600; text-decoration:underline;">Mina sidor</a>.</div>
              <div style="margin-top:4px;">Frågor? Svara på detta mail eller besök <a href="${escapeHtml(appUrl)}/#kundservice" style="color:#2f3e3b; text-decoration:underline;">Kundservice</a>.</div>
              <div style="margin-top:8px; color:#a3a3a3;">Sagomaskan &middot; Handvirkat hantverk</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildDeliveryAddressHtml(order) {
  const cust = order.customer || {};
  const addressDisplay =
    cust.address ||
    (order.isDigitalOnly ? 'Digital leverans (PDF-mönster via Mina sidor)' : 'Ej angivet');
  return `
    <div style="background:#FBFBF9; border:1px solid #ece8df; border-radius:12px; padding:16px; margin-top:18px; font-size:13px; color:#525252; line-height:1.6;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#737373; font-weight:700; margin-bottom:6px;">Kund &amp; Leveransuppgifter</div>
      <div><strong style="color:#171717;">${escapeHtml(cust.name || 'Kund')}</strong></div>
      <div>${escapeHtml(addressDisplay)}</div>
      ${cust.phone ? `<div>Telefon: ${escapeHtml(cust.phone)}</div>` : ''}
      ${
        cust.message
          ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #e5e0d5;"><strong>Ditt meddelande:</strong> ${escapeHtml(cust.message)}</div>`
          : ''
      }
    </div>
  `;
}

export function buildOrderConfirmationEmail(order, settings, appUrl) {
  const custName = escapeHtml(order.customer?.name || 'Kund');
  const orderNumber = escapeHtml(order.orderNumber || '#SM');
  const dateStr = escapeHtml(formatOrderDateSv(order.createdAt));

  const introText = order.isDigitalOnly
    ? `Tack för din beställning! Vi har tagit emot din order <strong>${orderNumber}</strong>${dateStr ? ` (${dateStr})` : ''}. När du har genomfört Swish-betalningen nedan och vi har verifierat den aktiveras nedladdningen av ditt digitala PDF-mönster direkt under <em>Mina sidor</em>.`
    : `Tack för din beställning! Vi har tagit emot din order <strong>${orderNumber}</strong>${dateStr ? ` (${dateStr})` : ''}. Nedan hittar du din orderbekräftelse samt uppgifter för att betala med Swish.`;

  const bodyHtml = `
    <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6; color:#404040;">
      Hej ${custName},
    </p>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#525252;">
      ${introText}
    </p>
    ${buildSwishPaymentBoxHtml(order, settings)}
    <div style="margin-top:22px;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#737373; font-weight:700; margin-bottom:8px;">Ordersammanfattning (${orderNumber})</div>
      ${buildItemsTableHtml(order)}
    </div>
    ${buildDeliveryAddressHtml(order)}
    <div style="text-align:center; margin-top:24px;">
      <a href="${escapeHtml(appUrl)}/#konto" style="display:inline-block; background:#2f3e3b; color:#ffffff; text-decoration:none; font-size:13px; font-weight:600; padding:12px 24px; border-radius:999px;">
        Följ din order på Mina sidor
      </a>
    </div>
  `;

  const swishPlain = settings.swishNumber
    ? `\nSWISH-BETALNING:\nSwish-nummer: ${settings.swishNumber}\nMottagare: ${settings.swishRecipient}\nBelopp: ${formatPriceKr(order.totalPrice)}\nMeddelande i Swish: ${order.orderNumber}\n`
    : `\nSWISH-BETALNING:\nSwish-instruktioner skickas inom kort.\n`;

  const itemsPlain = (order.items || [])
    .map((it) => `- ${it.quantity || 1}x ${it.name}: ${formatPriceKr(it.lineTotal ?? (Number(it.price) || 0) * (it.quantity || 1))}`)
    .join('\n');

  const text = `Hej ${order.customer?.name || 'Kund'},

Tack för din beställning ${order.orderNumber}!
${swishPlain}
BESTÄLLDA ALSTER:
${itemsPlain}
Frakt: ${order.isDigitalOnly ? 'Digital leverans (0 kr)' : Number(order.shippingFee) === 0 ? 'Fri frakt (0 kr)' : formatPriceKr(order.shippingFee)}
Totalt: ${formatPriceKr(order.totalPrice)}

Följ din order på: ${appUrl}/#konto

Vänliga hälsningar,
Sagomaskan`;

  return {
    subject: `Orderbekräftelse ${order.orderNumber || ''} – Sagomaskan (Betala med Swish)`,
    html: wrapEmailLayout({
      heading: `Tack för din beställning ${order.orderNumber || ''}!`,
      preheader: `Orderbekräftelse och Swish-uppgifter för ${order.orderNumber || ''}`,
      badgeText: 'Orderbekräftelse',
      bodyHtml,
      appUrl
    }),
    text
  };
}

export function buildOrderStatusEmail(order, status, settings, appUrl) {
  const custName = escapeHtml(order.customer?.name || 'Kund');
  const orderNumber = escapeHtml(order.orderNumber || '#SM');
  const hasDigital = Boolean(order.hasDigitalItems);
  const isDigitalOnly = Boolean(order.isDigitalOnly);
  const trackingMeta = resolveOrderTrackingInfo(order.trackingUrl || order.trackingNumber || '');

  let subject = `Uppdatering om din order ${order.orderNumber || ''} – Sagomaskan`;
  let badgeText = 'Orderuppdatering';
  let badgeBg = '#F4F2EC';
  let badgeColor = '#2f3e3b';
  let heading = `Uppdatering för order ${order.orderNumber || ''}`;
  let leadHtml = '';
  let extraBoxHtml = '';
  let ctaHtml = `
    <div style="text-align:center; margin-top:24px;">
      <a href="${escapeHtml(appUrl)}/#konto" style="display:inline-block; background:#2f3e3b; color:#ffffff; text-decoration:none; font-size:13px; font-weight:600; padding:12px 24px; border-radius:999px;">
        Visa order på Mina sidor
      </a>
    </div>
  `;

  switch (status) {
    case 'new':
      subject = `Orderstatus: Mottagen (${order.orderNumber || ''}) – Sagomaskan`;
      badgeText = '1. Mottagen';
      badgeBg = '#eff6ff';
      badgeColor = '#1e3a8a';
      heading = `Din beställning ${order.orderNumber || ''} är mottagen`;
      leadHtml = `Vi vill meddela att din beställning <strong>${orderNumber}</strong> är mottagen och registrerad hos oss. Om du ännu inte hunnit genomföra din Swish-betalning hittar du betalningsuppgifterna nedan.`;
      if (!order.paymentVerified) {
        extraBoxHtml = buildSwishPaymentBoxHtml(order, settings, { compact: true });
      }
      break;

    case 'processing':
      subject = `Din beställning ${order.orderNumber || ''} tillverkas / packas – Sagomaskan`;
      badgeText = '2. Tillverkas / Packas';
      badgeBg = '#fffbeb';
      badgeColor = '#92400e';
      heading = `Din beställning ${order.orderNumber || ''} tillverkas / packas nu`;
      leadHtml = `Goda nyheter! Din beställning <strong>${orderNumber}</strong> håller nu på att tillverkas eller packas omsorgsfullt av Sagomaskan. Du får ett nytt mail med spårningslänk så snart paketet har skickats.`;
      break;

    case 'shipped':
      subject = `Din beställning ${order.orderNumber || ''} har skickats! – Sagomaskan`;
      badgeText = '3. Skickad';
      badgeBg = '#eff6ff';
      badgeColor = '#1e3a8a';
      heading = `Din beställning ${order.orderNumber || ''} har skickats!`;
      leadHtml = trackingMeta.hasValue
        ? `Ditt paket från Sagomaskan (order <strong>${orderNumber}</strong>) har nu lämnat oss och är på väg till dig! Använd spårningslänken nedan för att följa leveransen.`
        : `Ditt paket från Sagomaskan (order <strong>${orderNumber}</strong>) har nu skickats och är på väg till dig!`;
      extraBoxHtml = buildTrackingBoxHtml(trackingMeta);
      break;

    case 'completed':
      if (hasDigital && (order.paymentVerified || isDigitalOnly)) {
        subject = `Betalning godkänd – Ditt PDF-mönster är klart (${order.orderNumber || ''})`;
        badgeText = 'PDF-mönster upplåst';
        badgeBg = '#ecfdf5';
        badgeColor = '#065f46';
        heading = `Ditt digitala PDF-mönster är redo!`;
        leadHtml = `Din Swish-betalning för order <strong>${orderNumber}</strong> är nu verifierad och dina digitala PDF-mönster har låsts upp. Logga in på <em>Mina sidor</em> för att ladda ner ditt mönster direkt.`;
        ctaHtml = `
          <div style="text-align:center; margin-top:24px;">
            <a href="${escapeHtml(appUrl)}/#konto" style="display:inline-block; background:#2f3e3b; color:#ffffff; text-decoration:none; font-size:13px; font-weight:600; padding:12px 24px; border-radius:999px;">
              Ladda ner PDF-mönster på Mina sidor
            </a>
          </div>
        `;
      } else {
        subject = `Din beställning ${order.orderNumber || ''} är levererad – Sagomaskan`;
        badgeText = '4. Levererad';
        badgeBg = '#ecfdf5';
        badgeColor = '#065f46';
        heading = `Din beställning ${order.orderNumber || ''} är levererad!`;
        leadHtml = `Din beställning <strong>${orderNumber}</strong> har nu markerats som levererad. Vi hoppas att du kommer älska dina handvirkade alster från Sagomaskan!`;
        if (trackingMeta.hasValue) {
          extraBoxHtml = buildTrackingBoxHtml(trackingMeta);
        }
      }
      break;

    case 'cancelled':
      subject = `Order ${order.orderNumber || ''} har avbrutits – Sagomaskan`;
      badgeText = 'Avbruten';
      badgeBg = '#fef2f2';
      badgeColor = '#991b1b';
      heading = `Din beställning ${order.orderNumber || ''} har avbrutits`;
      leadHtml = `Din beställning <strong>${orderNumber}</strong> har markerats som avbruten. Om du har några frågor eller om detta skett av misstag är du varmt välkommen att svara på detta mail.`;
      break;

    default:
      break;
  }

  const bodyHtml = `
    <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6; color:#404040;">
      Hej ${custName},
    </p>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#525252;">
      ${leadHtml}
    </p>
    ${extraBoxHtml}
    <div style="margin-top:22px;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#737373; font-weight:700; margin-bottom:8px;">Ordersammanfattning (${orderNumber})</div>
      ${buildItemsTableHtml(order)}
    </div>
    ${buildDeliveryAddressHtml(order)}
    ${ctaHtml}
  `;

  const trackingPlain = trackingMeta.hasValue
    ? `\nSPÅRNINGSLÄNK / KOLLI-ID:\n${trackingMeta.displayText}\nSpåra paketet här: ${trackingMeta.href}\n`
    : '';

  const text = `Hej ${order.customer?.name || 'Kund'},

Statusuppdatering för din order ${order.orderNumber}: ${badgeText}
${trackingPlain}
Följ din order på: ${appUrl}/#konto

Vänliga hälsningar,
Sagomaskan`;

  return {
    subject,
    html: wrapEmailLayout({
      heading,
      preheader: subject,
      badgeText,
      badgeBg,
      badgeColor,
      bodyHtml,
      appUrl
    }),
    text
  };
}

export async function sendResendEmail({ to, subject, html, text, from, replyTo }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return {
      ok: false,
      code: 'MISSING_RESEND_API_KEY',
      message: 'RESEND_API_KEY saknas i serverns miljövariabler (Secrets).'
    };
  }

  const resend = new Resend(apiKey);
  try {
    const payload = {
      from: from || DEFAULT_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    };
    if (replyTo && isValidEmail(replyTo)) {
      payload.replyTo = replyTo;
    }

    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error('Resend API-fel:', error);
      return {
        ok: false,
        code: error.name || 'RESEND_ERROR',
        message: error.message || 'Resend kunde inte skicka e-postmeddelandet.'
      };
    }

    return {
      ok: true,
      id: data?.id || null
    };
  } catch (err) {
    console.error('Oväntat fel vid Resend-utskick:', err);
    return {
      ok: false,
      code: 'RESEND_EXCEPTION',
      message: err?.message || 'Kunde inte kontakta Resend.'
    };
  }
}

export async function handleOrderConfirmationEmail(order, req) {
  if (!order || typeof order !== 'object' || !isValidEmail(order.customer?.email)) {
    return { ok: false, status: 400, code: 'INVALID_ORDER', message: 'Ogiltig order eller kundens e-postadress saknas.' };
  }
  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0 || items.length > 50) {
    return { ok: false, status: 400, code: 'INVALID_ITEMS', message: 'Ordern måste innehålla minst en produkt.' };
  }

  const settings = await fetchStorePaymentSettings();
  const appUrl = getAppBaseUrl(req);
  const emailContent = buildOrderConfirmationEmail(order, settings, appUrl);

  const customerResult = await sendResendEmail({
    to: order.customer.email.trim(),
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    from: settings.fromEmail,
    replyTo: settings.replyToEmail
  });

  if (customerResult.ok && settings.sendOwnerOrderCopy && isValidEmail(settings.replyToEmail)) {
    const ownerAddress = settings.replyToEmail.trim();
    if (ownerAddress.toLowerCase() !== order.customer.email.trim().toLowerCase()) {
      await sendResendEmail({
        to: ownerAddress,
        subject: `[Ny beställning] ${order.orderNumber || ''} – ${formatPriceKr(order.totalPrice)} (${order.customer?.name || 'Kund'})`,
        html: emailContent.html,
        text: emailContent.text,
        from: settings.fromEmail,
        replyTo: order.customer.email.trim()
      });
    }
  }

  return customerResult;
}

export async function handleOrderStatusEmail(order, status, req) {
  if (!order || typeof order !== 'object' || !isValidEmail(order.customer?.email)) {
    return { ok: false, status: 400, code: 'INVALID_ORDER', message: 'Kundens e-postadress saknas på ordern.' };
  }
  const allowedStatuses = new Set(['new', 'processing', 'shipped', 'completed', 'cancelled']);
  if (!allowedStatuses.has(status)) {
    return { ok: false, status: 400, code: 'INVALID_STATUS', message: 'Ogiltig orderstatus.' };
  }

  const settings = await fetchStorePaymentSettings();
  const appUrl = getAppBaseUrl(req);
  const emailContent = buildOrderStatusEmail(order, status, settings, appUrl);

  return sendResendEmail({
    to: order.customer.email.trim(),
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    from: settings.fromEmail,
    replyTo: settings.replyToEmail
  });
}

export async function handleTestEmail(recipientEmail, req) {
  if (!isValidEmail(recipientEmail)) {
    return { ok: false, status: 400, code: 'INVALID_EMAIL', message: 'Ogiltig e-postadress för testmail.' };
  }
  const settings = await fetchStorePaymentSettings();
  const appUrl = getAppBaseUrl(req);
  const sampleOrder = {
    orderNumber: '#SM-TEST',
    createdAt: new Date().toISOString(),
    totalPrice: 349,
    shippingFee: 59,
    hasDigitalItems: false,
    isDigitalOnly: false,
    customer: {
      name: 'Testkund',
      email: recipientEmail.trim(),
      phone: '070-000 00 00',
      address: 'Sagovägen 1, 123 45 Stockholm'
    },
    items: [
      { name: 'Handvirkad Sagokanin (Test)', price: 290, quantity: 1, lineTotal: 290 }
    ]
  };
  const emailContent = buildOrderConfirmationEmail(sampleOrder, settings, appUrl);

  return sendResendEmail({
    to: recipientEmail.trim(),
    subject: `[Testmail] ${emailContent.subject}`,
    html: emailContent.html,
    text: emailContent.text,
    from: settings.fromEmail,
    replyTo: settings.replyToEmail
  });
}
