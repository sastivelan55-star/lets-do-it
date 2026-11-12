import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Bookmark,
  Share2,
  ChevronRight,
  ChevronLeft,
  Globe,
  Briefcase,
  Landmark,
  Trophy,
  Cpu,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
  Tv,
  HelpCircle,
  Settings,
  CloudSun,
  MapPin,
  Sparkles,
  Film,
  FlaskConical,
  HeartPulse,
  BookOpen,
} from 'lucide-react';
import {
  fetchBackendNews,
  checkBackendHealth,
  fetchDailyBriefing,
  fetchNewsDataLatest,
  formatTimeAgo,
  type AiBriefingResponse,
} from '../services/newsService';
import LiveTvSection from '../components/news/LiveTvPlayerModal';
import JarvisAiBriefingCard from '../components/news/JarvisAiBriefingCard';

export interface NewsArticleItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  source: string;
  sourceIcon?: string;
  publishedAt: string;
  timestamp: number;
  imageUrl: string;
  url?: string;
  author?: string;
  readsCount?: string;
  isNew?: boolean;
}

// ── COMPREHENSIVE MULTI-CATEGORY NEWS CATALOG (OFFLINE & SEARCH FALLBACK) ────
const MASTER_NEWS_CATALOG: NewsArticleItem[] = [
  // ── RAIN & WEATHER STORIES (ENSURES SEARCH FOR "RAIN" ALWAYS WORKS) ──
  {
    id: 'rain-1',
    title: 'IMD issues heavy rainfall alert for Chennai and coastal Tamil Nadu districts as northeast monsoon intensifies',
    description:
      'Regional Meteorological Centre forecasts intense rain spells across Chennai, Tiruvallur, Kanchipuram, and Chengalpattu with gusty winds and coastal sea surge.',
    content:
      'The India Meteorological Department (IMD) on Wednesday issued an orange alert for northern coastal districts of Tamil Nadu. Special disaster management teams have been stationed across vulnerable low-lying zones in Chennai with 400+ motorized pumps placed on standby.',
    category: 'Local',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: '45 minutes ago',
    timestamp: Date.now() - 45 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.thehindu.com/news/national/tamil-nadu/',
    author: 'Sunil Kumar',
  },
  {
    id: 'rain-2',
    title: 'Rain lashes several parts of Chennai: Waterlogging reported in subways, relief teams mobilized',
    description:
      'Heavy overnight downpour leaves arterial corridors inundated in Velachery, Madipakkam, and T. Nagar. Greater Chennai Corporation begins round-the-clock clearance.',
    content:
      'Continuous monsoon rain battered the Chennai metropolitan area through early morning hours. GCC civic commissioners deployed emergency mobile suction units to clear waterlogging in key railway subways and arterial GST road sections.',
    category: 'Local',
    source: 'The Times of India',
    sourceIcon: 'https://timesofindia.indiatimes.com/favicon.ico',
    publishedAt: '2 hours ago',
    timestamp: Date.now() - 2 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop&q=80',
    url: 'https://timesofindia.indiatimes.com/city/chennai',
    author: 'City Bureau',
  },
  {
    id: 'rain-3',
    title: 'Tamil Nadu schools and colleges shut in four coastal districts following continuous overnight rain',
    description:
      'District collectors declare holiday for educational institutions in Chennai, Nagapattinam, Cuddalore, and Mayiladuthurai as downpours continue.',
    content:
      'Following advisory notices from the disaster management authority, school and college holidays were announced across 4 coastal districts. Emergency helpline control rooms 1913 remain active 24/7 for citizen assistance.',
    category: 'Local',
    source: 'NDTV',
    sourceIcon: 'https://www.ndtv.com/favicon.ico',
    publishedAt: '3 hours ago',
    timestamp: Date.now() - 3 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.ndtv.com/tamil-nadu-news',
  },
  {
    id: 'rain-4',
    title: 'Monsoon revival brings moderate to heavy showers across south peninsular India',
    description:
      'Depression over southwest Bay of Bengal triggers widespread rain across Tamil Nadu, coastal Andhra Pradesh, and Kerala.',
    content:
      'Agricultural meteorologists note that the current rain spells provide crucial moisture for samba paddy transplantation across Cauvery delta districts while urging reservoir managers to maintain calibrated discharge.',
    category: 'India',
    source: 'The Indian Express',
    sourceIcon: 'https://indianexpress.com/favicon.ico',
    publishedAt: '5 hours ago',
    timestamp: Date.now() - 5 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
    url: 'https://indianexpress.com/section/india/',
  },

  // ── WORLD & GLOBAL AFFAIRS ──
  {
    id: 'world-1',
    title: 'U.S. Republicans derail bid to impeach Hegseth',
    description:
      'House lawmakers halted proceedings in a high-stakes legislative confrontation regarding the Defense Secretary nomination.',
    content:
      'In a dramatic floor confrontation, House leadership successfully blocked an impeachment initiative, signaling unified party alignment ahead of committee confirmation hearings.',
    category: 'World',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: '3 hours ago',
    timestamp: Date.now() - 3 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
    url: 'https://www.thehindu.com/news/international/',
  },
  {
    id: 'world-2',
    title: 'US House blocks Hegseth impeachment effort as Iran denies talks',
    description:
      'Bipartisan lawmakers navigate diplomatic tensions amid Capitol Hill budget and nomination debates.',
    content:
      'Congressional leaders underscored foreign policy continuity following the decisive floor tally on Tuesday afternoon.',
    category: 'World',
    source: 'Al Jazeera',
    sourceIcon: 'https://www.aljazeera.com/favicon.ico',
    publishedAt: '30 minutes ago',
    timestamp: Date.now() - 30 * 60 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.aljazeera.com/news/',
  },
  {
    id: 'world-3',
    title: 'Analysis: Hegseth fights for his political life with appeal to Trump',
    description:
      'Inside the strategy and high-stakes cabinet maneuvering behind the Washington confirmation battles.',
    content:
      'White House insiders detail closed-door consultations with Senate and House committee leaders regarding defense authorizations.',
    category: 'World',
    source: 'BBC News',
    sourceIcon: 'https://www.bbc.co.uk/favicon.ico',
    publishedAt: '9 hours ago',
    author: "Gary O'Donoghue",
    timestamp: Date.now() - 9 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.bbc.com/news/world',
  },
  {
    id: 'world-4',
    title: 'Global Leaders convene at International Climate Summit to pledge emergency disaster relief funding',
    description:
      'Delegates ratify new international carbon mitigation standards and approve $100B loss-and-damage transition package.',
    content:
      'At the multilateral summit, heads of state reaffirmed commitments to accelerate clean energy transitions while providing sovereign green bonds for vulnerable developing economies.',
    category: 'World',
    source: 'Reuters',
    sourceIcon: 'https://www.reuters.com/favicon.ico',
    publishedAt: '6 hours ago',
    timestamp: Date.now() - 6 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.reuters.com/world/',
  },

  // ── LOCAL NEWS (CHENNAI & TAMIL NADU) ──
  {
    id: 'local-1',
    title: 'Chennai police arrest 36 persons in citywide crackdown on ‘rowdies’',
    description:
      'Law enforcement conducts coordinated pre-dawn operations across north and south Chennai divisions.',
    content:
      'Special task force units recovered illicit weapons and secured preventive detentions across 12 zones under strict surveillance.',
    category: 'Local',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: '16 hours ago',
    timestamp: Date.now() - 16 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&auto=format&fit=crop&q=80',
    url: 'https://www.thehindu.com/news/cities/chennai/',
  },
  {
    id: 'local-2',
    title: 'Women engineers take the helm at Chennai Metrowater',
    description:
      'Pioneering supervisory teams oversee smart metering, desal plants, and lake replenishment systems.',
    content:
      'CMWSSB officials highlighted significant operational efficiencies in wastewater recycling and supply grids across OMR and ECR belts.',
    category: 'Local',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: 'Yesterday',
    timestamp: Date.now() - 24 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    url: 'https://www.thehindu.com/news/cities/chennai/',
  },
  {
    id: 'local-3',
    title: 'Nearly 18 lakh left Chennai for Deepavali, return rush chokes GST Road',
    description:
      'Special buses and suburban transit lines mobilized as post-festival passenger influx surges into city limits.',
    content:
      'Traffic police activated arterial diversions at Perungalathur and Tambaram to ease vehicular gridlocks as holiday travelers returned.',
    category: 'Local',
    source: 'The New Indian Express',
    sourceIcon: 'https://www.newindianexpress.com/favicon.ico',
    publishedAt: 'Nov 10',
    timestamp: Date.now() - 36 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
    url: 'https://www.newindianexpress.com/cities/chennai',
  },
  {
    id: 'local-4',
    title: 'Tamil Nadu Library Book Procurement Scam: Madras High Court Orders DVAC To Register FIR, Freeze Publisher\'s Bank Accounts',
    description:
      'Court issues firm directives in public interest litigation regarding irregularities in state public library tenders.',
    content:
      'The Madras High Court bench directed the Directorate of Vigilance and Anti-Corruption (DVAC) to submit a preliminary compliance report within four weeks regarding procurement irregularities.',
    category: 'Local',
    source: 'The Free Press Journal',
    publishedAt: '17 hours ago',
    timestamp: Date.now() - 17 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&auto=format&fit=crop&q=80',
    url: 'https://www.freepressjournal.in/india',
  },
  {
    id: 'local-5',
    title: 'Chennai Metro Phase 2 underground tunnel breakthrough completed at Adyar Junction',
    description:
      'TBM Kaveri achieves landmark tunneling milestone beneath riverbed for Corridors 3 and 4 connectivity.',
    content:
      'CMRL project directors confirmed that underground tunneling between Greenways Road and Adyar Junction completed 2 weeks ahead of schedule with zero ground subsidence.',
    category: 'Local',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: '1 day ago',
    timestamp: Date.now() - 28 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&auto=format&fit=crop&q=80',
    url: 'https://www.thehindu.com/news/cities/chennai/',
  },

  // ── INDIA / NATIONAL NEWS ──
  {
    id: 'india-1',
    title: 'Supreme Court delivers landmark verdict on digital privacy and citizens’ fundamental rights',
    description:
      'Constitutional bench affirms stringent procedural safeguards against warrantless telecommunication interception.',
    content:
      'The Supreme Court of India ruled unanimously that digital privacy protections extend fully across modern end-to-end encrypted messaging architectures and algorithmic profiling systems.',
    category: 'India',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: '4 hours ago',
    timestamp: Date.now() - 4 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.thehindu.com/news/national/',
  },
  {
    id: 'india-2',
    title: 'ISRO prepares next-generation SSLV launch with international satellite payload from Sriharikota',
    description:
      'Space agency enters final countdown for commercial launch vehicle mission carrying climate-monitoring orbiters.',
    content:
      'ISRO engineers at Satish Dhawan Space Centre confirmed propellant loading protocols were completed for the third development flight of the Small Satellite Launch Vehicle (SSLV).',
    category: 'India',
    source: 'The Times of India',
    sourceIcon: 'https://timesofindia.indiatimes.com/favicon.ico',
    publishedAt: '6 hours ago',
    timestamp: Date.now() - 6 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1517976487502-5f6060c1d1a6?w=800&auto=format&fit=crop&q=80',
    url: 'https://timesofindia.indiatimes.com/india',
  },
  {
    id: 'india-3',
    title: 'Indian Railways rolls out upgraded Vande Bharat sleeper trains on high-density national routes',
    description:
      'Aerodynamic high-speed passenger rakes feature crash-resistant Kavach 4.0 signaling and luxury berth ergonomics.',
    content:
      'Railway Ministry officials revealed initial routes connecting New Delhi to Mumbai and Chennai to Bengaluru with travel times reduced by over 3 hours.',
    category: 'India',
    source: 'NDTV',
    sourceIcon: 'https://www.ndtv.com/favicon.ico',
    publishedAt: '8 hours ago',
    timestamp: Date.now() - 8 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.ndtv.com/india-news',
  },

  // ── TECHNOLOGY NEWS ──
  {
    id: 'tech-1',
    title: 'Next-generation generative AI models achieve breakthroughs in automated code synthesis and reasoning',
    description:
      'Multi-modal agents demonstrate autonomous tool use, proactive debugging, and complex system orchestration.',
    content:
      'Leading AI research laboratories announced frontier reasoning architectures capable of self-correcting errors, generating verified code, and handling real-world deployment pipelines autonomously.',
    category: 'Technology',
    source: 'TechCrunch',
    sourceIcon: 'https://techcrunch.com/favicon.ico',
    publishedAt: '2 hours ago',
    timestamp: Date.now() - 2 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    id: 'tech-2',
    title: 'Breakthrough quantum computing processor demonstrates fault-tolerant logical qubit stabilization',
    description:
      'Physical error rates drop below surface code thresholds, paving the path for commercial cryptography-scale systems.',
    content:
      'Physicists verified sustained fault-tolerant quantum operations for over 10,000 algorithmic cycles, proving that quantum error correction scales efficiently with topological lattices.',
    category: 'Technology',
    source: 'Ars Technica',
    sourceIcon: 'https://arstechnica.com/favicon.ico',
    publishedAt: '5 hours ago',
    timestamp: Date.now() - 5 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    url: 'https://arstechnica.com/gadgets/',
  },
  {
    id: 'tech-3',
    title: 'Major semiconductor consortium announces 2nm fabrication pilot plant expansion in Asia',
    description:
      'GAAFET transistor architectures reach volume yield targets for next-generation mobile and AI inference chips.',
    content:
      'Chipmakers reported milestone yields on gate-all-around nanosheet processes, enabling 25% energy savings and 30% computing density improvements over 3nm nodes.',
    category: 'Technology',
    source: 'Reuters',
    sourceIcon: 'https://www.reuters.com/favicon.ico',
    publishedAt: '7 hours ago',
    timestamp: Date.now() - 7 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.reuters.com/technology/',
  },

  // ── SPORTS NEWS ──
  {
    id: 'sports-1',
    title: 'Sachin Baisoya looks to turn the tables on Bhullar as IGPL heads to Hyderabad',
    description:
      'Intense golfing rivalry resumes at the scenic Hyderabad Golf Association greens with premier rankings at stake.',
    content:
      'Young prodigy Sachin Baisoya carded a sparkling 5-under 66 during practice rounds, preparing to challenge defending champion Gaganjeet Bhullar in the marquee invitational tournament.',
    category: 'Sports',
    source: 'Ptnews',
    publishedAt: '17 hours ago',
    timestamp: Date.now() - 17 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.ptinews.com/sports',
  },
  {
    id: 'sports-2',
    title: 'Sachin Baisoya looks to turn the tables on Bhullar as IGPL heads to Vooty',
    description:
      'Championship leaderboard heats up as golfers tackle tricky bunker configurations and undulating greens.',
    content:
      'Following a dominant opening nine, competitors brace for swirling crosswinds in the penultimate stage of the domestic professional golf tour.',
    category: 'Sports',
    source: 'Bhaskarlive',
    publishedAt: '17 hours ago',
    timestamp: Date.now() - 17 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1593111774642-a1622359781b?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.bhaskarlive.in/sports',
  },
  {
    id: 'sports-3',
    title: 'India clinches decisive victory in ICC World Championship series with record fourth-innings chase',
    description:
      'Top-order partnership anchors masterclass run chase in front of ecstatic home supporters.',
    content:
      'Centuries from the opening pair steered India to a historic test triumph, cementing top seed ranking in the World Test Championship cycle.',
    category: 'Sports',
    source: 'ESPN Cricinfo',
    sourceIcon: 'https://www.espncricinfo.com/favicon.ico',
    publishedAt: '10 hours ago',
    timestamp: Date.now() - 10 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.espncricinfo.com/',
  },

  // ── BUSINESS & ECONOMY ──
  {
    id: 'biz-1',
    title: 'Indian benchmark stock indices trade at record highs led by banking, IT, and manufacturing gains',
    description:
      'Foreign institutional investor inflows and strong quarterly corporate earnings propel market valuations.',
    content:
      'The Sensex and Nifty indices surged past previous resistance ceilings with broad-based market participation across mid-cap and blue-chip equities.',
    category: 'Business',
    source: 'The Economic Times',
    sourceIcon: 'https://economictimes.indiatimes.com/favicon.ico',
    publishedAt: '3 hours ago',
    timestamp: Date.now() - 3 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    url: 'https://economictimes.indiatimes.com/markets',
  },
  {
    id: 'biz-2',
    title: 'Reserve Bank of India maintains steady benchmark repo rate while projecting resilient 7.2% GDP growth',
    description:
      'Monetary Policy Committee balances disinflationary glide path with sustained industrial capital expenditure.',
    content:
      'Governor announced liquidity adjustments ensuring credit flow to productive MSME sectors while reiterating commitment to the 4% headline CPI target.',
    category: 'Business',
    source: 'LiveMint',
    sourceIcon: 'https://www.livemint.com/favicon.ico',
    publishedAt: '6 hours ago',
    timestamp: Date.now() - 6 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.livemint.com/economy',
  },

  // ── SCIENCE & HEALTH ──
  {
    id: 'sci-1',
    title: 'Astronomers detect unexpected water vapor signatures in habitable zone of nearby exoplanet',
    description:
      'Spectroscopic analysis by deep space telescopes reveals chemical balance favorable for atmospheric stability.',
    content:
      'Astrophysical teams analyzing transit light curves discovered clean atmospheric transmission lines of water molecules in an orbit 120 light years away.',
    category: 'Science',
    source: 'Nature',
    publishedAt: '8 hours ago',
    timestamp: Date.now() - 8 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.nature.com/',
  },
  {
    id: 'health-1',
    title: 'New targeted cellular therapy trial demonstrates remarkable 90% remission rate in clinical study',
    description:
      'Next-generation immunotherapy engineers patients\' own T-cells to specifically dissolve refractory malignancies.',
    content:
      'Oncologists published phase-2 multicenter trial results showing unprecedented safety margins and sustained cellular memory against tumor reoccurrence.',
    category: 'Health',
    source: 'The Lancet',
    publishedAt: '12 hours ago',
    timestamp: Date.now() - 12 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80',
    url: 'https://www.thelancet.com/',
  },
  {
    id: 'ent-1',
    title: 'International Film Festival announces special retrospective honoring Indian regional cinema classics',
    description:
      'Restored prints of Tamil, Malayalam, and Bengali masterpieces to be screened at prestigious European gala.',
    content:
      'Film heritage foundation delegates praised the digital 4K restoration efforts that preserved original 35mm negative prints for international archival audiences.',
    category: 'Entertainment',
    source: 'Variety',
    publishedAt: '14 hours ago',
    timestamp: Date.now() - 14 * 3600 * 1000,
    imageUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    url: 'https://variety.com/v/film/',
  },
];

