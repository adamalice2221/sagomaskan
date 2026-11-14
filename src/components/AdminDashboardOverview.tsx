import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Flame,
  KeyRound,
  Lock,
  LogOut,
  Megaphone,
  Moon,
  MoonStar,
  RefreshCw,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Sun,
  Trash2,
  TreePine,
  Users,
  Wand2,
  X,
} from 'lucide-react';

export type AiModelId = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
export type StoryStatus = 'Publicerad' | 'Granskas';

export interface StoryRecord {
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

export interface HourlyCallMetric {
  id: string;
  label: string;
  calls: number;
  avgLatencyMs: number;
  tokens: number;
}

export interface AiOverviewData {
  activeModel: AiModelId;
  availableModels: Array<{
    id: AiModelId;
    label: string;
    description: string;
  }>;
  geminiConfigured: boolean;
  cacheSize: number;
  cacheHits: number;
  stats: {
    activeStoriesToday: number;
    publishedCount: number;
    reviewCount: number;
    totalTokens: number;
    totalCharacters: number;
    activeAuthors: number;
    totalCallsToday: number;
    avgLatencyMs: number;
    lastLatencyMs: number;
    systemStatus: 'Operativ' | 'Begränsad';
  };
  hourlyCalls: HourlyCallMetric[];
  stories: StoryRecord[];
}

export interface StoreKpis {
  products: number;
  orders: number;
  unreadMessages: number;
  discounts: number;
  adminEmail: string;
  activeTab: string;
}

interface AdminDashboardOverviewProps {
  storeKpis: StoreKpis;
  onSelectAdminTab: (tab: string) => void;
  onSignOut: () => void;
  onTogglePinForm: () => void;
  onLockAdmin: () => void;
  onBroadcastAnnouncement: (text: string, bgColor?: string) => void;
  currentBannerText: string;
  onNotify: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const THEME_STORAGE_KEY = 'sagomaskan_admin_dash_theme_v1';
const STORIES_LOCAL_CACHE_KEY = 'sagomaskan_ai_stories_local_v1';

const FALLBACK_OVERVIEW: AiOverviewData = {
  activeModel: 'gemini-4-hydrogen',
  availableModels: [
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
  ],
  geminiConfigured: true,
  cacheSize: 0,
  cacheHits: 28,
  stats: {
    activeStoriesToday: 128,
    publishedCount: 3,
    reviewCount: 2,
    totalTokens: 492785,
    totalCharacters: 1971140,
    activeAuthors: 42,
    totalCallsToday: 394,
    avgLatencyMs: 721,
    lastLatencyMs: 640,
    systemStatus: 'Operativ',
  },
  hourlyCalls: [
    { id: 'h-08', label: '08:00', calls: 18, avgLatencyMs: 690, tokens: 21400 },
    { id: 'h-10', label: '10:00', calls: 34, avgLatencyMs: 740, tokens: 41800 },
    { id: 'h-12', label: '12:00', calls: 52, avgLatencyMs: 810, tokens: 64200 },
    { id: 'h-14', label: '14:00', calls: 47, avgLatencyMs: 720, tokens: 58900 },
    { id: 'h-16', label: '16:00', calls: 63, avgLatencyMs: 760, tokens: 78400 },
    { id: 'h-18', label: '18:00', calls: 84, avgLatencyMs: 685, tokens: 102600 },
    { id: 'h-20', label: '20:00', calls: 96, avgLatencyMs: 640, tokens: 118900 },
  ],
  stories: [],
};

const QUICK_STORY_THEMES = [
  'Virkad skogsmagi',
  'Stjärnornas vävstol',
  'Den blyga garnråttan',
  'Fyren vid Ullhavet',
];

function formatNumberSv(num: number): string {
  return new Intl.NumberFormat('sv-SE').format(Math.round(num));
}

function formatCompactSv(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2).replace('.', ',')}M`;
  }
  if (num >= 10_000) {
    return `${Math.round(num / 1_000)}k`;
  }
  return formatNumberSv(num);
}

function formatRelativeTimeSv(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} tim sedan`;
  return `${Math.floor(hours / 24)} d sedan`;
}

