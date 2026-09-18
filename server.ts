import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Allowed administrator email
const ALLOWED_ADMIN_EMAIL = "adamalice2221@gmail.com";

// Read Firebase web API key from applet config for token verification
let firebaseApiKey = "";
try {
  const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(cfgPath)) {
    const parsed = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    firebaseApiKey = parsed.apiKey || "";
  }
} catch (e) {
  console.error("[FirebaseConfig] Failed to load firebase-applet-config.json:", e);
}

// Verify Firebase Auth ID-token against Google's Firebase Identity Toolkit
async function verifyAdminAuth(req: Request): Promise<{ ok: boolean; email?: string; error?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "Auktorisering krävs. Vänligen logga in som administratör." };
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    return { ok: false, error: "Auktoriseringstoken saknas." };
  }

  if (!firebaseApiKey) {
    return { ok: false, error: "Serverkonfiguration saknas: Firebase API-nyckel kunde inte läsas." };
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });

    if (!res.ok) {
      return { ok: false, error: "Ogiltig eller utgången inloggningssession. Logga in igen." };
    }

    const data = (await res.json()) as any;
    const user = data.users?.[0];

    if (!user || !user.email) {
      return { ok: false, error: "Kunde inte hitta användaruppgifter för den angivna inloggningen." };
    }

    if (user.email !== ALLOWED_ADMIN_EMAIL) {
      console.warn(`[Auth Warning] Unauthorized upload attempt by: ${user.email}`);
      return { ok: false, error: `Behörighet saknas. Endast ${ALLOWED_ADMIN_EMAIL} får ladda upp bilder.` };
    }

    return { ok: true, email: user.email };
  } catch (err: any) {
    console.error("[verifyAdminAuth Error]:", err);
    return { ok: false, error: "Kunde inte verifiera admin-behörighet mot Firebase Identity Toolkit." };
  }
}

// Lazy Supabase client initialization (never exposed to client)
let supabaseClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL eller SUPABASE_SECRET_KEY saknas i serverns miljövariabler.");
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

// Ensure upload directories exist and serve legacy static uploads (read-only for backwards compatibility)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const categoryUploadsDir = path.join(uploadsDir, "categories");
const heroUploadsDir = path.join(uploadsDir, "hero");

[uploadsDir, categoryUploadsDir, heroUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use("/uploads", express.static(uploadsDir));

// Lazy GoogleGenAI client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "Sagomaskan Backend" });
});

// Supabase Storage Upload Endpoint (Protected - Admin Only)
app.post("/api/storage/upload", async (req: Request, res: Response) => {
  try {
    // 1. Verify admin authorization
    const authResult = await verifyAdminAuth(req);
    if (!authResult.ok) {
      return res.status(403).json({ error: authResult.error });
    }

    // 2. Check Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        error: "Supabase-lagring är inte konfigurerad ännu. Lägg till SUPABASE_URL och SUPABASE_SECRET_KEY i miljövariablerna."
      });
    }

    const { image, filename, folder = "products" } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Ingen bilddata skickades." });
    }

    const allowedFolders = ["products", "categories", "hero"];
    const safeFolder = allowedFolders.includes(folder) ? folder : "products";

    // 3. Parse base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let contentType = "image/webp";
    let ext = "webp";

    if (matches && matches.length === 3) {
      contentType = matches[1];
      if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("webp")) ext = "webp";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    // 4. Validate buffer size (10MB max)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Bilden är för stor (max 10MB)." });
    }

    const timestamp = Date.now();
    const safeBaseName = (filename || "image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    const finalFilename = `${timestamp}_${safeBaseName}.${ext}`;
    const storagePath = `${safeFolder}/${finalFilename}`;

    const supabase = getSupabase();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("sagomaskan-images")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Supabase Storage Upload Error]:", uploadError);
      return res.status(500).json({ error: `Supabase Storage fel: ${uploadError.message}` });
    }

    // 5. Retrieve public permanent URL
    const { data: publicUrlData } = supabase.storage
      .from("sagomaskan-images")
      .getPublicUrl(storagePath);

    const permanentUrl = publicUrlData.publicUrl;

    return res.json({
      success: true,
      url: permanentUrl,
      path: storagePath,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error("[/api/storage/upload] Upload error:", error);
    return res.status(500).json({
      error: error?.message || "Ett oväntat fel uppstod vid uppladdningen till Supabase Storage.",
    });
  }
});