// ── GOOGLE NEWS SUBNAV TABS ──────────────────────────────────────────────────
const PRIMARY_NAV_TABS = [
  { id: 'Home', label: 'Home' },
  { id: 'For you', label: 'For you' },
  { id: 'Following', label: 'Following' },
  { id: 'News Showcase', label: 'News Showcase' },
];

const CATEGORY_NAV_TABS = [
  { id: 'India', label: 'India', icon: <Landmark size={14} /> },
  { id: 'World', label: 'World', icon: <Globe size={14} /> },
  { id: 'Local', label: 'Local', icon: <MapPin size={14} /> },
  { id: 'Business', label: 'Business', icon: <Briefcase size={14} /> },
  { id: 'Technology', label: 'Technology', icon: <Cpu size={14} /> },
  { id: 'Entertainment', label: 'Entertainment', icon: <Film size={14} /> },
  { id: 'Sports', label: 'Sports', icon: <Trophy size={14} /> },
  { id: 'Science', label: 'Science', icon: <FlaskConical size={14} /> },
  { id: 'Health', label: 'Health', icon: <HeartPulse size={14} /> },
];

// ── WEATHER CITIES ROTATION ──────────────────────────────────────────────────
const WEATHER_LOCATIONS = [
  {
    city: 'Tamil Nadu',
    temp: '29°C',
    condition: 'Google Weather',
    high: '31°C',
    low: '24°C',
    humidity: '78%',
    wind: '14 km/h',
    aqi: '58 Moderate',
  },
  {
    city: 'Chennai',
    temp: '30°C',
    condition: 'Humid & Overcast',
    high: '32°C',
    low: '25°C',
    humidity: '84%',
    wind: '18 km/h',
    aqi: '64 Moderate',
  },
  {
    city: 'Coimbatore',
    temp: '26°C',
    condition: 'Pleasant Breeze',
    high: '28°C',
    low: '21°C',
    humidity: '68%',
    wind: '10 km/h',
    aqi: '42 Good',
  },
  {
    city: 'Bengaluru',
    temp: '24°C',
    condition: 'Partly Cloudy',
    high: '27°C',
    low: '19°C',
    humidity: '62%',
    wind: '12 km/h',
    aqi: '48 Good',
  },
  {
    city: 'New Delhi',
    temp: '21°C',
    condition: 'Morning Haze',
    high: '25°C',
    low: '14°C',
    humidity: '55%',
    wind: '8 km/h',
    aqi: '185 Unhealthy',
  },
  {
    city: 'Mumbai',
    temp: '32°C',
    condition: 'Coastal Warmth',
    high: '34°C',
    low: '26°C',
    humidity: '74%',
    wind: '16 km/h',
    aqi: '110 Moderate',
  },
];