function getThemeVisual(theme: string, isDark: boolean) {
  const key = (theme || '').toLowerCase();
  if (key.includes('hav') || key.includes('segel')) {
    return {
      Icon: Compass,
      boxClass: isDark
        ? 'bg-sky-500/15 text-sky-300 border-sky-400/20'
        : 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }
  if (key.includes('drake') || key.includes('eld')) {
    return {
      Icon: Flame,
      boxClass: isDark
        ? 'bg-amber-500/15 text-amber-300 border-amber-400/20'
        : 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (key.includes('stjärn') || key.includes('natt') || key.includes('uggla')) {
    return {
      Icon: MoonStar,
      boxClass: isDark
        ? 'bg-violet-500/15 text-violet-300 border-violet-400/20'
        : 'bg-violet-50 text-violet-700 border-violet-200',
    };
  }
  if (key.includes('vinter') || key.includes('snö')) {
    return {
      Icon: Snowflake,
      boxClass: isDark
        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/20'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  if (key.includes('skog') || key.includes('mossa')) {
    return {
      Icon: TreePine,
      boxClass: isDark
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  return {
    Icon: Wand2,
    boxClass: isDark
      ? 'bg-purple-500/15 text-purple-300 border-purple-400/20'
      : 'bg-purple-50 text-purple-700 border-purple-200',
  };
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  storeKpis,
  onSelectAdminTab,
  onSignOut,
  onTogglePinForm,
  onLockAdmin,
  onBroadcastAnnouncement,
  currentBannerText,
  onNotify,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const [overview, setOverview] = useState<AiOverviewData>(FALLBACK_OVERVIEW);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(true);
  const [isGeneratingStory, setIsGeneratingStory] = useState<boolean>(false);
  const [isSwitchingModel, setIsSwitchingModel] = useState<boolean>(false);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [autoPublishTests, setAutoPublishTests] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Alla' | StoryStatus>('Alla');
  const [hoveredBucketId, setHoveredBucketId] = useState<string | null>(null);

  const [selectedStory, setSelectedStory] = useState<StoryRecord | null>(null);
  const [testStoryModalOpen, setTestStoryModalOpen] = useState<boolean>(false);
  const [customTheme, setCustomTheme] = useState<string>('Virkad skogsmagi');

  const [broadcastModalOpen, setBroadcastModalOpen] = useState<boolean>(false);
  const [broadcastText, setBroadcastText] = useState<string>(currentBannerText || '');
  const [broadcastTone, setBroadcastTone] = useState<string>('#2F3E3B');

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    setBroadcastText(currentBannerText || '');
  }, [currentBannerText]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        // ignorera lagringsfel
      }
      return next;
    });
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/overview');
      if (!res.ok) throw new Error('Kunde inte hämta översikt');
      const data: AiOverviewData = await res.json();
      setOverview(data);
      try {
        localStorage.setItem(STORIES_LOCAL_CACHE_KEY, JSON.stringify(data.stories));
      } catch {
        // ignorera
      }
    } catch (err) {
      console.warn('Kunde inte läsa AI-översikt från servern:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleToggleStoryStatus = useCallback(
    async (story: StoryRecord, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const nextStatus: StoryStatus =
        story.status === 'Publicerad' ? 'Granskas' : 'Publicerad';

      // Optimistisk uppdatering
      setOverview((prev) => ({
        ...prev,
        stories: prev.stories.map((s) =>
          s.id === story.id ? { ...s, status: nextStatus } : s
        ),
      }));
      setSelectedStory((prev) =>
        prev && prev.id === story.id ? { ...prev, status: nextStatus } : prev
      );

      try {
        const res = await fetch(`/api/ai/stories/${encodeURIComponent(story.id)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (res.ok) {
          const payload = await res.json();
          if (payload.overview) setOverview(payload.overview);
          onNotify(
            `"${story.title}" är nu markerad som ${nextStatus.toLowerCase()}.`,
            'success'
          );
        }
      } catch {
        onNotify('Status uppdaterad lokalt.', 'info');
      }
    },
    [onNotify]
  );

  const handleSwitchModel = useCallback(
    async (modelId: AiModelId) => {
      if (modelId === overview.activeModel || isSwitchingModel) return;
      setIsSwitchingModel(true);
      try {
        const res = await fetch('/api/ai/switch-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Kunde inte byta modell');
        if (data.overview) setOverview(data.overview);
        onNotify(`Aktiv AI-modell ändrad till ${modelId}.`, 'success');
      } catch (err) {
        onNotify(
          err instanceof Error ? err.message : 'Kunde inte växla AI-modell.',
          'warning'
        );
      } finally {
        setIsSwitchingModel(false);
      }
    },
    [isSwitchingModel, onNotify, overview.activeModel]
  );

  const handleClearCache = useCallback(async () => {
    if (isClearingCache) return;
    setIsClearingCache(true);
    try {
      const res = await fetch('/api/ai/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte rensa cache');
      if (data.overview) setOverview(data.overview);
      onNotify(
        data.clearedCount > 0
          ? `Rensade ${data.clearedCount} cachade AI-utkast.`
          : 'AI-cachen är redan tom och redo.',
        'info'
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Kunde inte rensa AI-cache.',
        'warning'
      );
    } finally {
      setIsClearingCache(false);
    }
  }, [isClearingCache, onNotify]);

  const handleGenerateTestStory = useCallback(
    async (themeInput?: string) => {
      if (isGeneratingStory) return;
      const chosenTheme = (themeInput || customTheme || 'Virkad skogsmagi').trim();
      setTestStoryModalOpen(false);
      setIsGeneratingStory(true);

      try {
        const res = await fetch('/api/ai/generate-test-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: chosenTheme,
            author: 'Admin (Testsaga)',
            useCache: false,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.overview) setOverview(data.overview);
          throw new Error(data.error || 'Misslyckades att generera testsaga.');
        }

        let createdStory: StoryRecord = data.story;
        if (autoPublishTests && createdStory?.id) {
          const patchRes = await fetch(
            `/api/ai/stories/${encodeURIComponent(createdStory.id)}/status`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Publicerad' }),
            }
          );
          if (patchRes.ok) {
            const patchData = await patchRes.json();
            createdStory = patchData.story || createdStory;
            if (patchData.overview) {
              setOverview(patchData.overview);
            }
          }
        } else if (data.overview) {
          setOverview(data.overview);
        }

        setSelectedStory(createdStory);
        onNotify(
          `Ny AI-testsaga skapad på ${data.latencyMs} ms med ${overview.activeModel}.`,
          'success'
        );
      } catch (err) {
        onNotify(
          err instanceof Error ? err.message : 'Kunde inte skapa testsaga.',
          'warning'
        );
      } finally {
        setIsGeneratingStory(false);
      }
    },
    [autoPublishTests, customTheme, isGeneratingStory, onNotify, overview.activeModel]
  );

  const handlePublishBroadcast = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = broadcastText.trim();
      if (!trimmed) {
        onNotify('Skriv ett meddelande innan du skickar ut det.', 'warning');
        return;
      }
      onBroadcastAnnouncement(trimmed, broadcastTone);
      setBroadcastModalOpen(false);
      onNotify('Systemmeddelandet har publicerats i webbplatsens toppbanner.', 'success');
    },
    [broadcastText, broadcastTone, onBroadcastAnnouncement, onNotify]
  );

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return overview.stories.filter((story) => {
      const matchesStatus = statusFilter === 'Alla' || story.status === statusFilter;
      const matchesQuery =
        !q ||
        story.title.toLowerCase().includes(q) ||
        story.author.toLowerCase().includes(q) ||
        story.theme.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [overview.stories, searchQuery, statusFilter]);

  const maxCalls = useMemo(() => {
    return Math.max(1, ...overview.hourlyCalls.map((b) => b.calls));
  }, [overview.hourlyCalls]);

  const activeHoverBucket = useMemo(() => {
    if (!hoveredBucketId) return overview.hourlyCalls[overview.hourlyCalls.length - 1] || null;
    return overview.hourlyCalls.find((b) => b.id === hoveredBucketId) || null;
  }, [hoveredBucketId, overview.hourlyCalls]);

  const showAiOverviewGrid = storeKpis.activeTab === 'all';

  // Design tokens baserat på mörkt/ljust sagoläge
  const shellBg = isDark
    ? 'bg-[#0B0E1A] text-slate-100 border-indigo-500/20 shadow-[0_24px_64px_-16px_rgba(11,14,26,0.55)]'
    : 'bg-[#FAF9F6] text-stone-900 border-stone-200/90 shadow-[0_20px_50px_-16px_rgba(30,27,75,0.08)]';

  const cardSurface = isDark
    ? 'bg-slate-900/65 backdrop-blur-md border border-white/10'
    : 'bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.03)]';

  const subSurface = isDark
    ? 'bg-white/[0.04] border border-white/[0.08]'
    : 'bg-stone-50/90 border border-stone-200/70';

  const mutedText = isDark ? 'text-slate-400' : 'text-stone-500';
  const headingText = isDark ? 'text-white' : 'text-stone-900';

  return (
    <div className={isDark ? 'dark' : ''}>
      <section
        aria-label="Sagomaskan Adminpanel-översikt"
        className={`relative overflow-hidden rounded-[26px] border transition-colors duration-300 ${shellBg}`}
      >
        {/* Subtil sagolik atmosfärisk övertoning */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-36 -left-24 h-80 w-80 rounded-full blur-3xl ${
            isDark ? 'bg-violet-600/20' : 'bg-violet-300/25'
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-28 right-12 h-72 w-72 rounded-full blur-3xl ${
            isDark ? 'bg-amber-500/10' : 'bg-amber-200/35'
          }`}
        />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-current/10">
            <div className="flex items-center gap-2.5 text-xs font-medium tracking-wide">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                  isDark
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-400/25'
                    : 'bg-violet-100 text-violet-800 border border-violet-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className={headingText}>Sagomaskan Studio</span>
              <span className={mutedText}>·</span>
              <span className={mutedText}>
                {storeKpis.adminEmail || 'sagomaskan@outlook.com'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
                aria-label="Växla ljust eller mörkt tema"
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-300" />
                    <span>Ljust läge</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-700" />
                    <span>Sagokväll</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onTogglePinForm}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Byt PIN</span>
              </button>

              <button
                type="button"
                onClick={onLockAdmin}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Lås</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-400/25'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logga ut</span>
              </button>
            </div>
          </div>

          {/* Hero Header */}
          <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="max-w-2xl">
              <h1
                className={`font-display text-2xl sm:text-3xl lg:text-[2.15rem] font-semibold tracking-tight leading-tight ${headingText}`}
              >
                Välkommen tillbaka, Admin
              </h1>
              <p className={`mt-2 text-sm sm:text-[0.94rem] leading-relaxed ${mutedText}`}>
                Övervaka AI-genererade sagor i realtid, följ Google GenAI-modellens hälsa och
                hantera dina virkade alster, inkomna beställningar och kundmeddelanden från samma vy.
              </p>
            </div>

            {/* Kompakt Butikssynk-rad som håller ihop med de befintliga admin-flikarna */}
            <div
              className={`inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-2.5 text-xs ${subSurface}`}
            >
              <button
                type="button"
                onClick={() => onSelectAdminTab('products')}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className={mutedText}>Skapelser:</span>
                <span className={`font-mono-num font-semibold ${headingText}`}>
                  {storeKpis.products}
                </span>
              </button>
              <span className={mutedText}>·</span>
              <button
                type="button"
                onClick={() => onSelectAdminTab('orders')}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className={mutedText}>Ordrar:</span>
                <span className={`font-mono-num font-semibold ${headingText}`}>
                  {storeKpis.orders}
                </span>
              </button>
              <span className={mutedText}>·</span>
              <button
                type="button"
                onClick={() => onSelectAdminTab('messages')}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className={mutedText}>Olästa:</span>
                <span
                  className={`font-mono-num font-semibold ${
                    storeKpis.unreadMessages > 0
                      ? isDark
                        ? 'text-amber-300'
                        : 'text-amber-700'
                      : headingText
                  }`}
                >
                  {storeKpis.unreadMessages}
                </span>
              </button>
              <span className={mutedText}>·</span>
              <button
                type="button"
                onClick={() => onSelectAdminTab('discounts')}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className={mutedText}>Rabattkoder:</span>
                <span className={`font-mono-num font-semibold ${headingText}`}>
                  {storeKpis.discounts}
                </span>
              </button>
            </div>
          </div>

          {/* 4 Glaskort (Statistiköversikt) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Kort 1: Aktiva sagor idag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.02 }}
              className={`rounded-2xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`text-xs font-medium tracking-wide ${mutedText}`}>
                  Aktiva sagor idag
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isDark
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-400/20'
                      : 'bg-violet-50 text-violet-700 border border-violet-200'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`mt-3 font-display font-mono-num text-2xl sm:text-[1.75rem] font-semibold tracking-tight ${headingText}`}
              >
                {formatNumberSv(overview.stats.activeStoriesToday)}
              </div>
              <div className={`mt-1.5 text-xs ${mutedText}`}>
                <span className="font-mono-num">{overview.stats.publishedCount}</span> publicerade
                {' · '}
                <span className="font-mono-num">{overview.stats.reviewCount}</span> granskas i flödet
              </div>
            </motion.div>

            {/* Kort 2: Genererade tecken/tokens */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.06 }}
              className={`rounded-2xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`text-xs font-medium tracking-wide ${mutedText}`}>
                  Genererade tecken / tokens
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isDark
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-400/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`mt-3 font-display font-mono-num text-2xl sm:text-[1.75rem] font-semibold tracking-tight ${headingText}`}
              >
                {formatCompactSv(overview.stats.totalTokens)}
              </div>
              <div className={`mt-1.5 text-xs ${mutedText}`}>
                <span className="font-mono-num">
                  {formatCompactSv(overview.stats.totalCharacters)}
                </span>{' '}
                tecken producerade idag
              </div>
            </motion.div>

            {/* Kort 3: Aktiva sagoförfattare */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className={`rounded-2xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`text-xs font-medium tracking-wide ${mutedText}`}>
                  Aktiva sagoförfattare
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isDark
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-400/20'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}
                >
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`mt-3 font-display font-mono-num text-2xl sm:text-[1.75rem] font-semibold tracking-tight ${headingText}`}
              >
                {formatNumberSv(overview.stats.activeAuthors)}
              </div>
              <div className={`mt-1.5 text-xs ${mutedText}`}>
                Unika författare aktiva senaste 24 tim
              </div>
            </motion.div>

            {/* Kort 4: Systemstatus (AI-modellens status) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.14 }}
              className={`rounded-2xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`text-xs font-medium tracking-wide ${mutedText}`}>
                  Systemstatus (AI-modell)
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    overview.stats.systemStatus === 'Operativ'
                      ? isDark
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDark
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-400/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <Cpu className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    overview.stats.systemStatus === 'Operativ'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
                <span
                  className={`font-display text-lg sm:text-xl font-semibold tracking-tight ${headingText}`}
                >
                  {overview.stats.systemStatus}
                </span>
              </div>
              <div className={`mt-1.5 text-xs truncate ${mutedText}`}>
                {overview.activeModel} ·{' '}
                <span className="font-mono-num">{overview.stats.avgLatencyMs} ms</span> snitt
              </div>
            </motion.div>
          </div>

          {/* Tvåkolumns huvudinnehåll (visas under fliken Översikt) */}
          {showAiOverviewGrid && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Vänster kolumn: Senast skapade sagorna (Live-flöde) */}
              <div className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-current/10">
                  <div>
                    <h2 className={`font-display text-lg font-semibold ${headingText}`}>
                      Senast skapade sagorna
                    </h2>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Live-flöde · Klicka på en rad för att förhandsgranska sagan
                    </p>
                  </div>

                  {/* Sök & Statusfilter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search
                        className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${mutedText}`}
                      />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Sök saga eller författare..."
                        aria-label="Sök bland skapade sagor"
                        className={`h-8 w-44 sm:w-48 rounded-lg pl-8 pr-2.5 text-xs outline-none transition-colors ${
                          isDark
                            ? 'bg-white/[0.06] text-white placeholder:text-slate-400 border border-white/10 focus:border-violet-400/60'
                            : 'bg-stone-100 text-stone-900 placeholder:text-stone-400 border border-stone-200 focus:border-violet-500'
                        }`}
                      />
                    </div>

                    <div
                      className={`inline-flex rounded-lg p-0.5 ${
                        isDark
                          ? 'bg-white/[0.05] border border-white/10'
                          : 'bg-stone-100 border border-stone-200'
                      }`}
                    >
                      {(['Alla', 'Publicerad', 'Granskas'] as const).map((tab) => {
                        const active = statusFilter === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                              active
                                ? isDark
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-white text-stone-900 shadow-xs'
                                : `${mutedText} hover:text-current`
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Lista med sagor */}
                <div className="mt-3 divide-y divide-current/10">
                  {isGeneratingStory && (
                    <div className="py-3.5 flex items-center gap-3.5 animate-pulse">
                      <div
                        className={`h-10 w-10 rounded-xl shrink-0 ${
                          isDark ? 'bg-violet-500/20' : 'bg-violet-100'
                        }`}
                      />
                      <div className="flex-1 space-y-2">
                        <div
                          className={`h-3.5 w-2/3 rounded ${
                            isDark ? 'bg-white/10' : 'bg-stone-200'
                          }`}
                        />
                        <div
                          className={`h-2.5 w-1/2 rounded ${
                            isDark ? 'bg-white/5' : 'bg-stone-100'
                          }`}
                        />
                      </div>
                      <span className={`text-xs ${mutedText}`}>Skapar med AI...</span>
                    </div>
                  )}

                  {isLoadingOverview && overview.stories.length === 0 ? (
                    <div className="py-6 space-y-3">
                      {[1, 2, 3].map((row) => (
                        <div key={row} className="h-12 rounded-xl bg-current/5 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredStories.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className={`text-sm font-medium ${headingText}`}>
                        Inga sagor matchar filtret
                      </p>
                      <p className={`text-xs mt-1 ${mutedText}`}>
                        Rensa sökfältet eller skapa en ny AI-testsaga direkt via snabbåtgärderna.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('Alla');
                        }}
                        className={`mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium cursor-pointer ${
                          isDark
                            ? 'bg-violet-600 hover:bg-violet-500 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        Visa alla sagor
                      </button>
                    </div>
                  ) : (
                    filteredStories.map((story) => {
                      const { Icon, boxClass } = getThemeVisual(story.theme, isDark);
                      const isPublished = story.status === 'Publicerad';
                      return (
                        <motion.div
                          key={story.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedStory(story)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedStory(story);
                            }
                          }}
                          className={`group -mx-2 px-2 py-3.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${boxClass}`}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium truncate transition-colors ${headingText} ${
                                  isDark
                                    ? 'group-hover:text-violet-300'
                                    : 'group-hover:text-violet-700'
                                }`}
                              >
                                {story.title}
                              </p>
                              <p className={`text-xs truncate mt-0.5 ${mutedText}`}>
                                {story.author} ·{' '}
                                <span className="font-mono-num">
                                  {formatNumberSv(story.tokens)}
                                </span>{' '}
                                tokens · {formatRelativeTimeSv(story.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleStoryStatus(story, e)}
                              title="Klicka för att växla status"
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                                isPublished
                                  ? isDark
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25 hover:bg-emerald-500/25'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : isDark
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-400/25 hover:bg-amber-500/25'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {isPublished ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Clock className="h-3.5 w-3.5" />
                              )}
                              <span>{story.status}</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Höger kolumn: AI- och systemhälsa */}
              <div className={`lg:col-span-5 rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-current/10">
                  <div>
                    <h2 className={`font-display text-lg font-semibold ${headingText}`}>
                      AI- och systemhälsa
                    </h2>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Google GenAI · Dagens anropsvolym och svarstid
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchOverview}
                    title="Uppdatera mätvärden"
                    className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                      isDark
                        ? 'text-slate-300 hover:bg-white/10'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* Interaktiv Stapelgraf över dagens AI-anrop */}
                <div className={`mt-4 rounded-xl p-4 ${subSurface}`}>
                  <div className="flex items-baseline justify-between gap-2 mb-4">
                    <div>
                      <span className={`text-[11px] uppercase tracking-wider font-semibold ${mutedText}`}>
                        {activeHoverBucket ? `Kl ${activeHoverBucket.label}` : 'Totalt idag'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className={`font-display font-mono-num text-xl font-semibold ${headingText}`}>
                          {activeHoverBucket
                            ? `${activeHoverBucket.calls} anrop`
                            : `${overview.stats.totalCallsToday} anrop`}
                        </span>
                        {activeHoverBucket && (
                          <span className={`font-mono-num text-xs ${mutedText}`}>
                            · {activeHoverBucket.avgLatencyMs} ms ·{' '}
                            {formatCompactSv(activeHoverBucket.tokens)} tok
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isDark ? 'text-emerald-300' : 'text-emerald-700'
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span className="font-mono-num">{overview.stats.lastLatencyMs} ms</span>
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-7 gap-2 items-end h-32 pt-2"
                    onMouseLeave={() => setHoveredBucketId(null)}
                  >
                    {overview.hourlyCalls.map((bucket) => {
                      const heightPct = Math.max(18, Math.round((bucket.calls / maxCalls) * 100));
                      const isHovered = hoveredBucketId === bucket.id;
                      return (
                        <div
                          key={bucket.id}
                          onMouseEnter={() => setHoveredBucketId(bucket.id)}
                          className="flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                        >
                          <div className="w-full flex-1 flex items-end justify-center">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPct}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className={`w-full max-w-[28px] rounded-t-md transition-colors ${
                                isHovered
                                  ? isDark
                                    ? 'bg-amber-400'
                                    : 'bg-amber-500'
                                  : isDark
                                  ? 'bg-violet-500/75 group-hover:bg-violet-400'
                                  : 'bg-violet-600/80 group-hover:bg-violet-700'
                              }`}
                            />
                          </div>
                          <span className={`font-mono-num text-[10px] ${mutedText}`}>
                            {bucket.label.slice(0, 2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nyckeltal för svarstid & cache */}
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className={`rounded-xl p-3 ${subSurface}`}>
                    <div className={`text-[11px] ${mutedText}`}>Snittsvarstid</div>
                    <div className={`font-mono-num text-sm font-semibold mt-0.5 ${headingText}`}>
                      {overview.stats.avgLatencyMs} ms
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${subSurface}`}>
                    <div className={`text-[11px] ${mutedText}`}>Anrop idag</div>
                    <div className={`font-mono-num text-sm font-semibold mt-0.5 ${headingText}`}>
                      {overview.stats.totalCallsToday}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${subSurface}`}>
                    <div className={`text-[11px] ${mutedText}`}>Cachade svar</div>
                    <div className={`font-mono-num text-sm font-semibold mt-0.5 ${headingText}`}>
                      {overview.cacheSize} st
                    </div>
                  </div>
                </div>

                {/* Modellväxlare & Cache-rensning */}
                <div className="mt-5 pt-4 border-t border-current/10 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`font-medium ${headingText}`}>Växla AI-modell</span>
                      <span className={`font-mono-num text-[11px] ${mutedText}`}>
                        {overview.activeModel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {overview.availableModels.map((model) => {
                        const selected = overview.activeModel === model.id;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            disabled={isSwitchingModel}
                            onClick={() => handleSwitchModel(model.id)}
                            className={`rounded-xl p-2.5 text-left border transition-all cursor-pointer ${
                              selected
                                ? isDark
                                  ? 'bg-violet-600/25 border-violet-400/60 text-white'
                                  : 'bg-violet-50 border-violet-500 text-violet-950'
                                : isDark
                                ? 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07]'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <div className="text-xs font-semibold">{model.label}</div>
                            <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                              {model.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className={`text-xs ${mutedText}`}>
                      {overview.geminiConfigured
                        ? 'Google GenAI ansluten server-side'
                        : 'Saknar GEMINI_API_KEY på server'}
                    </span>
                    <button
                      type="button"
                      disabled={isClearingCache}
                      onClick={handleClearCache}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.05] hover:bg-white/[0.11] text-slate-200 border-white/10'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{isClearingCache ? 'Rensar...' : 'Rensa cache'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrerad snabbåtgärdsrad längst ned i översikten */}
          <div className="mt-6 pt-5 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <SlidersHorizontal className={`h-3.5 w-3.5 ${mutedText}`} />
              <span className={`font-medium ${headingText}`}>Snabbåtgärder</span>
              <span className={mutedText}>·</span>
              <span className={mutedText}>Direktkommandon för Admin</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                disabled={isGeneratingStory}
                onClick={() => setTestStoryModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-violet-950/25 transition-all cursor-pointer disabled:opacity-60"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>{isGeneratingStory ? 'Skapar testsaga...' : 'Skapa testsaga'}</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBroadcastModalOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-400/30'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}
              >
                <Megaphone className="h-3.5 w-3.5" />
                <span>Skicka systemmeddelande</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSettingsOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-100 border-white/15'
                    : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Öppna inställningar</span>
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Flytande Snabbåtgärder-docka i nedre högra hörnet på större skärmar */}
      {showAiOverviewGrid && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`hidden md:flex fixed bottom-5 right-5 z-40 items-center gap-1.5 rounded-2xl p-1.5 border shadow-2xl backdrop-blur-xl ${
            isDark
              ? 'bg-[#121629]/90 border-violet-400/25 text-white'
              : 'bg-white/95 border-stone-200 text-stone-900'
          }`}
          role="toolbar"
          aria-label="Flytande snabbåtgärder"
        >
          <button
            type="button"
            disabled={isGeneratingStory}
            onClick={() => setTestStoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>{isGeneratingStory ? 'Genererar...' : 'Testsaga'}</span>
          </button>
          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-amber-200' : 'hover:bg-stone-100 text-stone-800'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Meddelande</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Öppna inställningar"
            className={`inline-flex items-center justify-center rounded-xl p-2 transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Modal 1: Förhandsgranska saga */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStory(null)}
            className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#121629] border-white/15 text-slate-100'
                  : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`text-xs font-medium ${mutedText}`}>
                    {selectedStory.author} · {selectedStory.model} ·{' '}
                    <span className="font-mono-num">
                      {formatNumberSv(selectedStory.tokens)}
                    </span>{' '}
                    tokens
                  </div>
                  <h3 className={`font-display text-xl font-semibold mt-1 ${headingText}`}>
                    {selectedStory.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStory(null)}
                  className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-stone-100 text-stone-500'
                  }`}
                  aria-label="Stäng förhandsvisning"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className={`mt-4 max-h-72 overflow-y-auto rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line ${subSurface}`}
              >
                {selectedStory.content}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className={`font-mono-num text-xs ${mutedText}`}>
                  {formatNumberSv(selectedStory.characters)} tecken ·{' '}
                  {formatRelativeTimeSv(selectedStory.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStoryStatus(selectedStory)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                      selectedStory.status === 'Publicerad'
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedStory.status === 'Publicerad'
                      ? 'Flytta till Granskas'
                      : 'Godkänn & Publicera'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStory(null)}
                    className={`rounded-xl px-4 py-2 text-xs font-medium cursor-pointer ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    Stäng
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 2: Skapa AI-testsaga */}
      <AnimatePresence>
        {testStoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTestStoryModalOpen(false)}
            className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#121629] border-white/15 text-slate-100'
                  : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`font-display text-lg font-semibold ${headingText}`}>
                  Skapa AI-testsaga
                </h3>
                <button
                  type="button"
                  onClick={() => setTestStoryModalOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-current/10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className={`text-xs mt-1 ${mutedText}`}>
                Anropar Google GenAI ({overview.activeModel}) på serversidan och loggar svarstid
                och tokens i live-flödet.
              </p>

              <div className="mt-4">
                <label className={`block text-xs font-medium mb-1.5 ${headingText}`}>
                  Sagans tema eller ledord
                </label>
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="T.ex. Virkad räv i stjärnskog"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                    isDark
                      ? 'bg-white/[0.06] border-white/15 text-white focus:border-violet-400'
                      : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-violet-500'
                  }`}
                />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {QUICK_STORY_THEMES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomTheme(preset)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                        customTheme === preset
                          ? 'bg-violet-600 text-white border-violet-500'
                          : isDark
                          ? 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/10'
                          : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTestStoryModalOpen(false)}
                  className={`rounded-xl px-4 py-2 text-xs font-medium cursor-pointer ${
                    isDark ? 'bg-white/10 text-slate-200' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateTestStory(customTheme)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generera nu</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 3: Skicka systemmeddelande till användare */}
      <AnimatePresence>
        {broadcastModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBroadcastModalOpen(false)}
            className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.form
              onSubmit={handlePublishBroadcast}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#121629] border-white/15 text-slate-100'
                  : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`font-display text-lg font-semibold ${headingText}`}>
                  Skicka systemmeddelande
                </h3>
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-current/10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className={`text-xs mt-1 ${mutedText}`}>
                Meddelandet visas omedelbart i webbplatsens toppbanner för alla aktiva besökare
                och synkas med Firestore.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${headingText}`}>
                    Meddelandetext
                  </label>
                  <textarea
                    rows={3}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="T.ex. Nya AI-sagoteman finns nu live! Beställ handvirkade figurer med fri frakt över 800 kr."
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
                      isDark
                        ? 'bg-white/[0.06] border-white/15 text-white focus:border-amber-400'
                        : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${headingText}`}>
                    Bannerfärg
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'Skogsgrön', hex: '#2F3E3B' },
                      { label: 'Midnattsblå', hex: '#1E1B4B' },
                      { label: 'Djup plommon', hex: '#4C1D95' },
                      { label: 'Varm bärnsten', hex: '#92400E' },
                    ].map((tone) => (
                      <button
                        key={tone.hex}
                        type="button"
                        onClick={() => setBroadcastTone(tone.hex)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium border cursor-pointer transition-all ${
                          broadcastTone === tone.hex
                            ? 'ring-2 ring-violet-400 border-white text-white'
                            : 'border-white/15 text-white/90 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: tone.hex }}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className={`rounded-xl px-4 py-2 text-xs font-medium cursor-pointer ${
                    isDark ? 'bg-white/10 text-slate-200' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Publicera meddelande</span>
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 4: Öppna inställningar */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#121629] border-white/15 text-slate-100'
                  : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-current/10">
                <h3 className={`font-display text-lg font-semibold ${headingText}`}>
                  Admin & AI-inställningar
                </h3>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-current/10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className={`rounded-xl p-3.5 flex items-center justify-between gap-3 ${subSurface}`}>
                  <div>
                    <div className={`text-xs font-semibold ${headingText}`}>
                      Auto-publicera testsagor
                    </div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                      Markera nyskapade AI-testsagor som Publicerad direkt
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoPublishTests}
                    onClick={() => setAutoPublishTests((v) => !v)}
                    className={`h-6 w-11 rounded-full transition-colors p-0.5 cursor-pointer ${
                      autoPublishTests ? 'bg-violet-600' : 'bg-slate-600/50'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                        autoPublishTests ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className={`rounded-xl p-3.5 flex items-center justify-between gap-3 ${subSurface}`}>
                  <div>
                    <div className={`text-xs font-semibold ${headingText}`}>
                      Gränssnittets färgtema
                    </div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                      Växla mellan Sagokväll (mörkt) och Dagsljus (ljust)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
                      isDark ? 'bg-white/10 text-white' : 'bg-stone-200 text-stone-900'
                    }`}
                  >
                    {isDark ? 'Sagokväll' : 'Dagsljus'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      onSelectAdminTab('banners');
                    }}
                    className={`rounded-xl p-3 text-left border transition-colors cursor-pointer ${subSurface} hover:border-violet-400/50`}
                  >
                    <div className={`text-xs font-semibold ${headingText}`}>
                      Banner & Startsida
                    </div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                      Video, hjältebild & texter
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      onTogglePinForm();
                    }}
                    className={`rounded-xl p-3 text-left border transition-colors cursor-pointer ${subSurface} hover:border-violet-400/50`}
                  >
                    <div className={`text-xs font-semibold ${headingText}`}>
                      Säkerhet & PIN-kod
                    </div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                      Uppdatera administratörskod
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