// Deprecated local upload endpoint - blocked to prevent accidental local disk writes
app.post("/api/upload", (req: Request, res: Response) => {
  return res.status(410).json({
    error: "Lokal server-uppladdning är avaktiverad. Använd Supabase Storage (/api/storage/upload) för permanenta bilder.",
  });
});

// Lazy Resend client initialization (never exposed to client)
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Escape helper for safe HTML email rendering
function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Build HTML confirmation email for customer inquiry
function buildInquiryConfirmationHtml(data: {
  inquiryNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  message?: string;
  items: Array<{
    productName: string;
    priceAtTimeOfInquiry: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
  }>;
  estimatedTotal: number;
  discountCode?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  subtotalBeforeDiscount?: number;
  totalAfterDiscount?: number;
}): string {
  const {
    inquiryNumber,
    customerName,
    email,
    phone,
    address,
    postalCode,
    city,
    message,
    items = [],
    discountCode,
    discountAmount = 0,
    subtotalBeforeDiscount,
    totalAfterDiscount,
    estimatedTotal,
  } = data;

  const rawSubtotal = subtotalBeforeDiscount ?? items.reduce((sum, item) => sum + (item.priceAtTimeOfInquiry * item.quantity), 0);
  const finalTotal = totalAfterDiscount ?? estimatedTotal ?? rawSubtotal;

  const itemsRows = items
    .map((item, idx) => {
      const details: string[] = [];
      if (item.selectedColor) details.push(`Färg: <strong>${escapeHtml(item.selectedColor)}</strong>`);
      if (item.selectedSize) details.push(`Storlek: <strong>${escapeHtml(item.selectedSize)}</strong>`);
      const detailsHtml = details.length > 0 ? `<div style="font-size: 12px; color: #66726A; margin-top: 2px;">${details.join(' • ')}</div>` : '';
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FAF8F5';

      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 12px 14px; border-bottom: 1px solid #E6DFD3; font-size: 14px; color: #242D27;">
            <strong style="color: #242D27;">${escapeHtml(item.productName)}</strong>
            ${detailsHtml}
          </td>
          <td align="center" style="padding: 12px 14px; border-bottom: 1px solid #E6DFD3; font-size: 14px; color: #66726A;">
            ${item.quantity} st
          </td>
          <td align="right" style="padding: 12px 14px; border-bottom: 1px solid #E6DFD3; font-size: 14px; color: #242D27; font-weight: 500;">
            ${item.priceAtTimeOfInquiry * item.quantity} kr
          </td>
        </tr>
      `;
    })
    .join('');

  const discountRow = (discountCode && discountAmount > 0)
    ? `
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #526E5F;">
          Rabattkod (<strong style="color: #242D27;">${escapeHtml(discountCode)}</strong>)
        </td>
        <td align="right" style="padding: 6px 0; font-size: 14px; color: #526E5F; font-weight: 600;">
          -${discountAmount} kr
        </td>
      </tr>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bekräftelse på din beställningsförfrågan</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #242D27; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E6DFD3; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #242D27; padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #FAF8F5; font-size: 26px; font-weight: 500; letter-spacing: 1px; font-family: Georgia, serif;">SAGOMASKAN</h1>
              <p style="margin: 6px 0 0 0; color: #A4B8AB; font-size: 13px; font-weight: 300;">Handvirkade alster & personligt hantverk</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              
              <!-- Thank You Card -->
              <div style="background-color: #EFF4F1; border: 1px solid #C4D9CD; border-radius: 12px; padding: 20px 22px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0 0 6px 0; color: #242D27; font-size: 20px; font-weight: 600; font-family: Georgia, serif;">
                  Tack för din beställningsförfrågan!
                </h2>
                <p style="margin: 0; color: #526E5F; font-size: 14px; line-height: 1.5;">
                  Referensnummer: <strong style="color: #242D27; font-size: 15px;">${escapeHtml(inquiryNumber)}</strong>
                </p>
              </div>

              <!-- Personal Greeting -->
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #242D27;">
                Hej <strong>${escapeHtml(customerName)}</strong>,
              </p>
              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #4A564F;">
                Tack för ditt intresse för Sagomaskans handvirkade produkter! Vi har tagit emot din förfrågan och lagt den i ateljéns kö.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4A564F;">
                Eftersom varje produkt skapas för hand med stor omsorg går jag personligen igenom ditt önskemål och garnlager. Jag återkommer till dig inom kort via denna e-postadress med besked om tillverkningstid, leverans samt betalningsuppgifter.
              </p>

              <!-- Products Summary -->
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #242D27; border-bottom: 2px solid #E6DFD3; padding-bottom: 8px; font-family: Georgia, serif;">
                Önskade produkter
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #E6DFD3; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #F3EFE8;">
                    <th align="left" style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #66726A; text-transform: uppercase;">Produkt</th>
                    <th align="center" style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #66726A; text-transform: uppercase;">Antal</th>
                    <th align="right" style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #66726A; text-transform: uppercase;">Belopp</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; border: 1px solid #E6DFD3; border-radius: 12px; padding: 16px 20px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #66726A;">Delsumma:</td>
                  <td align="right" style="padding: 4px 0; font-size: 14px; color: #242D27; font-weight: 500;">${rawSubtotal} kr</td>
                </tr>
                ${discountRow}
                <tr>
                  <td style="padding: 10px 0 0 0; font-size: 16px; color: #242D27; font-weight: 600; border-top: 1px solid #E6DFD3; font-family: Georgia, serif;">
                    Beräknat totalbelopp:
                  </td>
                  <td align="right" style="padding: 10px 0 0 0; font-size: 18px; color: #242D27; font-weight: 700; border-top: 1px solid #E6DFD3;">
                    ${finalTotal} kr
                  </td>
                </tr>
              </table>

              <!-- Customer & Delivery Info -->
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #242D27; border-bottom: 2px solid #E6DFD3; padding-bottom: 8px; font-family: Georgia, serif;">
                Dina angivna uppgifter
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.6; color: #4A564F; margin-bottom: 26px;">
                <tr>
                  <td width="130" style="padding: 4px 0; color: #66726A; font-weight: 500;">Namn:</td>
                  <td style="padding: 4px 0; color: #242D27;">${escapeHtml(customerName)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #66726A; font-weight: 500;">E-post:</td>
                  <td style="padding: 4px 0; color: #242D27;">${escapeHtml(email)}</td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 4px 0; color: #66726A; font-weight: 500;">Telefon:</td>
                  <td style="padding: 4px 0; color: #242D27;">${escapeHtml(phone)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 4px 0; color: #66726A; font-weight: 500; vertical-align: top;">Leveransadress:</td>
                  <td style="padding: 4px 0; color: #242D27;">
                    ${escapeHtml(address)}<br>${escapeHtml(postalCode)} ${escapeHtml(city)}
                  </td>
                </tr>
                ${message ? `
                <tr>
                  <td style="padding: 4px 0; color: #66726A; font-weight: 500; vertical-align: top;">Önskemål/Meddelande:</td>
                  <td style="padding: 4px 0; color: #242D27; font-style: italic;">
                    "${escapeHtml(message)}"
                  </td>
                </tr>` : ''}
              </table>

              <!-- Next Steps Notice -->
              <div style="background-color: #FAF8F5; border-left: 4px solid #6B8E7B; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 28px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #242D27;">Vad händer nu?</p>
                <p style="margin: 0; font-size: 13px; color: #526E5F; line-height: 1.6;">
                  1. <strong>Granskning:</strong> Jag kontrollerar att garn och material finns tillgängligt.<br>
                  2. <strong>Personligt svar:</strong> Du får svar per e-post med leveransbesked och betalningsuppgifter.<br>
                  3. <strong>Tillverkning:</strong> När allt är bekräftat virkas dina alster med kärlek och omsorg!
                </p>
              </div>

              <!-- Sign-off -->
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #242D27; line-height: 1.5;">
                Med varma hälsningar,
              </p>
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #6B8E7B; font-family: Georgia, serif;">
                Sagomaskan
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF8F5; border-top: 1px solid #E6DFD3; padding: 22px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #66726A; line-height: 1.5;">
                Har du frågor eller vill komplettera din förfrågan? Svara direkt på detta mejl eller skriv till <a href="mailto:info@sagomaskan.se" style="color: #6B8E7B; text-decoration: underline; font-weight: 500;">info@sagomaskan.se</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #8F9D95;">
                Sagomaskan • <a href="https://sagomaskan.se" style="color: #8F9D95; text-decoration: none;">www.sagomaskan.se</a> • Handvirkat med omsorg
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Build plain-text fallback version for email clients
function buildInquiryConfirmationText(data: {
  inquiryNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  message?: string;
  items: Array<{
    productName: string;
    priceAtTimeOfInquiry: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
  }>;
  estimatedTotal: number;
  discountCode?: string;
  discountAmount?: number;
  subtotalBeforeDiscount?: number;
  totalAfterDiscount?: number;
}): string {
  const {
    inquiryNumber,
    customerName,
    email,
    phone,
    address,
    postalCode,
    city,
    message,
    items = [],
    discountCode,
    discountAmount = 0,
    subtotalBeforeDiscount,
    totalAfterDiscount,
    estimatedTotal,
  } = data;

  const rawSubtotal = subtotalBeforeDiscount ?? items.reduce((sum, item) => sum + (item.priceAtTimeOfInquiry * item.quantity), 0);
  const finalTotal = totalAfterDiscount ?? estimatedTotal ?? rawSubtotal;

  const itemListText = items
    .map((item) => {
      const details: string[] = [];
      if (item.selectedColor) details.push(`Färg: ${item.selectedColor}`);
      if (item.selectedSize) details.push(`Storlek: ${item.selectedSize}`);
      const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
      return `- ${item.productName}${detailsStr} | ${item.quantity} st x ${item.priceAtTimeOfInquiry} kr = ${item.quantity * item.priceAtTimeOfInquiry} kr`;
    })
    .join('\n');

  let discountText = '';
  if (discountCode && discountAmount > 0) {
    discountText = `Rabattkod (${discountCode}): -${discountAmount} kr\n`;
  }

  return `
SAGOMASKAN – Tack för din beställningsförfrågan!
Referensnummer: ${inquiryNumber}
------------------------------------------------------------

Hej ${customerName}!

Tack för ditt intresse för Sagomaskans handvirkade produkter! Vi har tagit emot din beställningsförfrågan.

Eftersom varje produkt skapas varsamt för hand i ateljén går jag personligen igenom dina önskemål och garnlager. Jag återkommer till dig inom kort via denna e-postadress med information om tillverkningstid, leverans samt betalningsuppgifter.

ÖNSKADE PRODUKTER:
${itemListText}

------------------------------------------------------------
Delsumma: ${rawSubtotal} kr
${discountText}Beräknat totalbelopp: ${finalTotal} kr
------------------------------------------------------------

DINA UPPGIFTER:
Namn: ${customerName}
E-post: ${email}
${phone ? `Telefon: ${phone}\n` : ''}Leveransadress: ${address}, ${postalCode} ${city}
${message ? `Önskemål/Meddelande: "${message}"\n` : ''}
VAD HÄNDER NU?
1. Jag kontrollerar beställningen och garnlagret i ateljén.
2. Du får ett personligt svar via e-post med leveransbesked och betalningsuppgifter.
3. När allt är bekräftat virkas dina alster med omsorg och skickas till dig!

Har du några frågor? Svara gärna direkt på detta mejl eller skriv till info@sagomaskan.se.

Med varma hälsningar,
Sagomaskan
www.sagomaskan.se | info@sagomaskan.se
`.trim();
}

// Resend Status Endpoint (check if API key is configured)
app.get("/api/resend/status", (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
  res.json({
    configured: hasKey,
    sender: "Sagomaskan <info@sagomaskan.se>",
    domain: "sagomaskan.se",
    message: hasKey
      ? "Resend API-nyckel är konfigurerad på servern."
      : "RESEND_API_KEY saknas i serverns miljövariabler.",
  });
});

// Resend Inquiry Confirmation Email Endpoint
app.post("/api/resend/send-inquiry-email", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, error: "Ogiltig förfrågan: Ingen data skickades." });
    }

    const {
      inquiryNumber = "#Förfrågan",
      customerName = "Kund",
      email,
      phone,
      address = "",
      postalCode = "",
      city = "",
      message = "",
      items = [],
      estimatedTotal = 0,
      discountCode,
      discountType,
      discountValue,
      discountAmount,
      subtotalBeforeDiscount,
      totalAfterDiscount,
    } = payload;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.warn("[/api/resend/send-inquiry-email] Avbröt: Ogiltig eller saknad e-postadress.");
      return res.status(400).json({
        success: false,
        error: "En giltig e-postadress krävs för att skicka bekräftelsemejl.",
      });
    }

    const cleanEmail = email.trim();
    const resend = getResend();

    if (!resend) {
      console.warn(
        `[/api/resend/send-inquiry-email] RESEND_API_KEY är inte konfigurerad på servern. Hoppar över mejlutskick till ${cleanEmail} för ${inquiryNumber}.`
      );
      return res.status(200).json({
        success: false,
        skipped: true,
        error: "RESEND_API_KEY saknas i serverns miljövariabler.",
        message: "Beställningsförfrågan är sparad, men bekräftelsemejl kunde inte skickas eftersom RESEND_API_KEY saknas.",
      });
    }

    console.log(
      `[/api/resend/send-inquiry-email] Skickar bekräftelsemejl via Resend till ${cleanEmail} för ${inquiryNumber}...`
    );

    const emailHtml = buildInquiryConfirmationHtml({
      inquiryNumber,
      customerName,
      email: cleanEmail,
      phone,
      address,
      postalCode,
      city,
      message,
      items,
      estimatedTotal,
      discountCode,
      discountType,
      discountValue,
      discountAmount,
      subtotalBeforeDiscount,
      totalAfterDiscount,
    });

    const emailText = buildInquiryConfirmationText({
      inquiryNumber,
      customerName,
      email: cleanEmail,
      phone,
      address,
      postalCode,
      city,
      message,
      items,
      estimatedTotal,
      discountCode,
      discountAmount,
      subtotalBeforeDiscount,
      totalAfterDiscount,
    });

    const sendResult = await resend.emails.send({
      from: "Sagomaskan <info@sagomaskan.se>",
      to: [cleanEmail],
      replyTo: "info@sagomaskan.se",
      subject: `Bekräftelse på din beställningsförfrågan (${inquiryNumber}) – Sagomaskan`,
      html: emailHtml,
      text: emailText,
    });

    if (sendResult.error) {
      console.error(
        `[/api/resend/send-inquiry-email] Resend API fel för ${cleanEmail} (${inquiryNumber}):`,
        sendResult.error
      );
      return res.status(200).json({
        success: false,
        error: sendResult.error.message || "Resend API returnerade ett fel vid sändning.",
        details: sendResult.error,
      });
    }

    const emailId = sendResult.data?.id;
    console.log(
      `[/api/resend/send-inquiry-email] Bekräftelsemejl skickat framgångsrikt till ${cleanEmail}! Resend ID: ${emailId} (${Date.now() - startTime}ms)`
    );

    return res.json({
      success: true,
      emailId,
      message: `Bekräftelsemejl skickat till ${cleanEmail}`,
    });
  } catch (error: any) {
    console.error("[/api/resend/send-inquiry-email] Oväntat fel vid mejlsändning:", error);
    return res.status(200).json({
      success: false,
      error: error?.message || "Ett internt serverfel uppstod vid sändning av e-post.",
    });
  }
});