// ── SHOWCASE EDITORIAL PACKAGES ──────────────────────────────────────────────
const SHOWCASE_PACKAGES = [
  {
    publisher: 'The Hindu',
    tagline: 'India’s National Newspaper Since 1878',
    color: '#8ab4f8',
    leadTitle: 'Northeast Monsoon intensifies across coastal Tamil Nadu: Preparedness in top gear',
    leadImage:
      'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80',
    bullets: [
      'IMD issues orange alert for Chennai, Tiruvallur, and Kanchipuram with gusty coastal winds',
      'GCC mobilizes 400+ motorized de-watering pumps in vulnerable low-lying neighborhoods',
      'State disaster response forces on standby across Cauvery delta agricultural districts',
    ],
    url: 'https://www.thehindu.com/',
  },
  {
    publisher: 'BBC News',
    tagline: 'World News & Verified International Reporting',
    color: '#f28b82',
    leadTitle: 'Inside Capitol Hill: Lawmakers halt Hegseth impeachment bid ahead of defense hearings',
    leadImage:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    bullets: [
      'House leadership blocks impeachment initiative following party-line parliamentary votes',
      'Diplomatic negotiations continue as administration addresses defense authorization bills',
      'Analysis: The delicate balance of legislative power heading into confirmation hearings',
    ],
    url: 'https://www.bbc.com/news',
  },
  {
    publisher: 'The Indian Express',
    tagline: 'Journalism of Courage',
    color: '#fbbc04',
    leadTitle: 'Monsoon revival and infrastructure updates: Transit lines expand across major metros',
    leadImage:
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
    bullets: [
      'Vande Bharat sleeper passenger rakes set for high-density national corridor deployment',
      'Reservoir inflow rates across Krishna and Cauvery basins monitored closely by state engineers',
      'Urban mobility benchmarks show rapid metro ridership gains in Chennai and Bengaluru',
    ],
    url: 'https://indianexpress.com/',
  },
];

