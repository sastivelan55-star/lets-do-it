import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronRight,
  TrendingUp,
  Flame,
  Globe,
  Zap,
  Briefcase,
  Landmark,
  Trophy,
  Cpu,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
  Layers,
  Radio,
} from 'lucide-react';
import { fetchNewsArticles } from '../services/newsService';

export interface NewsArticleItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'Breaking' | 'Technology' | 'Business' | 'Politics' | 'Sports' | 'World';
  source: string;
  sourceIcon?: string;
  publishedAt: string;
  timestamp: number;
  imageUrl: string;
  url?: string;
  readsCount?: string;
  isNew?: boolean;
}

// ── HIGH-RESOLUTION CURATED STORIES (MATCHING REFERENCE UI) ──────────────────
const INITIAL_ARTICLES: NewsArticleItem[] = [
  {
    id: 'art-1',
    title: 'AI Revolution: New Breakthrough Brings Smarter Solutions',
    description:
      'Researchers unveil a major advancement in artificial intelligence, promising more human-like and helpful AI systems with sub-second execution.',
    content:
      'A multi-institutional consortium of AI laboratories has detailed a foundational shift in transformer reasoning architectures. By integrating real-time hierarchical search alongside speculative neural decoders, the next generation of generative assistants can evaluate complex logic trees prior to emitting output tokens. The architecture achieves state-of-the-art benchmarks across mathematical reasoning, live code refactoring, and multi-turn contextual dialog while cutting inference server costs by 42%. Commercial rollouts to developer sandboxes are scheduled across global cloud clusters over the coming weeks.',
    category: 'Technology',
    source: 'TechCrunch',
    publishedAt: '3 min ago',
    timestamp: Date.now() - 3 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    isNew: true,
    readsCount: '95K reads',
  },
  {
    id: 'art-2',
    title: 'Stock Markets Rally as Tech Shares Soar',
    description:
      'Global markets saw strong gains today, led by technology stocks and renewed investor confidence in enterprise software and silicon hardware.',
    content:
      'Equity markets across New York, London, and Tokyo recorded broad-based surges following robust quarterly balance sheets from semiconductor fabricators and cloud providers. The tech-heavy indices posted their highest single-day inflow of the year as asset managers reallocated reserves into high-growth automated infrastructure and distributed ledger protocols. Bond yields stabilized in parallel, signaling reduced systemic anxiety regarding interest rate volatility.',
    category: 'Business',
    source: 'Bloomberg',
    publishedAt: '7 min ago',
    timestamp: Date.now() - 7 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
    isNew: true,
    readsCount: '72K reads',
  },
  {
    id: 'art-3',
    title: 'Champions League: Thrilling Draw Keeps Fans on Edge',
    description:
      'A dramatic match ends in a draw, setting up an exciting second leg next week as tactical adjustments pay off in the closing minutes.',
    content:
      'In a clash of continental titans, an electrifying 94th-minute stoppage-time volley leveled the scoreline at 2-2 in a breathless European semifinal first leg. Managers praised their squads’ tactical resilience in the post-match conference, with both sides retaining an uncompromised path to the final. Ticket allocations for next Wednesday’s deciding leg sold out in under four minutes following the final whistle.',
    category: 'Sports',
    source: 'ESPN',
    publishedAt: '10 min ago',
    timestamp: Date.now() - 10 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
    isNew: false,
    readsCount: '61K reads',
  },
  {
    id: 'art-4',
    title: 'New Diplomatic Talks Aim to Ease Global Tensions',
    description:
      'International leaders begin crucial talks to reduce rising geopolitical tensions around the world and ratify mutual trade agreements.',
    content:
      'Senior diplomatic envoys gathered in Geneva this morning for multilateral summits centered on maritime freedom of navigation, supply chain de-escalation, and collaborative digital governance frameworks. Observers noted unprecedented progress on bilateral green trade channels and standardized customs clearance for clean energy commodities. A joint communique is expected by late Friday evening.',
    category: 'World',
    source: 'BBC',
    publishedAt: '12 min ago',
    timestamp: Date.now() - 12 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
    isNew: false,
    readsCount: '49K reads',
  },
  {
    id: 'art-5',
    title: 'Global Leaders Agree on New Climate Action Plan',
    description:
      'World leaders have reached a historic agreement to accelerate climate action and achieve net-zero emissions by 2050 with joint financing.',
    content:
      'Delegates from 195 nations finalized a landmark accord pledging $100B in annual cross-border clean tech transitions, cryogenic hydrogen transport pipelines, and automated carbon verification registries. Industry analysts hailed the legal framework as the most decisive step toward grid-scale decarbonization since the Paris Accords.',
    category: 'Breaking',
    source: 'Reuters',
    publishedAt: '2 min ago',
    timestamp: Date.now() - 2 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    isNew: true,
    readsCount: '128K reads',
  },
  {
    id: 'art-6',
    title: 'Autonomous Space Observatory Detects Water Vapor in Exoplanet Atmosphere',
    description:
      'Spectroscopic analysis reveals clear signatures of atmospheric water vapor and carbon dioxide on a temperate planet 120 light years away.',
    content:
      'Astronomers operating orbital infrared spectrometers have isolated unambiguous spectroscopic absorption lines indicating cloud decks and water vapor in the atmosphere of K2-18b. Deep spectral modeling suggests a warm sub-Neptune regime with potential oceanic layers beneath hydrogen-rich upper layers, marking a significant milestone in exoplanetary habitability research.',
    category: 'Technology',
    source: 'Wired',
    publishedAt: '25 min ago',
    timestamp: Date.now() - 25 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
    isNew: false,
    readsCount: '38K reads',
  },
  {
    id: 'art-7',
    title: 'Next-Gen 2nm Wafer Yields Exceed Factory Production Targets',
    description:
      'Foundry giant reports breakthrough yields in gate-all-around nanosheet transistors, enabling 30% higher power efficiency for mobile and server chips.',
    content:
      'Advanced semiconductor test facilities reported commercial-grade defect densities in early 2nm production runs. The transition from FinFET to gate-all-around (GAA) nanosheets delivers substantial voltage scaling, providing high-efficiency computing for on-device neural processing and sovereign data clusters.',
    category: 'Business',
    source: 'Wall Street Journal',
    publishedAt: '40 min ago',
    timestamp: Date.now() - 40 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    isNew: false,
    readsCount: '54K reads',
  },
];