// Resend Withdrawal Acknowledgement Email Endpoint (Mottagningsbevis för ångeranmälan)
app.post("/api/resend/send-withdrawal-acknowledgement", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, error: "Ingen data skickades." });
    }

    const {
      orderNumber = "",
      customerName = "Kund",
      email,
      phone = "",
      items = "",
      submittedAt = new Date().toLocaleString("sv-SE")
    } = payload;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "En giltig e-postadress krävs." });
    }

    const cleanEmail = email.trim();
    const resend = getResend();

    if (!resend) {
      console.warn(
        `[/api/resend/send-withdrawal-acknowledgement] RESEND_API_KEY saknas på servern. Simulerar utskick till ${cleanEmail} för order ${orderNumber}.`
      );
      return res.status(200).json({
        success: true,
        simulated: true,
        message: "Mejlutskick simulerades eftersom RESEND_API_KEY inte är konfigurerad på servern.",
      });
    }

    const emailSubject = `Mottagningsbevis: Ångeranmälan för beställning ${orderNumber || ""} – Sagomaskan`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F1EA; margin: 0; padding: 30px 15px; color: #242D27; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E6DFD3; overflow: hidden; }
    .header { background: #242D27; color: #FAF8F5; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 500; letter-spacing: 0.05em; }
    .badge { display: inline-block; background: #344038; color: #E8EFEA; padding: 4px 12px; border-radius: 12px; font-size: 11px; margin-top: 8px; }
    .content { padding: 32px; line-height: 1.6; font-size: 14px; }
    .box { background: #FBF9F5; border: 1px solid #E6DFD3; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .box-title { font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #66726A; margin-bottom: 8px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .detail-label { color: #66726A; }
    .detail-value { font-weight: 500; color: #242D27; }
    .notice { background: #F0F5F2; border-left: 3px solid #6B8E7B; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #2C3E33; margin: 20px 0; }
    .footer { background: #FBF9F5; padding: 20px 32px; text-align: center; font-size: 12px; color: #8F9992; border-top: 1px solid #E6DFD3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mottagningsbevis</h1>
      <div class="badge">Bekräftelse på mottagen ångeranmälan</div>
    </div>
    <div class="content">
      <p>Hej ${customerName},</p>
      <p>Vi bekräftar härmed att vi har tagit emot ditt meddelande om att du önskar utöva din lagstadgade ångerrätt.</p>
      
      <div class="box">
        <div class="box-title">Uppgifter för anmälan</div>
        <div class="detail-row"><span class="detail-label">Ordernummer:</span> <span class="detail-value">${orderNumber || "Ej angivet"}</span></div>
        <div class="detail-row"><span class="detail-label">Mottaget datum:</span> <span class="detail-value">${submittedAt}</span></div>
        <div class="detail-row"><span class="detail-label">Kund:</span> <span class="detail-value">${customerName}</span></div>
        <div class="detail-row"><span class="detail-label">E-post:</span> <span class="detail-value">${cleanEmail}</span></div>
        ${phone ? `<div class="detail-row"><span class="detail-label">Telefon:</span> <span class="detail-value">${phone}</span></div>` : ""}
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #E6DFD3;">
          <span class="detail-label">Produkter som ångras:</span>
          <p style="margin: 4px 0 0 0; font-weight: 500; white-space: pre-line;">${items}</p>
        </div>
      </div>

      <div class="notice">
        <strong>Vad händer nu?</strong><br>
        Vi går igenom din anmälan och återkommer inom kort via e-post med instruktioner och returadress. Observera att ångeranmälan och eventuell återbetalning är separata steg – återbetalning sker i enlighet med våra köpvillkor när varan har returnerats och kontrollerats.
      </div>

      <p>Tveka inte att svara på detta mejl om du har några frågor under tiden.</p>
      <p style="margin-top: 24px;">Varma hälsningar,<br><strong>Sagomaskan</strong><br><span style="color: #66726A; font-size: 13px;">Handgjorda virkade alster</span></p>
    </div>
    <div class="footer">
      Detta är ett automatiskt genererat mottagningsbevis från Sagomaskan (www.sagomaskan.se).
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Mottagningsbevis – Ångeranmälan
Sagomaskan

Hej ${customerName},

Vi bekräftar härmed att vi har tagit emot ditt meddelande om att du önskar utöva din ångerrätt.

Uppgifter:
- Ordernummer: ${orderNumber || "Ej angivet"}
- Mottaget datum: ${submittedAt}
- Kund: ${customerName}
- E-post: ${cleanEmail}
${phone ? `- Telefon: ${phone}\n` : ""}
- Produkter som ångras:
${items}

Vad händer nu?
Vi går igenom din anmälan och återkommer inom kort via e-post med returadress och information. Observera att detta meddelande är en bekräftelse på att vi har mottagit din anmälan. Återbetalning hanteras separat efter att eventuell retur mottagits och kontrollerats.

Varma hälsningar,
Sagomaskan
info@sagomaskan.se
    `.trim();

    const data = await resend.emails.send({
      from: "Sagomaskan <info@sagomaskan.se>",
      to: [cleanEmail],
      replyTo: "info@sagomaskan.se",
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      message: "Mottagningsbevis har skickats via e-post.",
      id: (data as any)?.data?.id || (data as any)?.id || "sent",
    });
  } catch (error: any) {
    console.error("[/api/resend/send-withdrawal-acknowledgement] Fel vid mejlsändning:", error);
    return res.status(200).json({
      success: false,
      error: error?.message || "Ett internt serverfel uppstod vid sändning av mottagningsbevis.",
    });
  }
});


// Poetic, tailored fallback story generator adhering to Sagomaskan guidelines (60–120 words)
function generateFallbackStory(params: {
  productName?: string;
  categoryName?: string;
  ageGroup?: string;
  colors?: string[];
  materials?: string;
  personality?: string;
  storyIdea?: string;
  shapeOrMotif?: string;
}): string {
  const idea = (params.storyIdea || "").trim();
  const rawName = (params.productName || "").trim();
  const category = (params.categoryName || "").trim();
  const personality = (params.personality || "Lugn").trim();
  const colors = Array.isArray(params.colors) && params.colors.length > 0 ? params.colors.join(", ") : "";
  const materials = (params.materials || "100% mjuk merinoull").trim();

  // Determine a warm, natural subject if product name is not yet given
  let subject = rawName;
  if (!subject) {
    const lowerIdea = idea.toLowerCase();
    if (lowerIdea.includes("katt")) subject = "den lilla katten";
    else if (lowerIdea.includes("kanin")) subject = "den lilla kaninen";
    else if (lowerIdea.includes("nalle") || lowerIdea.includes("björn")) subject = "den lilla björnen";
    else if (lowerIdea.includes("mössa")) subject = "den lilla mössan";
    else if (lowerIdea.includes("skallra")) subject = "den lilla skallran";
    else if (category && category !== "Alla") subject = `det handvirkade alstret i ${category.toLowerCase()}`;
    else subject = "den lilla handvirkade vännen";
  }

  const colorPhrase = colors ? ` i milda toner av ${colors.toLowerCase()}` : "";
  const materialPhrase = materials ? ` av ${materials.toLowerCase()}` : "";
  const personalityPhrase = personality ? ` med ett stilla, ${personality.toLowerCase()} lynne` : " med ett rofyllt hjärta";
  
  let ideaPhrase = "";
  if (idea) {
    const cleanIdea = idea.replace(/[.]+$/, "");
    ideaPhrase = ` Inspirationen föddes ur tanken om ${cleanIdea.toLowerCase()}.`;
  }

  const templates = [
    `Det började med några mjuka maskor och en stilla stund vid virknålen${colorPhrase}. Maska för maska tog ${subject} form${materialPhrase}, skapad med lugna händer och omsorg om vardagens enkla ögonblick.${ideaPhrase} Varje liten detalj är omsorgsfullt fäst för hand för att ge värme och trygghet – en trogen följeslagare${personalityPhrase}, redo att dela livets allra mjukaste stunder och skapa ro i rummet.`,
    `En stilla morgon i ateljén föddes ${subject}, tråd för tråd${materialPhrase}${colorPhrase}.${ideaPhrase} Här finns inga genvägar, bara handens tålmodiga arbete och en djup kärlek till det tidlösa hantverket. Skapad${personalityPhrase} för att skänka ro åt både små och stora stunder – ett genuint litet sällskap att tycka om och spara genom åren.`,
    `I varje liten maska av ${subject} vilar tid, tystnad och eftertanke${colorPhrase}.${ideaPhrase} Varsamt formad för hand${materialPhrase}${personalityPhrase}, bär den på en alldeles egen historia om värme och gemenskap. En stillsam vän att hålla nära när kvällen kommer och lugnet sänker sig över hemmet.`
  ];

  const chosen = templates[Math.floor(Math.random() * templates.length)];
  return chosen;
}

// AI Story Generation Endpoint
app.post("/api/ai/story", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const productName = (req.body.productName || req.body.name || "").trim();
    const categoryName = (req.body.categoryName || req.body.category || "").trim();
    const ageGroup = (req.body.ageGroup || "").trim();
    const colors: string[] = Array.isArray(req.body.colors)
      ? req.body.colors.map((c: any) => (typeof c === "string" ? c : c?.name || "")).filter(Boolean)
      : [];
    const materials = (req.body.materials || req.body.material || "").trim();
    const personality = (req.body.personality || req.body.tone || "Lugn").trim();
    const storyIdea = (req.body.storyIdea || req.body.inspiration || "").trim();
    const shapeOrMotif = (req.body.shapeOrMotif || "").trim();
    const shortDescription = (req.body.shortDescription || "").trim();
    const description = (req.body.description || "").trim();

    const normalizedParams = {
      productName,
      categoryName,
      ageGroup,
      colors,
      materials,
      personality,
      storyIdea,
      shapeOrMotif,
      shortDescription,
      description,
    };

    console.log(
      `[/api/ai/story] Request received: name="${productName || '(ej angivet)'}", category="${categoryName}", tone="${personality}", idea="${storyIdea}"`
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[/api/ai/story] GEMINI_API_KEY is not defined in server environment. Returning ateljé fallback.");
      const fallbackStory = generateFallbackStory(normalizedParams);
      return res.json({
        success: true,
        story: fallbackStory,
        source: "fallback",
        debug: { reason: "GEMINI_API_KEY_NOT_CONFIGURED" },
      });
    }

    const ai = getGenAI();
    if (!ai) {
      console.warn("[/api/ai/story] GoogleGenAI client could not be initialized. Returning ateljé fallback.");
      const fallbackStory = generateFallbackStory(normalizedParams);
      return res.json({
        success: true,
        story: fallbackStory,
        source: "fallback",
        debug: { reason: "GENAI_CLIENT_INIT_FAILED" },
      });
    }

    const colorList = colors.length > 0 ? colors.join(", ") : "";
    const promptDetails = [
      productName ? `Produktnamn: ${productName}` : "Produkt: Handvirkat hantverk från ateljén",
      categoryName ? `Kategori/Typ: ${categoryName}` : "",
      ageGroup ? `Målgrupp/Ålder: ${ageGroup}` : "",
      colorList ? `Färger: ${colorList}` : "",
      materials ? `Material: ${materials}` : "",
      shapeOrMotif ? `Form/Motiv: ${shapeOrMotif}` : "",
      personality ? `Önskad personlighet/karaktär: ${personality}` : "",
      storyIdea ? `Sago-idé & inspiration från skaparen: "${storyIdea}"` : "",
      shortDescription ? `Kort beskrivning: ${shortDescription}` : "",
      description ? `Beskrivning: ${description}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Skapa en personlig och poetisk saga för följande handvirkade produkt från Sagomaskan:\n\n${promptDetails}`;

    const modelName = "gemini-3.6-flash";
    let storyText = "";
    let aiError: any = null;

    try {
      // Execute AI generation with a 6-second timeout to prevent hanging UI
      const timeoutMs = 6000;
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("AI_GENERATION_TIMEOUT_6S")), timeoutMs);
      });

      const aiPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            "Du är Sagomaskans personliga berättarröst. Sagomaskan är en liten svensk hantverksateljé som skapar personliga, handvirkade produkter med lugn och tidlös nordisk estetik.\n\n" +
            "Ditt uppdrag:\n" +
            "Skriv en kort, varm, poetisk och genuin saga (cirka 60–120 ord) för den specifika produkten.\n\n" +
            "Riktlinjer för ton och stil:\n" +
            "- Ton: Varm, poetisk, personlig, nordisk, enkel, lite sagolik och genuin.\n" +
            "- INTE barnsligt gullig eller fjantig, och INTE överdrivet kommersiell/säljande.\n" +
            "- Skriv cirka 60 till 120 ord.\n" +
            "- Varje saga ska vara unik och utgå från just den aktuella produktens sago-idé, färger och material.\n" +
            "- Undvik upprepade standardklyschor mellan produkter.\n\n" +
            "STRIKTA FÖRBUD (Viktigt!):\n" +
            "- Hitta ALDRIG på säkerhetsmärkningar (t.ex. CE-märkning, EN71).\n" +
            "- Hitta ALDRIG på certifieringar (t.ex. Oeko-Tex, GOTS) om de inte uttryckligen angetts i produktens data.\n" +
            "- Hitta ALDRIG på allergiegenskaper (t.ex. 'allergivänlig', 'hypoallergen').\n" +
            "- Hitta ALDRIG på miljöpåståenden eller medicinska påståenden.\n" +
            "- Hitta ALDRIG på leveranstider eller garantier.\n" +
            "- Hitta inte på material eller säkerhetsinformation som inte angetts i underlaget.\n\n" +
            "Format:\n" +
            "- Returnera ENDAST själva sagan som sammanhängande text på svenska (utan rubriker, citattecken eller inledande hälsningsfraser).",
        },
      });

      const response = await Promise.race([aiPromise, timeoutPromise]).finally(() => {
        clearTimeout(timer);
      });

      storyText = response.text ? response.text.trim().replace(/^["“”']+|["“”']+$/g, "") : "";
    } catch (err: any) {
      aiError = err;
      console.warn(
        `[/api/ai/story] AI call (${modelName}) failed or timed out after ${Date.now() - startTime}ms. Status: ${
          err?.status || err?.code || "N/A"
        }, Message: ${err?.message || "Unknown error"}. Serving fallback story.`
      );
    }

    if (storyText) {
      console.log(`[/api/ai/story] Successfully generated story with ${modelName} in ${Date.now() - startTime}ms`);
      return res.json({
        success: true,
        story: storyText,
      });
    }

    // AI call failed, timed out, or returned empty text -> Return tailored fallback story
    const fallbackStory = generateFallbackStory(normalizedParams);
    return res.json({
      success: true,
      story: fallbackStory,
      source: "fallback",
      debug: {
        reason: aiError?.message || "AI_EMPTY_RESPONSE",
        status: aiError?.status || null,
        model: modelName,
        elapsedMs: Date.now() - startTime,
      },
    });
  } catch (fatalError: any) {
    console.error("[/api/ai/story] Fatal unhandled error:", fatalError);
    return res.status(500).json({
      success: false,
      error: "Det gick inte att skapa sagoförslaget just nu. Kontrollera uppgifterna och försök igen.",
      details: fatalError?.message || "Okänt serverfel",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sagomaskan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