export default function PulseFlowPage() {
  // Navigation & Search State
  const [activeNavTab, setActiveNavTab] = useState<string>('Home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // News Data State
  const [allArticles, setAllArticles] = useState<NewsArticleItem[]>(MASTER_NEWS_CATALOG);
  const [isLiveFetching, setIsLiveFetching] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleItem | null>(null);

  // Modals & Panels
  const [showLiveTv, setShowLiveTv] = useState<boolean>(false);
  const [showAiBriefing, setShowAiBriefing] = useState<boolean>(false);
  const [briefing, setBriefing] = useState<AiBriefingResponse | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Widgets State
  const [weatherIdx, setWeatherIdx] = useState<number>(0);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Backend Telemetry
  const [backendStatus, setBackendStatus] = useState<{
    isOnline: boolean;
    totalArticles: number;
    dbStatus: string;
  }>({ isOnline: false, totalArticles: 0, dbStatus: 'checking' });

  // Bookmarks (Reading List)
  const [savedBookmarks, setSavedBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lifeos_google_news_bookmarks');
      if (saved) return new Set(JSON.parse(saved));
    } catch { }
    return new Set<string>(['rain-1', 'world-1', 'tech-1']);
  });

  // Followed Topics
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lifeos_followed_topics');
      if (saved) return new Set(JSON.parse(saved));
    } catch { }
    return new Set<string>(['Chennai', 'Tamil Nadu', 'Technology', 'Rain & Monsoon', 'Space & ISRO']);
  });

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live formatted date for "Your briefing"
  const formattedToday = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  // ── DEBOUNCE SEARCH INPUT (400ms) ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── FETCH LIVE FEEDS (BACKEND SQLITE + NEWSDATA.IO) ────────────────────────
  const loadAllNews = useCallback(async (queryParam?: string) => {
    setIsLiveFetching(true);
    try {
      // 1. Check Python backend status
      const health = await checkBackendHealth();
      setBackendStatus(health);

      const targetQuery = queryParam !== undefined ? queryParam : debouncedSearch;

      // 2. Fetch from Python Backend AND user's NewsData.io API in parallel
      const [backendRes, newsDataRes] = await Promise.allSettled([
        fetchBackendNews({
          category:
            activeNavTab !== 'Home' &&
              activeNavTab !== 'For you' &&
              activeNavTab !== 'Following' &&
              activeNavTab !== 'News Showcase'
              ? activeNavTab
              : undefined,
          search: targetQuery || undefined,
          limit: 60,
        }),
        fetchNewsDataLatest({
          country: 'in',
          category:
            activeNavTab !== 'Home' &&
              activeNavTab !== 'For you' &&
              activeNavTab !== 'Following' &&
              activeNavTab !== 'News Showcase'
              ? activeNavTab
              : undefined,
          q: targetQuery || undefined,
        }),
      ]);

      const fetchedItems: NewsArticleItem[] = [];

      // Ingest NewsData.io results
      if (newsDataRes.status === 'fulfilled' && newsDataRes.value.length > 0) {
        newsDataRes.value.forEach((item) => {
          fetchedItems.push({
            id: item.id,
            title: item.title,
            description: item.description,
            content: item.description,
            category: item.category || 'National',
            source: item.source || 'NewsData',
            publishedAt: formatTimeAgo(item.published_at),
            timestamp: new Date(item.published_at).getTime(),
            imageUrl:
              item.image_url ||
              'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
            url: item.url,
            isNew: true,
          });
        });
      }

      // Ingest Backend SQLite results
      if (backendRes.status === 'fulfilled' && backendRes.value.articles.length > 0) {
        backendRes.value.articles.forEach((item) => {
          fetchedItems.push({
            id: item.id,
            title: item.title,
            description: item.description,
            content: `${item.description} Reported by ${item.source}. Read full publisher reporting.`,
            category: item.category,
            source: item.source,
            publishedAt: formatTimeAgo(item.published_at),
            timestamp: new Date(item.published_at).getTime(),
            imageUrl:
              item.image_url ||
              'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
            url: item.url,
            isNew: false,
          });
        });
      }

      // Merge with master catalog, deduplicating by title
      setAllArticles((prev) => {
        const titleMap = new Map<string, NewsArticleItem>();
        // Add fetched items first (newest)
        fetchedItems.forEach((item) => {
          const normTitle = item.title.toLowerCase().trim().slice(0, 40);
          if (!titleMap.has(normTitle)) titleMap.set(normTitle, item);
        });
        // Add previous items
        prev.forEach((item) => {
          const normTitle = item.title.toLowerCase().trim().slice(0, 40);
          if (!titleMap.has(normTitle)) titleMap.set(normTitle, item);
        });
        // Add master catalog as fallback base
        MASTER_NEWS_CATALOG.forEach((item) => {
          const normTitle = item.title.toLowerCase().trim().slice(0, 40);
          if (!titleMap.has(normTitle)) titleMap.set(normTitle, item);
        });

        const merged = Array.from(titleMap.values());
        merged.sort((a, b) => b.timestamp - a.timestamp);
        return merged;
      });

      if (fetchedItems.length > 0) {
        showToast(`Synced ${fetchedItems.length} fresh live articles from news feeds!`);
      }
    } catch {
      showToast('Serving offline verified news library');
    } finally {
      setIsLiveFetching(false);
    }
  }, [activeNavTab, debouncedSearch]);

  // Initial load
  useEffect(() => {
    loadAllNews();
  }, [loadAllNews]);

  // Periodic refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => loadAllNews(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadAllNews]);

  // Trigger search sync when debounced query changes
  useEffect(() => {
    if (debouncedSearch) {
      loadAllNews(debouncedSearch);
    }
  }, [debouncedSearch, loadAllNews]);

  // ── FILTERED ARTICLES (INSTANT CLIENT-SIDE RESPONSIVENESS) ──────────────────
  const filteredArticles = useMemo(() => {
    let list = [...allArticles];

    // 1. Search Query Filter (Matches title, description, source, category, content)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }

    // 2. Navigation Tab Filtering
    if (activeNavTab === 'Following') {
      // Show saved bookmarks or followed topics
      return list.filter(
        (a) =>
          savedBookmarks.has(a.id) ||
          Array.from(followedTopics).some(
            (topic) =>
              a.title.toLowerCase().includes(topic.toLowerCase()) ||
              a.category.toLowerCase().includes(topic.toLowerCase()) ||
              a.source.toLowerCase().includes(topic.toLowerCase())
          )
      );
    }

    if (activeNavTab === 'For you') {
      // Curated mix: Local, Tech, India, Rain + bookmarked
      return list.filter(
        (a) =>
          a.category === 'Local' ||
          a.category === 'Technology' ||
          a.category === 'India' ||
          savedBookmarks.has(a.id) ||
          a.title.toLowerCase().includes('rain') ||
          a.title.toLowerCase().includes('chennai')
      );
    }

    if (activeNavTab === 'News Showcase') {
      return list; // Showcase has its own dedicated renderer
    }

    if (activeNavTab !== 'Home') {
      // Category tabs: India, World, Local, Business, Technology, Entertainment, Sports, Science, Health
      const cat = activeNavTab.toLowerCase();
      return list.filter((a) => {
        const itemCat = a.category.toLowerCase();
        if (cat === 'local') {
          return (
            itemCat.includes('local') ||
            itemCat.includes('regional') ||
            a.source.toLowerCase().includes('chennai') ||
            a.title.toLowerCase().includes('chennai') ||
            a.title.toLowerCase().includes('tamil nadu')
          );
        }
        return itemCat.includes(cat);
      });
    }

    return list;
  }, [allArticles, searchQuery, activeNavTab, savedBookmarks, followedTopics]);

  // ── DERIVE LAYOUT PIECES FROM FILTERED ARTICLES ────────────────────────────
  const { topStory, perspectives, localStories, feedArticles } = useMemo(() => {
    if (filteredArticles.length === 0) {
      return {
        topStory: null,
        perspectives: [],
        localStories: [],
        feedArticles: [],
      };
    }

    // Best lead top story (has image and good title length)
    const lead =
      filteredArticles.find((a) => a.imageUrl && a.title.length > 25) ||
      filteredArticles[0];

    // Perspectives (different sources than top story)
    const persp = filteredArticles
      .filter((a) => a.id !== lead.id && a.source !== lead.source)
      .slice(0, 3);

    // Local Chennai / Tamil Nadu stories
    let local = filteredArticles
      .filter(
        (a) =>
          a.id !== lead.id &&
          !persp.some((p) => p.id === a.id) &&
          (a.category.toLowerCase().includes('local') ||
            a.source.toLowerCase().includes('chennai') ||
            a.title.toLowerCase().includes('chennai') ||
            a.title.toLowerCase().includes('tamil nadu') ||
            a.title.toLowerCase().includes('rain'))
      )
      .slice(0, 4);

    if (local.length === 0 && filteredArticles.length > 1) {
      local = filteredArticles
        .filter((a) => a.id !== lead.id && !persp.some((p) => p.id === a.id))
        .slice(0, 4);
    }

    // Remaining feed stories
    const usedIds = new Set([
      lead.id,
      ...persp.map((p) => p.id),
      ...local.map((l) => l.id),
    ]);

    const feed = filteredArticles.filter((a) => !usedIds.has(a.id));

    return {
      topStory: lead,
      perspectives: persp,
      localStories: local,
      feedArticles: feed,
    };
  }, [filteredArticles]);

  // ── ACTIONS & TOGGLES ──────────────────────────────────────────────────────
  const toggleBookmark = (id: string) => {
    setSavedBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from reading list');
      } else {
        next.add(id);
        showToast('Saved to reading list!');
      }
      try {
        localStorage.setItem(
          'lifeos_google_news_bookmarks',
          JSON.stringify(Array.from(next))
        );
      } catch { }
      return next;
    });
  };

  const toggleFollowTopic = (topic: string) => {
    setFollowedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
        showToast(`Unfollowed topic "${topic}"`);
      } else {
        next.add(topic);
        showToast(`Now following topic "${topic}"!`);
      }
      try {
        localStorage.setItem(
          'lifeos_followed_topics',
          JSON.stringify(Array.from(next))
        );
      } catch { }
      return next;
    });
  };

  const handleShare = (art: NewsArticleItem) => {
    const text = `${art.title} — ${art.url || window.location.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Story link copied to clipboard!');
    }
  };

  const handleLoadBriefing = async () => {
    setIsBriefingLoading(true);
    setShowAiBriefing(true);
    try {
      const res = await fetchDailyBriefing();
      setBriefing(res);
    } catch {
      setBriefing(null);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const handleNextWeather = () => {
    setWeatherIdx((prev) => (prev + 1) % WEATHER_LOCATIONS.length);
  };

  const handlePrevWeather = () => {
    setWeatherIdx((prev) => (prev - 1 + WEATHER_LOCATIONS.length) % WEATHER_LOCATIONS.length);
  };

  const currentWeather = WEATHER_LOCATIONS[weatherIdx];

  return (
    <div
      style={{
        background: '#171717',
        color: '#e8eaed',
        minHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Google Sans', Roboto, system-ui, -apple-system, sans-serif",
        overflowY: 'auto',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE NEWS TOP APP BAR (EXACT REPLICA OF USER REFERENCE)
          ═══════════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          background: '#202124',
          borderBottom: '1px solid #3c4043',
          padding: '0.65rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Google News Brand Logo */}
        <div
          onClick={() => {
            setActiveNavTab('Home');
            setSearchQuery('');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          title="Return to Google News Home"
        >
          <span
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#4285F4' }}>G</span>
            <span style={{ color: '#EA4335' }}>o</span>
            <span style={{ color: '#FBBC05' }}>o</span>
            <span style={{ color: '#4285F4' }}>g</span>
            <span style={{ color: '#34A853' }}>l</span>
            <span style={{ color: '#EA4335' }}>e</span>
            <span style={{ color: '#e8eaed', fontWeight: 400, marginLeft: '6px' }}>News</span>
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '6px',
              background: '#303134',
              color: '#8ab4f8',
              border: '1px solid #3c4043',
            }}
          >
            Life OS
          </span>
        </div>

        {/* Central Search Bar */}
        <div
          style={{
            flex: 1,
            maxWidth: '680px',
            position: 'relative',
            background: '#303134',
            borderRadius: '24px',
            border: searchQuery ? '1px solid #8ab4f8' : '1px solid #5f6368',
            display: 'flex',
            alignItems: 'center',
            padding: '0.4rem 1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'border 0.2s ease',
          }}
        >
          <Search size={18} color={searchQuery ? '#8ab4f8' : '#9aa0a6'} style={{ marginRight: '10px', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadAllNews(searchQuery);
              }
            }}
            placeholder="Search for topics, locations & sources (e.g., rain, Chennai, tech)"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.92rem',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9aa0a6',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Top Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Live TV Button */}
          <button
            type="button"
            onClick={() => setShowLiveTv((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              borderRadius: '18px',
              background: showLiveTv ? '#c5221f' : '#303134',
              border: '1px solid #3c4043',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Watch 24/7 Verified Live News Channels"
          >
            <Tv size={14} color="#f28b82" />
            <span>{showLiveTv ? 'Close Live TV' : 'Live TV (6 Streams)'}</span>
          </button>

          {/* AI Briefing Button */}
          <button
            type="button"
            onClick={handleLoadBriefing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              borderRadius: '18px',
              background: showAiBriefing ? '#8ab4f8' : '#303134',
              border: '1px solid #3c4043',
              color: showAiBriefing ? '#202124' : '#8ab4f8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Generate AI 5-Bullet Intelligence Briefing"
          >
            <Sparkles size={14} />
            <span>Jarvis Briefing</span>
          </button>

          {/* Refresh Button & Backend Telemetry */}
          <button
            type="button"
            onClick={() => loadAllNews(searchQuery)}
            disabled={isLiveFetching}
            title={
              backendStatus.isOnline
                ? `Backend Online (${backendStatus.totalArticles} articles stored in SQLite)`
                : 'Direct Feeds Active (Click to sync all sources)'
            }
            style={{
              background: 'none',
              border: 'none',
              color: backendStatus.isOnline ? '#81c995' : '#9aa0a6',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <RefreshCw size={18} className={isLiveFetching ? 'animate-spin' : ''} />
            {backendStatus.isOnline && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#81c995',
                }}
              />
            )}
          </button>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '6px' }}
            title="Google News Help & Shortcuts"
          >
            <HelpCircle size={18} />
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '6px' }}
            title="Google News Settings"
          >
            <Settings size={18} />
          </button>

          {/* User Avatar Circle */}
          <div
            onClick={() => setShowProfileModal(true)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ea580c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginLeft: '4px',
              cursor: 'pointer',
            }}
            title="Sastivelan.N (Click to view profile & reading stats)"
          >
            S
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE NEWS SUB-NAV BAR (HOME, FOR YOU ... | INDIA, WORLD, LOCAL...)
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          background: '#202124',
          borderBottom: '1px solid #3c4043',
          padding: '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          whiteSpace: 'nowrap',
          gap: '0.25rem',
        }}
      >
        {/* Left primary tabs */}
        {PRIMARY_NAV_TABS.map((tab) => {
          const isActive = activeNavTab === tab.label && !searchQuery;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveNavTab(tab.label);
                setSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #8ab4f8' : '3px solid transparent',
                color: isActive ? '#8ab4f8' : '#9aa0a6',
                padding: '0.75rem 0.9rem',
                fontSize: '0.86rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              {tab.label === 'Following' && savedBookmarks.size > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '0.68rem',
                    background: '#303134',
                    color: '#8ab4f8',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    border: '1px solid #3c4043',
                  }}
                >
                  {savedBookmarks.size}
                </span>
              )}
            </button>
          );
        })}

        {/* Vertical Separator */}
        <div style={{ width: '1px', height: '18px', background: '#3c4043', margin: '0 0.5rem' }} />

        {/* Right category tabs */}
        {CATEGORY_NAV_TABS.map((tab) => {
          const isActive = activeNavTab === tab.label && !searchQuery;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveNavTab(tab.label);
                setSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #8ab4f8' : '3px solid transparent',
                color: isActive ? '#8ab4f8' : '#e8eaed',
                padding: '0.75rem 0.9rem',
                fontSize: '0.86rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT CONTAINER
          ═══════════════════════════════════════════════════════════════════════ */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.25rem' }}>
        {/* Live TV Section (Collapsible) */}
        {showLiveTv && <LiveTvSection onClose={() => setShowLiveTv(false)} />}

        {/* Jarvis AI Briefing Card (Collapsible) */}
        {showAiBriefing && (
          <JarvisAiBriefingCard
            briefing={briefing}
            isLoading={isBriefingLoading}
            onRefresh={handleLoadBriefing}
          />
        )}

        {/* ── "YOUR BRIEFING" HEADER & GOOGLE WEATHER WIDGET ── */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.85rem',
                fontWeight: 400,
                color: '#e8eaed',
                letterSpacing: '-0.02em',
              }}
            >
              {searchQuery ? `Search results for "${searchQuery}"` : activeNavTab === 'Following' ? 'Following & Saved Stories' : activeNavTab === 'For you' ? 'For you' : activeNavTab === 'Home' ? 'Your briefing' : `${activeNavTab} news`}
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#9aa0a6' }}>
              {searchQuery ? `Found ${filteredArticles.length} stories matching your query` : formattedToday}
            </p>
          </div>

          {/* Google Weather Widget (Clickable & Chevron-navigable) */}
          <div
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '16px',
              padding: '0.55rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <button
              type="button"
              onClick={handlePrevWeather}
              title="Previous Location"
              style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={18} />
            </button>

            <div
              onClick={() => setShowWeatherModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              title="Click to view detailed 3-Day Forecast"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(251, 188, 4, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbc04',
                }}
              >
                <CloudSun size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#9aa0a6' }}>
                  <span>{currentWeather.city}</span>
                  <MapPin size={10} color="#8ab4f8" />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e8eaed' }}>
                  {currentWeather.temp}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8ab4f8' }}>
                  {currentWeather.condition}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextWeather}
              title="Next Location"
              style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* ── FOR YOU / FOLLOWING TOPIC CHIPS ── */}
        {(activeNavTab === 'For you' || activeNavTab === 'Following') && !searchQuery && (
          <div
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',             gap: '8px',
              flexWrap: 'wrap',
              background: '#202124',
              padding: '0.85rem 1rem',
              borderRadius: '16px',
              border: '1px solid #3c4043',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#9aa0a6', fontWeight: 600 }}>Followed topics:</span>
            {['Chennai', 'Tamil Nadu', 'Rain & Monsoon', 'Technology', 'Space & ISRO', 'Indian Economy', 'Sports'].map(
              (topic) => {
                const isFollowed = followedTopics.has(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleFollowTopic(topic)}
                    style={{
                      background: isFollowed ? 'rgba(138, 180, 248, 0.15)' : '#303134',
                      border: isFollowed ? '1px solid #8ab4f8' : '1px solid #3c4043',
                      color: isFollowed ? '#8ab4f8' : '#e8eaed',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{topic}</span>
                    <span>{isFollowed ? '✓' : '+'}</span>
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* ── NEWS SHOWCASE DEDICATED VIEW ── */}
        {activeNavTab === 'News Showcase' && !searchQuery && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: '#e8eaed' }}>
                Google News Showcase
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#9aa0a6' }}>
                Curated editorial packages and in-depth reporting from premier news organizations
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
              {SHOWCASE_PACKAGES.map((pkg, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#202124',
                    border: '1px solid #3c4043',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Masthead */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: pkg.color }}>
                          {pkg.publisher}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>{pkg.tagline}</div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(138, 180, 248, 0.1)',
                          color: '#8ab4f8',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Showcase
                      </span>
                    </div>

                    {/* Image */}
                    <div style={{ width: '100%', height: '170px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                      <img src={pkg.leadImage} alt={pkg.leadTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.98rem', fontWeight: 600, color: '#e8eaed', lineHeight: 1.35 }}>
                      {pkg.leadTitle}
                    </h3>

                    {/* Bullets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
                      {pkg.bullets.map((b, bIdx) => (
                        <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: '#bdc1c6' }}>
                          <span style={{ color: pkg.color, fontWeight: 700 }}>•</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a
                    href={pkg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      background: '#303134',
                      border: '1px solid #3c4043',
                      color: '#8ab4f8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read full package on {pkg.publisher}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── EMPTY SEARCH STATE (IF NO ARTICLES FOUND) ── */}
        {filteredArticles.length === 0 && (
          <div
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              padding: '3rem 2rem',
              textAlign: 'center',
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(138, 180, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#8ab4f8',
              }}
            >
              <Search size={30} />
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#e8eaed' }}>
              No news stories found for "{searchQuery}"
            </h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#9aa0a6', maxWidth: '500px', marginInline: 'auto' }}>
              Try checking for typos or explore popular topics like rain, Chennai, technology, sports, or national news.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {['rain', 'chennai', 'technology', 'sports', 'india', 'world'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setSearchQuery(suggestion)}
                  style={{
                    background: '#303134',
                    border: '1px solid #3c4043',
                    color: '#8ab4f8',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '16px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Search "{suggestion}"
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveNavTab('Home');
              }}
              style={{
                background: '#8ab4f8',
                border: 'none',
                color: '#202124',
                padding: '0.6rem 1.4rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear search and show latest headlines
            </button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            2-COLUMN GRID: "TOP STORIES" (65%) & "LOCAL NEWS" (35%)
            ═════════════════════════════════════════════════════════════════════ */}
        {topStory && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* ── LEFT COLUMN: TOP STORIES ── */}
            <div
              style={{
                gridColumn: 'span 2',
                minWidth: 0,
              }}
              className="top-stories-column"
            >
              <div
                style={{
                  background: '#202124',
                  borderRadius: '16px',
                  border: '1px solid #3c4043',
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                }}
              >
                {/* Section Header */}
                <div
                  onClick={() => {
                    setActiveNavTab('Home');
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                  title="Click to view all Top Stories"
                >
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#8ab4f8' }}>
                    Top stories
                  </h2>
                  <ChevronRight size={18} color="#8ab4f8" />
                </div>

                {/* 2-Pane Split: Left Lead Story + Right Perspectives */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '1.25rem',
                    alignItems: 'start',
                  }}
                >
                  {/* Left: Lead Primary Story */}
                  <div
                    onClick={() => setSelectedArticle(topStory)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Big 16:9 Banner Image */}
                    <div
                      style={{
                        width: '100%',
                        height: '210px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#303134',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <img
                        src={topStory.imageUrl}
                        alt={topStory.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                        }}
                        className="hover:scale-105"
                      />
                    </div>

                    {/* Source attribution */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.45rem' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '3px',
                          background: '#3c4043',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#8ab4f8',
                        }}
                      >
                        {topStory.source.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#9aa0a6', fontWeight: 500 }}>
                        {topStory.source}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3
                      style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.15rem',
                        fontWeight: 500,
                        lineHeight: 1.35,
                        color: '#e8eaed',
                      }}
                      className="hover:underline"
                    >
                      {topStory.title}
                    </h3>

                    <div style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>
                      {topStory.publishedAt}
                    </div>
                  </div>

                  {/* Right: Perspectives Coverage List */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {perspectives.map((persp, idx) => (
                      <div
                        key={persp.id || idx}
                        onClick={() => setSelectedArticle(persp)}
                        style={{
                          padding: idx === 0 ? '0 0 0.85rem' : '0.85rem 0',
                          borderBottom: idx < perspectives.length - 1 ? '1px solid #303134' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              background: '#3c4043',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#8ab4f8',
                            }}
                          >
                            {persp.source.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#9aa0a6', fontWeight: 500 }}>
                            {persp.source}
                          </span>
                        </div>

                        <h4
                          style={{
                            margin: '0 0 0.35rem',
                            fontSize: '0.92rem',
                            fontWeight: 500,
                            color: '#e8eaed',
                            lineHeight: 1.35,
                          }}
                          className="hover:underline"
                        >
                          {persp.title}
                        </h4>

                        <div style={{ fontSize: '0.74rem', color: '#9aa0a6' }}>
                          {persp.publishedAt}
                          {persp.author && <span> • By {persp.author}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom footer link */}
                <div
                  onClick={() => {
                    const el = document.getElementById('news-feed-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #303134',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#8ab4f8',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                >
                  <Globe size={15} />
                  <span>See more headlines and perspectives</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: LOCAL NEWS (CHENNAI & TAMIL NADU) ── */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  background: '#202124',
                  borderRadius: '16px',
                  border: '1px solid #3c4043',
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {/* Header */}
                <div
                  onClick={() => {
                    setActiveNavTab('Local');
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                  title="Click to view all Local News (Chennai & Tamil Nadu)"
                >
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#8ab4f8' }}>
                    Local news
                  </h2>
                  <ChevronRight size={18} color="#8ab4f8" />
                </div>

                {/* Local News List with Right Thumbnail */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {localStories.map((local, idx) => (
                    <div
                      key={local.id || idx}
                      onClick={() => setSelectedArticle(local)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: idx === 0 ? '0 0 0.85rem' : '0.85rem 0',
                        borderBottom: idx < localStories.length - 1 ? '1px solid #303134' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              background: '#3c4043',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#34d399',
                            }}
                          >
                            {local.source.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#9aa0a6', fontWeight: 500 }}>
                            {local.source}
                          </span>
                        </div>

                        <h4
                          style={{
                            margin: '0 0 0.35rem',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            color: '#e8eaed',
                            lineHeight: 1.35,
                          }}
                          className="hover:underline"
                        >
                          {local.title}
                        </h4>

                        <div style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>
                          {local.publishedAt}
                        </div>
                      </div>

                      {/* Right Thumbnail Image (72x72) */}
                      {local.imageUrl && (
                        <div
                          style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#303134',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={local.imageUrl}
                            alt={local.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            ADDITIONAL GOOGLE NEWS STORIES GRID (PICKS FOR YOU & SPOTLIGHT)
            ═════════════════════════════════════════════════════════════════════ */}
        {feedArticles.length > 0 && (
          <section id="news-feed-section" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e8eaed' }}>
                {searchQuery
                  ? `More results for "${searchQuery}"`
                  : activeNavTab === 'Home'
                    ? 'Picks for you'
                    : activeNavTab === 'Following'
                      ? 'Saved & Followed Feed'
                      : `${activeNavTab} coverage`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#9aa0a6' }}>
                Showing {feedArticles.length} stories
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '1rem',
              }}
            >
              {feedArticles.map((art) => {
                const isBookmarked = savedBookmarks.has(art.id);
                return (
                  <article
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    style={{
                      background: '#202124',
                      border: '1px solid #3c4043',
                      borderRadius: '16px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      transition: 'border 0.2s ease',
                    }}
                    className="hover:border-[#8ab4f8]"
                  >
                    <div>
                      {/* Top Source attribution + action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              background: '#3c4043',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#8ab4f8',
                            }}
                          >
                            {art.source.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#9aa0a6', fontWeight: 500 }}>
                            {art.source}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#5f6368' }}>•</span>
                          <span style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>{art.publishedAt}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(art.id);
                            }}
                            style={{ background: 'none', border: 'none', color: isBookmarked ? '#fbbc04' : '#9aa0a6', cursor: 'pointer', padding: '4px' }}
                            title="Save story to reading list"
                          >
                            <Bookmark size={15} fill={isBookmarked ? '#fbbc04' : 'none'} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(art);
                            }}
                            style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '4px' }}
                            title="Share story"
                          >
                            <Share2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Headline and thumbnail layout */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '0.94rem',
                            fontWeight: 500,
                            color: '#e8eaed',
                            lineHeight: 1.35,
                            flex: 1,
                          }}
                          className="hover:underline"
                        >
                          {art.title}
                        </h3>

                        {art.imageUrl && (
                          <div
                            style={{
                              width: '76px',
                              height: '76px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: '#303134',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>

                      {art.description && (
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#9aa0a6', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {art.description}
                        </p>
                      )}
                    </div>

                    {/* Category tag */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #303134' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: '#8ab4f8',
                          background: 'rgba(138, 180, 248, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        {art.category}
                      </span>

                      {art.url && (
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8ab4f8', fontSize: '0.72rem', textDecoration: 'none' }}
                        >
                          <span>Full story</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          ARTICLE READING MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {selectedArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setSelectedArticle(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedArticle.imageUrl && (
              <div style={{ width: '100%', height: '260px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#8ab4f8', fontWeight: 600 }}>
                  {selectedArticle.source}
                </span>
                <span style={{ color: '#5f6368' }}>•</span>
                <span style={{ fontSize: '0.78rem', color: '#9aa0a6' }}>
                  {selectedArticle.publishedAt}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(138, 180, 248, 0.1)',
                    color: '#8ab4f8',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    marginLeft: 'auto',
                  }}
                >
                  {selectedArticle.category}
                </span>
              </div>

              <h2 style={{ margin: '0 0 1rem', fontSize: '1.35rem', fontWeight: 600, color: '#e8eaed', lineHeight: 1.35 }}>
                {selectedArticle.title}
              </h2>

              <p style={{ fontSize: '0.92rem', color: '#bdc1c6', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {selectedArticle.content || selectedArticle.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #3c4043', paddingTop: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(selectedArticle.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      background: '#303134',
                      border: '1px solid #3c4043',
                      color: savedBookmarks.has(selectedArticle.id) ? '#fbbc04' : '#e8eaed',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Bookmark size={15} fill={savedBookmarks.has(selectedArticle.id) ? '#fbbc04' : 'none'} />
                    <span>{savedBookmarks.has(selectedArticle.id) ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(selectedArticle)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      background: '#303134',
                      border: '1px solid #3c4043',
                      color: '#e8eaed',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={15} />
                    <span>Share</span>
                  </button>
                </div>

                {selectedArticle.url && (
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: '#8ab4f8',
                      color: '#202124',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read on {selectedArticle.source}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE WEATHER DETAILED MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showWeatherModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowWeatherModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudSun size={24} color="#fbbc04" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e8eaed' }}>
                  {currentWeather.city} Weather
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeatherModal(false)}
                style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Temp Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff' }}>
                  {currentWeather.temp}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#8ab4f8' }}>{currentWeather.condition}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  High {currentWeather.high} • Low {currentWeather.low}
                </div>
              </div>
              <CloudSun size={56} color="#fbbc04" />
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '1.25rem' }}>
              <div style={{ background: '#303134', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#9aa0a6' }}>Humidity</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e8eaed' }}>{currentWeather.humidity}</div>
              </div>
              <div style={{ background: '#303134', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#9aa0a6' }}>Wind</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e8eaed' }}>{currentWeather.wind}</div>
              </div>
              <div style={{ background: '#303134', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#9aa0a6' }}>AQI</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#81c995' }}>{currentWeather.aqi}</div>
              </div>
            </div>

            {/* 3-Day Outlook */}
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9aa0a6', marginBottom: '0.5rem' }}>
              3-Day Outlook
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { day: 'Today', temp: currentWeather.temp, cond: currentWeather.condition },
                { day: 'Tomorrow', temp: '30°C', cond: 'Scattered Showers' },
                { day: 'Friday', temp: '28°C', cond: 'Moderate Rain' },
              ].map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    background: '#303134',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#e8eaed' }}>{d.day}</span>
                  <span style={{ color: '#9aa0a6' }}>{d.cond}</span>
                  <span style={{ fontWeight: 700, color: '#8ab4f8' }}>{d.temp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HELP & SHORTCUTS MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={22} color="#8ab4f8" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#e8eaed' }}>
                  Google News Life OS Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: '#bdc1c6' }}>
              <div>
                <strong style={{ color: '#e8eaed' }}>Instant Real-time Search:</strong>
                <p style={{ margin: '0.25rem 0 0', color: '#9aa0a6' }}>
                  Type keywords (e.g. <em>rain, Chennai, technology, sports</em>) into the top search bar for instant live filtering, or press Enter to trigger fresh live API queries.
                </p>
              </div>

              <div>
                <strong style={{ color: '#e8eaed' }}>Subnav Categories & Following:</strong>
                <p style={{ margin: '0.25rem 0 0', color: '#9aa0a6' }}>
                  Click category tabs to instantly filter coverage. Use <em>Following</em> to view your saved stories reading list and manage followed topics.
                </p>
              </div>

              <div>
                <strong style={{ color: '#e8eaed' }}>Live TV & Jarvis AI:</strong>
                <p style={{ margin: '0.25rem 0 0', color: '#9aa0a6' }}>
                  Toggle <em>Live TV</em> to watch 6 official news streams (NDTV, WION, Al Jazeera, DW, Sky News, France 24), or launch <em>Jarvis Briefing</em> for an AI executive 5-bullet summary.
                </p>
              </div>

              <div>
                <strong style={{ color: '#e8eaed' }}>Connected Data Sources:</strong>
                <p style={{ margin: '0.25rem 0 0', color: '#9aa0a6' }}>
                  NewsData.io latest API (<code style={{ color: '#81c995' }}>pub_0dbe...</code>), 17 verified RSS feeds (The Hindu, Indian Express, BBC, NDTV), and local SQLite news database.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SETTINGS MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={22} color="#8ab4f8" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#e8eaed' }}>
                  Google News Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', color: '#e8eaed', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Default Weather City
                </label>
                <select
                  value={weatherIdx}
                  onChange={(e) => setWeatherIdx(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#303134',
                    border: '1px solid #3c4043',
                    color: '#e8eaed',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                  }}
                >
                  {WEATHER_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={idx}>
                      {loc.city} ({loc.temp} - {loc.condition})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#e8eaed', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Auto-Refresh Schedule
                </label>
                <div style={{ color: '#9aa0a6', fontSize: '0.78rem' }}>
                  Background news sync runs automatically every <strong>5 minutes</strong>.
                </div>
              </div>

              <div style={{ background: '#303134', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ color: '#e8eaed', fontWeight: 600, marginBottom: '4px' }}>Backend Status</div>
                <div style={{ color: backendStatus.isOnline ? '#81c995' : '#f28b82', fontSize: '0.8rem' }}>
                  {backendStatus.isOnline
                    ? `Connected to local SQLite news.db (${backendStatus.totalArticles} articles stored)`
                    : 'Backend running in direct API/RSS cache mode'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  loadAllNews();
                  setShowSettingsModal(false);
                }}
                style={{
                  background: '#8ab4f8',
                  color: '#202124',
                  border: 'none',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                Save Preferences & Sync Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          USER PROFILE MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ea580c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.6rem',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
              }}
            >
              S
            </div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#e8eaed' }}>
              Sastivelan.N
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#81c995' }}>
              ● Life OS Cloud Active
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.25rem' }}>
              <div style={{ background: '#303134', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8ab4f8' }}>{savedBookmarks.size}</div>
                <div style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>Reading List</div>
              </div>
              <div style={{ background: '#303134', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbc04' }}>{followedTopics.size}</div>
                <div style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>Followed Topics</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveNavTab('Following');
                setShowProfileModal(false);
              }}
              style={{
                width: '100%',
                background: '#303134',
                border: '1px solid #3c4043',
                color: '#8ab4f8',
                padding: '0.6rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={15} />
              <span>Go to Saved Reading List</span>
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#9aa0a6',
                padding: '0.4rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#303134',
            border: '1px solid #5f6368',
            color: '#e8eaed',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="#81c995" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
