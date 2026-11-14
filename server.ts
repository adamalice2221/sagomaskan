import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AiModelId = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
type StoryStatus = 'Publicerad' | 'Granskas';

interface StoryRecord {
  id: string;
  title: string;
  author: string;
  theme: string;
  status: StoryStatus;
  tokens: number;
  characters: number;
  model: AiModelId;
  createdAt: string;
  excerpt: string;
  content: string;
  isAiTest?: boolean;
}

interface CallMetric {
  id: string;
  label: string;
  calls: number;
  avgLatencyMs: number;
  tokens: number;
}

const AVAILABLE_MODELS: Array<{
  id: AiModelId;
  label: string;
  description: string;
}> = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    description: 'Balanserad & kreativ sagoberättare',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    description: 'Ultrasnabb för korta godnattsagor',
  },
];

let activeModel: AiModelId = 'gemini-4-hydrogen';
const responseCache = new Map<string, StoryRecord>();

const initialStories: StoryRecord[] = [
  {
    id: 'saga-101',
    title: 'Månbaggen och den glömda garnhärvan',
    author: 'Astrid Lindqvist-Ek',
    theme: 'skog',
    status: 'Publicerad',
    tokens: 1420,
    characters: 5680,
    model: 'gemini-4-hydrogen',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    excerpt: 'Långt inne i Silvermossan hittade lilla Månbaggen en skimrande tråd som ledde rakt upp mot stjärntältet...',
    content:
      'Långt inne i Silvermossan, där daggdropparna alltid lyste som små lyktor i skymningen, bodde lilla Månbaggen. En kväll hittade han en bortglömd garnhärva spunnen av silvrigt spindelväv och varm höstsol.\n\nNär han försiktigt rullade nystanet framför sig började tråden nynna en stilla melodi. Varje steg längs stigen knöt ihop gamla minnen från skogens alla djur – igelkottens dröm om en varm halsduk och ugglans berättelse om norrskenet.\n\nInnan midnatt hade tråden lett honom upp till ekens högsta gren, där hela skogen samlades för att lyssna på nattens första saga.',
  },
  {
    id: 'saga-102',
    title: 'Kapten Kanelbulles seglats över Molnhavet',
    author: 'Oskar Bergström',
    theme: 'hav',
    status: 'Granskas',
    tokens: 1185,
    characters: 4740,
    model: 'gemini-3.1-flash-lite',
    createdAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    excerpt: 'Med segel av linne och en kompass som alltid pekade mot varm choklad styrde skutan rakt mot väster...',
    content:
      'Med segel av mjukt linne och en mässingskompass som alltid pekade mot närmaste kopp varm choklad styrde Kapten Kanelbulle sin lilla träskuta rakt ut på Molnhavet.\n\nVid relingen stod matrosen Kurre, som höll utkik efter flygande valar och stjärnfall man kunde fånga i håv. Plötsligt blåste en mild kanelvind upp från öster och lyfte båten förbi tre sovande regnbågar.\n\nNär de äntligen lade till vid Sömnens hamn hade varje barn i byn fått varsin dröm inslagen i gyllene papper.',
  },
  {
    id: 'saga-103',
    title: 'Den blyge draken i virkverkstaden',
    author: 'Maja Söderlund',
    theme: 'drake',
    status: 'Publicerad',
    tokens: 1690,
    characters: 6760,
    model: 'gemini-4-hydrogen',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    excerpt: 'Pyro ville inte spruta eld som sina syskon – han ville mycket hellre värma ullnystan och virka mössor...',
    content:
      'Pyro var den minsta draken i hela Glödberget, men i stället för att spruta gnistrande eld föredrog han att blåsa lagom varma vindpustar på nyfärgade ullnystan.\n\nI ett undangömt hörn av byns verkstad hade han samlat virknålar av cederträ. Varje natt när skräddarna sov färdigställde han vantar till skogens frusna rävar.\n\nEn frostig morgon upptäckte hela byn vem den hemlige hjälparen var – och Pyro fick sin alldeles egna skylt ovanför verkstadsdörren.',
  },
  {
    id: 'saga-104',
    title: 'Klockmakarens sjungande uggla',
    author: 'Henrik Holm',
    theme: 'stjärnor',
    status: 'Publicerad',
    tokens: 980,
    characters: 3920,
    model: 'gemini-3.1-flash-lite',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    excerpt: 'Varje timslag spelade den lilla mässingsugglan en ny ton som väckte berättelser ur gamla böcker...',
    content:
      'Högst uppe i det smala tornet vid Stortorget bodde klockmakaren Algot tillsammans med en liten uggla av hamrad mässing och blå filt.\n\nVarje kväll klockan åtta öppnade ugglan näbben och sjöng tre klara toner. Då brukade bokstäverna i barnens bilderböcker sakta börja dansa, tills hela rummet fylldes av mjuka sagoväsen som vaktade drömmarna ända till gryningen.',
  },
  {
    id: 'saga-105',
    title: 'Räven som samlade på tappade vantar',
    author: 'Freja Nyström',
    theme: 'vinter',
    status: 'Granskas',
    tokens: 1310,
    characters: 5240,
    model: 'gemini-4-hydrogen',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    excerpt: 'Under den gamla stenbron låg en hel skattkammare av udda vantar som väntade på sina ägare...',
    content:
      'Varje vinter när snön föll över björkskogen smög räven Ville ut längs pulkabackarna. Han letade efter vantar som tappats i farten – röda tumvantar, randiga ullvantar och små broderade vantar med bjällror.\n\nUnder den gamla stenbron tvättade han dem i källvatten och hängde dem prydligt på tork. När våren närmade sig ordnade skogens djur en stor utdelningsfest där varje barn fick tillbaka sin saknade vante tillsammans med en liten skogssaga.',
  },
];