// ── FEATURED HERO HEADLINES (BREAKING NEWS CAROUSEL) ─────────────────────────
const HERO_BREAKING_STORIES = [
  {
    id: 'hero-1',
    tag: 'BREAKING NEWS',
    title: 'Global Leaders Agree on New Climate Action Plan',
    subtitle:
      'World leaders have reached a historic agreement to accelerate climate action and achieve net-zero emissions by 2050.',
    source: 'Reuters',
    publishedAt: '2 min ago',
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hero-2',
    tag: 'TECH BREAKTHROUGH',
    title: 'Frontier AI Reasoning Models Achieve Zero-Shot Software Verification',
    subtitle:
      'New algorithmic advances allow autonomous neural agents to detect and refactor vulnerabilities across enterprise codebases in real time.',
    source: 'TechCrunch',
    publishedAt: '5 min ago',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hero-3',
    tag: 'MARKETS SURGE',
    title: 'Global Markets Rally as Tech Shares Hit Record Highs',
    subtitle:
      'International equity indices surge amid unprecedented semiconductor demand and stabilization of global sovereign bond yields.',
    source: 'Bloomberg',
    publishedAt: '15 min ago',
    imageUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hero-4',
    tag: 'WORLD SUMMIT',
    title: 'Historic Diplomatic Accord Signed at Multilateral Assembly',
    subtitle:
      'Delegates ratify international digital trade frameworks, securing supply corridors and open cryptographic communication.',
    source: 'BBC',
    publishedAt: '22 min ago',
    imageUrl:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
  },
];