const storiesStore: StoryRecord[] = [...initialStories];

const hourlyCalls: CallMetric[] = [
  { id: 'h-08', label: '08:00', calls: 18, avgLatencyMs: 690, tokens: 21400 },
  { id: 'h-10', label: '10:00', calls: 34, avgLatencyMs: 740, tokens: 41800 },
  { id: 'h-12', label: '12:00', calls: 52, avgLatencyMs: 810, tokens: 64200 },
  { id: 'h-14', label: '14:00', calls: 47, avgLatencyMs: 720, tokens: 58900 },
  { id: 'h-16', label: '16:00', calls: 63, avgLatencyMs: 760, tokens: 78400 },
  { id: 'h-18', label: '18:00', calls: 84, avgLatencyMs: 685, tokens: 102600 },
  { id: 'h-20', label: '20:00', calls: 96, avgLatencyMs: 640, tokens: 118900 },
];

let totalCallsToday = 394;
let lastLatencyMs = 640;
let lastStatus: 'Operativ' | 'Begränsad' = 'Operativ';
let cacheHits = 28;
let activeAuthorsCount = 42;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildOverviewPayload() {
  const totalTokens = storiesStore.reduce((acc, s) => acc + s.tokens, 0) + 486200;
  const totalCharacters = storiesStore.reduce((acc, s) => acc + s.characters, 0) + 1944800;
  const publishedCount = storiesStore.filter((s) => s.status === 'Publicerad').length;
  const reviewCount = storiesStore.filter((s) => s.status === 'Granskas').length;
  const avgLatencyMs = Math.round(
    hourlyCalls.reduce((sum, item) => sum + item.avgLatencyMs, 0) / hourlyCalls.length
  );

  return {
    activeModel,
    availableModels: AVAILABLE_MODELS,
    geminiConfigured: Boolean(getAiClient()),
    cacheSize: responseCache.size,
    cacheHits,
    stats: {
      activeStoriesToday: 128 + (storiesStore.length - initialStories.length),
      publishedCount,
      reviewCount,
      totalTokens,
      totalCharacters,
      activeAuthors: activeAuthorsCount,
      totalCallsToday,
      avgLatencyMs,
      lastLatencyMs,
      systemStatus: lastStatus,
    },
    hourlyCalls,
    stories: storiesStore,
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Hälsokontroll & live AI-översikt
  app.get('/api/ai/overview', (_req, res) => {
    res.json(buildOverviewPayload());
  });

  // Växla aktiv Gemini-modell
  app.post('/api/ai/switch-model', (req, res) => {
    const requested = req.body?.model as AiModelId | undefined;
    if (requested !== 'gemini-4-hydrogen' && requested !== 'gemini-3.1-flash-lite') {
      res.status(400).json({ error: 'Ogiltig AI-modell vald.' });
      return;
    }
    activeModel = requested;
    res.json({
      message: `Växlade AI-modell till ${requested}`,
      overview: buildOverviewPayload(),
    });
  });

  // Rensa serverns promptcache
  app.post('/api/ai/clear-cache', (_req, res) => {
    const clearedCount = responseCache.size;
    responseCache.clear();
    res.json({
      clearedCount,
      message: `Rensade ${clearedCount} cachade sagoutkast.`,
      overview: buildOverviewPayload(),
    });
  });

  // Växla status på en saga (Publicerad <-> Granskas)
  app.patch('/api/ai/stories/:id/status', (req, res) => {
    const { id } = req.params;
    const story = storiesStore.find((s) => s.id === id);
    if (!story) {
      res.status(404).json({ error: 'Sagan hittades inte.' });
      return;
    }
    const nextStatus = req.body?.status;
    if (nextStatus === 'Publicerad' || nextStatus === 'Granskas') {
      story.status = nextStatus;
    } else {
      story.status = story.status === 'Publicerad' ? 'Granskas' : 'Publicerad';
    }
    res.json({
      story,
      overview: buildOverviewPayload(),
    });
  });

  // Skapa en riktig AI-testsaga via Google GenAI på serversidan
  app.post('/api/ai/generate-test-story', async (req, res) => {
    const theme = String(req.body?.theme || 'Virkad skogsmagi').trim();
    const author = String(req.body?.author || 'Admin (Testsaga)').trim();
    const cacheKey = `${activeModel}::${theme.toLowerCase()}`;

    const ai = getAiClient();
    if (!ai) {
      lastStatus = 'Begränsad';
      res.status(503).json({
        error: 'GEMINI_API_KEY saknas på servern. Konfigurera miljövariabeln för att generera nya AI-sagor.',
        overview: buildOverviewPayload(),
      });
      return;
    }

    const startTime = Date.now();

    if (req.body?.useCache !== false && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey)!;
      const latencyMs = Math.max(12, Date.now() - startTime + 18);
      cacheHits += 1;
      totalCallsToday += 1;
      lastLatencyMs = latencyMs;
      lastStatus = 'Operativ';

      const clonedStory: StoryRecord = {
        ...cached,
        id: `saga-${Date.now()}`,
        author,
        createdAt: new Date().toISOString(),
        status: 'Granskas',
        isAiTest: true,
      };
      storiesStore.unshift(clonedStory);

      const latestBucket = hourlyCalls[hourlyCalls.length - 1];
      latestBucket.calls += 1;
      latestBucket.tokens += clonedStory.tokens;

      res.json({
        story: clonedStory,
        latencyMs,
        cached: true,
        overview: buildOverviewPayload(),
      });
      return;
    }

    try {
      const prompt = `Skriv en kort, varm och fantasifull svensk barnsaga på temat "${theme}" för plattformen Sagomaskan (där handvirkade figurer och garn får liv). Sagan ska vara ca 130–180 ord, indelad i 3 korta stycken, utan markdown-rubriker.`;

      const response = await ai.models.generateContent({
        model: activeModel,
        contents: prompt,
        config: {
          systemInstruction:
            'Du är sagoberättare för Sagomaskan. Svara alltid med ren JSON enligt schemat med fälten title (kort fängslande svensk titel), excerpt (1 mening på svenska) och content (hela sagan på svenska med radbrytningar mellan stycken).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ['title', 'excerpt', 'content'],
          },
        },
      });

      const latencyMs = Math.max(45, Date.now() - startTime);
      const rawText = response.text || '{}';
      let parsed: { title?: string; excerpt?: string; content?: string } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {
          title: `Saga om ${theme}`,
          excerpt: rawText.slice(0, 120),
          content: rawText,
        };
      }

      const contentText = (parsed.content || rawText).trim();
      const titleText = (parsed.title || `Nattens saga om ${theme}`).trim();
      const excerptText = (parsed.excerpt || `${contentText.slice(0, 115)}...`).trim();
      const usedTokens =
        response.usageMetadata?.totalTokenCount ||
        Math.max(180, Math.round(contentText.length / 3.2));

      const newStory: StoryRecord = {
        id: `saga-${Date.now()}`,
        title: titleText,
        author,
        theme,
        status: 'Granskas',
        tokens: usedTokens,
        characters: contentText.length,
        model: activeModel,
        createdAt: new Date().toISOString(),
        excerpt: excerptText,
        content: contentText,
        isAiTest: true,
      };

      storiesStore.unshift(newStory);
      responseCache.set(cacheKey, newStory);

      totalCallsToday += 1;
      lastLatencyMs = latencyMs;
      lastStatus = 'Operativ';
      activeAuthorsCount = Math.max(activeAuthorsCount, 43);

      const latestBucket = hourlyCalls[hourlyCalls.length - 1];
      latestBucket.calls += 1;
      latestBucket.tokens += usedTokens;
      latestBucket.avgLatencyMs = Math.round((latestBucket.avgLatencyMs * 0.7) + (latencyMs * 0.3));

      res.json({
        story: newStory,
        latencyMs,
        cached: false,
        overview: buildOverviewPayload(),
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      lastLatencyMs = latencyMs;
      lastStatus = 'Begränsad';
      const errMsg = error instanceof Error ? error.message : 'Okänt fel vid AI-anrop.';
      console.error('Gemini API-fel vid generering av testsaga:', errMsg);
      res.status(502).json({
        error: `Kunde inte generera testsaga: ${errMsg}`,
        overview: buildOverviewPayload(),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Sagomaskan server lyssnar på http://0.0.0.0:${port}`);
  });
}

createServer();