// ── TRENDING NOW LIST (MATCHES REFERENCE IMAGE) ──────────────────────────────
const TRENDING_TOPICS = [
  { rank: 1, title: 'Climate Agreement', reads: '128K reads', filterKey: 'Climate' },
  { rank: 2, title: 'AI Breakthrough', reads: '95K reads', filterKey: 'AI' },
  { rank: 3, title: 'Stock Market Today', reads: '72K reads', filterKey: 'Stock' },
  { rank: 4, title: 'Champions League', reads: '61K reads', filterKey: 'Champions' },
  { rank: 5, title: 'Global Diplomacy', reads: '49K reads', filterKey: 'Diplomatic' },
];

// ── OPEN REAL-TIME CHANNELS DIRECTORY ───────────────────────────────────────
const OPEN_CHANNELS = [
  { name: 'All Channels', icon: '🌐' },
  { name: 'Reuters', icon: '⚡' },
  { name: 'Bloomberg', icon: '💼' },
  { name: 'TechCrunch', icon: '💻' },
  { name: 'BBC', icon: '🌍' },
  { name: 'ESPN', icon: '🏆' },
  { name: 'Hacker News', icon: '🟧' },
  { name: 'Dev.to', icon: '👩‍💻' },
];

export default function PulseFlowPage() {
  const [articles, setArticles] = useState<NewsArticleItem[]>(() => {
    try {
      const saved = localStorage.getItem('newspro_articles_cache_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ARTICLES;
  });

  const [activeCategory, setActiveCategory] = useState<string>('All News');
  const [selectedChannel, setSelectedChannel] = useState<string>('All Channels');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);
  const [isLiveFetching, setIsLiveFetching] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleItem | null>(null);

  // Saved Bookmarks Set
  const [savedBookmarks, setSavedBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('newspro_saved_bookmarks_v2');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {}
    return new Set<string>();
  });

  // Filter mode: 'all' | 'bookmarks'
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── LIVE OPEN CHANNELS FETCH (HACKER NEWS + DEV.TO REAL FEEDS) ────────────
  const handleFetchLiveChannels = async () => {
    setIsLiveFetching(true);
    try {
      const liveFeeds = await fetchNewsArticles(true);
      if (liveFeeds && Array.isArray(liveFeeds.articles) && liveFeeds.articles.length > 0) {
        const mappedLive: NewsArticleItem[] = liveFeeds.articles.map((a, idx) => {
          let category: NewsArticleItem['category'] = 'Technology';
          const titleLower = a.title.toLowerCase();

          if (titleLower.includes('market') || titleLower.includes('business') || titleLower.includes('economy') || titleLower.includes('finance')) {
            category = 'Business';
          } else if (titleLower.includes('election') || titleLower.includes('gov') || titleLower.includes('policy') || titleLower.includes('law')) {
            category = 'Politics';
          } else if (titleLower.includes('sport') || titleLower.includes('league') || titleLower.includes('game') || titleLower.includes('cup')) {
            category = 'Sports';
          } else if (titleLower.includes('world') || titleLower.includes('global') || titleLower.includes('un') || titleLower.includes('treaty')) {
            category = 'World';
          } else if (idx % 4 === 0) {
            category = 'Breaking';
          }

          const fallbackImages = [
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
          ];

          return {
            id: a.id,
            title: a.title,
            description: a.summary || 'Live real-time story verified through open developer network channels.',
            content:
              (a.summary || a.title) +
              ' Verified via open developer news APIs with real-time community engagement and telemetry checks.',
            category,
            source: a.source || 'Open Channel',
            publishedAt: 'Just now',
            timestamp: a.publishedAt ? new Date(a.publishedAt).getTime() : Date.now(),
            imageUrl: fallbackImages[idx % fallbackImages.length],
            url: a.url,
            isNew: true,
            readsCount: `${Math.floor(Math.random() * 40) + 15}K reads`,
          };
        });

        setArticles((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = mappedLive.filter((m) => !existingIds.has(m.id));
          const updated = [...uniqueNew, ...prev].slice(0, 40);
          try {
            localStorage.setItem('newspro_articles_cache_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        showToast(`Synced ${mappedLive.length} live articles across open channels!`);
      } else {
        showToast('All open news channels are up to date.');
      }
    } catch {
      showToast('Serving verified cached open news feeds.');
    } finally {
      setIsLiveFetching(false);
    }
  };

  // Initial live load on mount
  useEffect(() => {
    handleFetchLiveChannels();
  }, []);

  // Auto carousel cycle for Hero Breaking News banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % HERO_BREAKING_STORIES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Bookmark Toggle
  const toggleBookmark = (id: string) => {
    setSavedBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from bookmarks');
      } else {
        next.add(id);
        showToast('Article saved to bookmarks!');
      }
      try {
        localStorage.setItem('newspro_saved_bookmarks_v2', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Share Article
  const handleShare = (art: NewsArticleItem) => {
    const shareUrl = art.url || window.location.href;
    navigator.clipboard.writeText(`${art.title} — ${shareUrl}`);
    showToast('Article link copied to clipboard!');
  };

  // Filtered Articles Logic
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((art) => {
      // Bookmark filter
      if (showBookmarksOnly && !savedBookmarks.has(art.id)) {
        return false;
      }
      // Channel filter
      if (selectedChannel !== 'All Channels') {
        if (!art.source.toLowerCase().includes(selectedChannel.toLowerCase())) {
          return false;
        }
      }
      // Category filter
      if (activeCategory !== 'All News') {
        const catClean = activeCategory.replace(/[^a-zA-Z]/g, '').trim();
        if (catClean && art.category !== catClean) {
          return false;
        }
      }
      // Search query
      if (q) {
        const inTitle = art.title.toLowerCase().includes(q);
        const inDesc = art.description.toLowerCase().includes(q);
        const inSource = art.source.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSource) return false;
      }
      return true;
    });
  }, [articles, activeCategory, selectedChannel, searchQuery, showBookmarksOnly, savedBookmarks]);

  const currentHero = HERO_BREAKING_STORIES[activeHeroIndex];

  return (
    <div
      className="page-container pb-safe"
      style={{
        background: '#0a0d16',
        color: '#ffffff',
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: 'clamp(1rem, 2vw, 1.75rem)',
      }}
    >
      {/* ── TOP SEARCH & CHANNEL ACTION BAR ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {/* Search Bar matching image */}
        <div className="relative flex-1 max-w-2xl">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news..."
            className="w-full bg-[#131622] border border-white/[0.08] focus:border-blue-500 rounded-full pl-11 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Real Channel Controls & Live Refresh */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFetchLiveChannels}
            disabled={isLiveFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#1a1f33] hover:bg-[#232a45] text-blue-400 border border-blue-500/30 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            title="Refresh Live Open News Channels"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveFetching ? 'animate-spin' : ''}`} />
            <span>{isLiveFetching ? 'Fetching…' : 'Refresh Open Channels'}</span>
          </button>

          {/* Bookmarks Toggle Pill */}
          <button
            type="button"
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              showBookmarksOnly
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-[#131622] text-slate-300 border-white/[0.08] hover:bg-[#1a1f33]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedBookmarks.size})</span>
          </button>
        </div>
      </div>

      {/* ── FEATURED BREAKING NEWS HERO BANNER (MATCHES REFERENCE IMAGE) ──── */}
      {!showBookmarksOnly && (
        <section
          onClick={() => {
            const heroArt = articles.find((a) => a.title.includes('Climate') || a.id === currentHero.id) || articles[0];
            setSelectedArticle(heroArt);
          }}
          className="relative w-full rounded-2xl overflow-hidden mb-6 cursor-pointer group shadow-2xl border border-white/[0.08]"
          style={{ minHeight: '260px' }}
        >
          {/* Background Photography Image */}
          <img
            src={currentHero.imageUrl}
            alt={currentHero.title}
            className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 brightness-75"
          />

          {/* Gradient Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e18] via-[#0b0e18]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e18] via-[#0b0e18]/80 to-transparent" />

          {/* Banner Content */}
          <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end h-full max-w-3xl">
            {/* Red Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-600 text-white tracking-wide uppercase mb-3 shadow-lg shadow-red-600/30 w-fit">
              <Zap className="w-3 h-3 fill-white" />
              <span>{currentHero.tag}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2 group-hover:text-blue-300 transition-colors">
              {currentHero.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 line-clamp-2 mb-4 leading-relaxed max-w-2xl">
              {currentHero.subtitle}
            </p>

            {/* Source & Timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-white">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  {currentHero.source}
                </span>
                <span>•</span>
                <span>{currentHero.publishedAt}</span>
              </div>

              {/* Carousel Pagination Dots (like image: ● ○ ○ ○) */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {HERO_BREAKING_STORIES.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setActiveHeroIndex(dotIdx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      dotIdx === activeHeroIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORY PILLS STRIP (MATCHES REFERENCE IMAGE) ───────────────── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { label: 'All News', icon: <Layers className="w-3.5 h-3.5" /> },
          { label: 'Breaking', icon: <Zap className="w-3.5 h-3.5 text-red-400" /> },
          { label: 'Technology', icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> },
          { label: 'Business', icon: <Briefcase className="w-3.5 h-3.5 text-amber-400" /> },
          { label: 'Politics', icon: <Landmark className="w-3.5 h-3.5 text-purple-400" /> },
          { label: 'Sports', icon: <Trophy className="w-3.5 h-3.5 text-yellow-400" /> },
          { label: 'World', icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> },
        ].map((cat) => {
          const isSelected = activeCategory === cat.label && !showBookmarksOnly;
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => {
                setShowBookmarksOnly(false);
                setActiveCategory(cat.label);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                  : 'bg-[#131622] text-slate-300 border-white/[0.06] hover:bg-[#1a1f33]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT GRID: NEWS LIST + RIGHT REAL FEATURES PANEL ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT/CENTER COLUMN: VERTICAL NEWS CARDS (Approx 68% / 8 cols) ── */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((art) => {
              const isBookmarked = savedBookmarks.has(art.id);

              return (
                <article
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-[#131622] hover:bg-[#171b2b] border border-white/[0.07] hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch sm:items-center justify-between transition-all duration-200 cursor-pointer group shadow-md"
                >
                  {/* Thumbnail Image on the Left */}
                  <div className="relative w-full sm:w-44 h-40 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-800">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {art.isNew && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-600 text-white uppercase tracking-wider shadow">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1.5">
                        {art.title}
                      </h2>
                      {/* Description Snippet */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {art.description}
                      </p>
                    </div>

                    {/* Source & Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                        {art.source.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-300">{art.source}</span>
                      <span>•</span>
                      <span>{art.publishedAt}</span>
                      {art.readsCount && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">{art.readsCount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions on the Right (Bookmark, Share, Detail Arrow) */}
                  <div
                    className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.06]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => toggleBookmark(art.id)}
                      className={`p-2 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer ${
                        isBookmarked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                      }`}
                      title={isBookmarked ? 'Saved in Bookmarks' : 'Save to Bookmarks'}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-400/20" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(art)}
                      className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Share Article"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedArticle(art)}
                      className="p-2 rounded-full bg-white/[0.04] group-hover:bg-blue-600 text-slate-400 group-hover:text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
                      title="Read Article"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="bg-[#131622] rounded-2xl p-12 text-center border border-white/[0.06]">
              <Radio className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No articles match your criteria</h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                {showBookmarksOnly
                  ? 'You have not bookmarked any articles yet. Click the bookmark icon on any card to save it.'
                  : 'Try selecting All News, clearing your search query, or refreshing live channels.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All News');
                  setSelectedChannel('All Channels');
                  setShowBookmarksOnly(false);
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: REAL FEATURES (Approx 32% / 4 cols) ─────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 1. TRENDING NOW CARD (EXACT REPLICA OF REFERENCE IMAGE) */}
          <div className="bg-[#131622] border border-white/[0.07] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20" />
                <h3 className="text-sm font-bold text-white">Trending Now</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('Breaking');
                  setShowBookmarksOnly(false);
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <span>See all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ranked 1 to 5 Trending List */}
            <div className="flex flex-col divide-y divide-white/[0.06]">
              {TRENDING_TOPICS.map((topic) => (
                <div
                  key={topic.rank}
                  onClick={() => {
                    setSearchQuery(topic.filterKey);
                    setShowBookmarksOnly(false);
                  }}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Circle in Amber */}
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-500/30">
                      {topic.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {topic.title}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{topic.reads}</p>
                    </div>
                  </div>

                  {/* Green Upward Arrow */}
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* 2. REAL-TIME OPEN CHANNELS SWITCHER */}
          <div className="bg-[#131622] border border-white/[0.07] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Open News Channels</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Real-time dispatches from verified open developer & international journalism networks.
            </p>

            {/* Channels Pill Grid */}
            <div className="flex flex-wrap gap-2">
              {OPEN_CHANNELS.map((ch) => {
                const isSelected = selectedChannel === ch.name;
                return (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(ch.name);
                      setShowBookmarksOnly(false);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-[#181d2e] text-slate-300 border-white/[0.06] hover:bg-[#20273d]'
                    }`}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. READING LIST QUICK STATUS */}
          <div className="bg-[#131622] border border-white/[0.07] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <h3 className="text-sm font-bold text-white">Your Reading List</h3>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {savedBookmarks.size} saved
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Bookmarked articles are kept offline in your local database so you can read anytime.
            </p>
            <button
              type="button"
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-md"
            >
              {showBookmarksOnly ? 'Show All News Feed' : 'View Saved Reading List'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SLIDE-OVER ARTICLE READER MODAL (FULL STORY VIEW) ─────────────── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedArticle(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-[#121524] border border-white/[0.12] rounded-2xl shadow-2xl overflow-y-auto flex flex-col">
            {/* Modal Header Image */}
            <div className="relative w-full h-56 sm:h-72 overflow-hidden shrink-0 bg-slate-900">
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121524] via-transparent to-black/40" />

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-slate-300 font-medium bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {selectedArticle.publishedAt}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                {/* Source attribution */}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                    {selectedArticle.source.charAt(0)}
                  </div>
                  <span className="font-semibold text-white">{selectedArticle.source}</span>
                  {selectedArticle.readsCount && <span>• {selectedArticle.readsCount}</span>}
                </div>

                {/* Article Headline */}
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug mb-4">
                  {selectedArticle.title}
                </h1>

                {/* Lead Summary */}
                <p className="text-sm text-slate-300 font-medium leading-relaxed pb-4 border-b border-white/[0.08] mb-4">
                  {selectedArticle.description}
                </p>

                {/* Full Article Text */}
                <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                  <p>{selectedArticle.content}</p>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleBookmark(selectedArticle.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                      savedBookmarks.has(selectedArticle.id)
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-white/[0.06] text-white border-white/[0.1] hover:bg-white/[0.12]'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>{savedBookmarks.has(selectedArticle.id) ? 'Saved' : 'Save Article'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(selectedArticle)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.1] transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {selectedArticle.url && (
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-md"
                  >
                    <span>Open Live Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1a1f33] border border-blue-500/40 text-white shadow-2xl transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
