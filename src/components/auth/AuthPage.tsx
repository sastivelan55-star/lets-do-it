import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Cloud,
  Shield,
  Smartphone,
  Laptop,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
} from 'lucide-react';
import SupabaseSetupNotice from './SupabaseSetupNotice';

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── ART SLIDES FOR RIGHT COLUMN / BANNER ─────────────────────────────────────
const SHOWCASE_SLIDES = [
  {
    id: 'emerald-sanctuary',
    title: 'Emerald Sanctuary',
    subtitle: 'Growth & Daily Focus Sanctuary',
    theme: 'emerald' as const,
    badgeText: 'Nature OS',
    renderArt: () => (
      <svg
        viewBox="0 0 500 600"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="emeraldBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#042f2e" />
            <stop offset="45%" stopColor="#064e3b" />
            <stop offset="85%" stopColor="#022c22" />
            <stop offset="100%" stopColor="#011812" />
          </linearGradient>
          <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="birdFeatherGrad" x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="25%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#291002" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Deep Forest Base */}
        <rect width="500" height="600" fill="url(#emeraldBg)" />

        {/* Ambient Glow Orbs */}
        <circle cx="340" cy="220" r="140" fill="#10b981" opacity="0.18" filter="url(#softGlow)" />
        <circle cx="160" cy="460" r="120" fill="#059669" opacity="0.15" filter="url(#softGlow)" />

        {/* Organic Background Foliage (Monstera & Tropical Leaves) */}
        <g opacity="0.55">
          {/* Top Left Leaves */}
          <path
            d="M-30,-20 Q80,80 140,20 Q80,180 -20,140 Z"
            fill="url(#leafGrad1)"
          />
          <path
            d="M60,-40 Q180,60 220,180 Q120,160 40,60 Z"
            fill="url(#leafGrad2)"
          />
          {/* Top Right Hanging Vines */}
          <path
            d="M520,-20 Q400,100 380,220 Q460,180 530,90 Z"
            fill="url(#leafGrad1)"
          />
          <path
            d="M480,110 Q390,200 420,320 Q490,260 520,180 Z"
            fill="url(#leafGrad2)"
          />
          {/* Bottom Dense Layer */}
          <path
            d="M-40,420 Q120,440 180,560 Q80,620 -40,580 Z"
            fill="url(#leafGrad1)"
          />
          <path
            d="M320,440 Q440,410 520,520 Q420,620 300,560 Z"
            fill="url(#leafGrad2)"
          />
          <path
            d="M140,490 Q260,460 340,580 Q220,640 100,580 Z"
            fill="url(#leafGrad1)"
          />
        </g>

        {/* Geometric Holographic Shield Silhouette behind bird */}
        <path
          d="M 250 80 Q 380 140 380 340 Q 250 480 250 480 Q 250 480 120 340 Q 120 140 250 80 Z"
          fill="none"
          stroke="rgba(52, 211, 153, 0.28)"
          strokeWidth="2"
          strokeDasharray="8 6"
        />
        <path
          d="M 250 110 Q 350 160 350 320 Q 250 440 250 440 Q 250 440 150 320 Q 150 160 250 110 Z"
          fill="rgba(5, 150, 105, 0.12)"
          stroke="rgba(167, 243, 208, 0.3)"
          strokeWidth="1.5"
        />

        {/* Organic Curving Wooden Branch */}
        <path
          d="M -20,400 Q 160,350 260,370 Q 360,390 520,330 L 520,360 Q 360,420 260,400 Q 150,380 -20,430 Z"
          fill="url(#branchGrad)"
        />
        {/* Branch Texture Ring Highlights */}
        <ellipse cx="230" cy="375" rx="35" ry="6" fill="rgba(245, 158, 11, 0.25)" transform="rotate(-5 230 375)" />
        <ellipse cx="340" cy="375" rx="40" ry="7" fill="rgba(245, 158, 11, 0.2)" transform="rotate(8 340 375)" />

        {/* ── MAJESTIC EMERALD GUARDIAN BIRD ── */}
        <g id="guardianBird" transform="translate(160, 110)">
          {/* Tail Feathers */}
          <path
            d="M 105 270 Q 95 380 80 430 Q 110 390 125 300 Z"
            fill="#064e3b"
          />
          <path
            d="M 120 270 Q 120 400 110 450 Q 135 390 140 300 Z"
            fill="#047857"
          />
          <path
            d="M 135 270 Q 155 380 160 420 Q 155 360 148 290 Z"
            fill="#059669"
          />

          {/* Bird Torso & Body Plumes */}
          <path
            d="M 80 140 Q 60 210 85 270 Q 130 300 175 260 Q 200 200 175 140 Q 130 110 80 140 Z"
            fill="url(#birdFeatherGrad)"
            filter="url(#softGlow)"
          />

          {/* Layered Wing Feathers (Overlapping scale textures) */}
          <g>
            <path d="M 85 170 Q 115 190 145 175 Q 120 220 85 200 Z" fill="#047857" />
            <path d="M 95 195 Q 125 215 155 198 Q 130 245 95 225 Z" fill="#059669" />
            <path d="M 105 220 Q 135 238 165 220 Q 140 270 105 250 Z" fill="#10b981" />
            <path d="M 115 245 Q 140 260 170 240 Q 145 290 115 272 Z" fill="#34d399" />

            {/* Wing Feather Highlights */}
            <circle cx="110" cy="185" r="4" fill="#a7f3d0" opacity="0.8" />
            <circle cx="122" cy="210" r="4" fill="#a7f3d0" opacity="0.8" />
            <circle cx="132" cy="235" r="4" fill="#fef08a" opacity="0.9" />
          </g>

          {/* Bird Head & Neck */}
          <circle cx="130" cy="115" r="42" fill="url(#birdFeatherGrad)" />

          {/* Majestic Spiky Crown Crest Feathers */}
          <path d="M 115 80 Q 105 35 90 20 Q 115 45 125 75 Z" fill="url(#crownGrad)" />
          <path d="M 125 75 Q 125 25 120 10 Q 135 38 135 74 Z" fill="url(#crownGrad)" />
          <path d="M 135 74 Q 150 30 155 15 Q 150 45 145 76 Z" fill="url(#crownGrad)" />
          <path d="M 145 78 Q 170 42 185 30 Q 165 55 152 82 Z" fill="url(#crownGrad)" />
          <path d="M 152 85 Q 185 60 205 52 Q 180 75 160 92 Z" fill="url(#crownGrad)" />

          {/* Crown Coral Tips */}
          <circle cx="92" cy="22" r="3" fill="#f87171" />
          <circle cx="121" cy="12" r="3.5" fill="#fb923c" />
          <circle cx="154" cy="17" r="3" fill="#f87171" />

          {/* Strong Avian Beak */}
          <path
            d="M 160 112 Q 220 122 235 130 Q 190 145 155 136 Z"
            fill="#334155"
          />
          <path
            d="M 160 115 Q 215 123 230 128 L 190 128 Z"
            fill="#64748b"
          />

          {/* Intelligent Eye */}
          <circle cx="140" cy="110" r="9" fill="#0f172a" />
          <circle cx="140" cy="110" r="6" fill="#f59e0b" />
          <circle cx="141" cy="109" r="4" fill="#020617" />
          <circle cx="143" cy="107" r="1.8" fill="#ffffff" />

          {/* Claws gripping the branch */}
          <path
            d="M 110 282 Q 115 300 118 308 Q 122 300 128 306"
            stroke="#1e293b"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 140 280 Q 146 298 150 306 Q 155 298 162 304"
            stroke="#1e293b"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Floating Spores / Glowing Fireflies */}
        <circle cx="120" cy="280" r="2.5" fill="#fef08a" opacity="0.8" />
        <circle cx="180" cy="180" r="2" fill="#a7f3d0" opacity="0.9" />
        <circle cx="390" cy="190" r="3" fill="#6ee7b7" opacity="0.8" />
        <circle cx="360" cy="420" r="2" fill="#fef08a" opacity="0.7" />
        <circle cx="280" cy="480" r="2.5" fill="#34d399" opacity="0.85" />
      </svg>
    ),
  },
  {
    id: 'sakura-moonlight',
    title: 'Sakura Twilight',
    subtitle: 'Anime Serenity & Zen Flow',
    theme: 'violet' as const,
    badgeText: 'Zen Focus',
    renderArt: () => (
      <svg
        viewBox="0 0 500 600"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sakuraSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1035" />
            <stop offset="50%" stopColor="#31134a" />
            <stop offset="100%" stopColor="#0b0617" />
          </linearGradient>
          <radialGradient id="sakuraMoon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fdf4ff" />
            <stop offset="90%" stopColor="#f472b6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="500" height="600" fill="url(#sakuraSky)" />

        {/* Luminous Moon */}
        <circle cx="250" cy="180" r="110" fill="url(#sakuraMoon)" />

        {/* Mountain Silhouette */}
        <path d="M-50,480 L180,320 L320,440 L440,300 L550,460 L550,600 L-50,600 Z" fill="#130924" />
        <path d="M-50,520 L120,410 L280,510 L480,380 L550,480 L550,600 L-50,600 Z" fill="#090412" />

        {/* Torii Gate Silhouette */}
        <g transform="translate(200, 360)">
          <rect x="0" y="0" width="12" height="110" fill="#2e1065" />
          <rect x="88" y="0" width="12" height="110" fill="#2e1065" />
          <path d="M -20 -15 Q 50 -25 120 -15 L 115 -5 Q 50 -15 -15 -5 Z" fill="#4c1d95" />
          <rect x="-10" y="5" width="120" height="8" fill="#3b0764" />
        </g>

        {/* Gnarled Cherry Blossom Branches */}
        <path
          d="M 520,60 Q 380,80 320,160 Q 260,240 180,260"
          stroke="#26103b"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 330,150 Q 280,110 210,130"
          stroke="#26103b"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cherry Blossom Petal Clusters */}
        {[
          [310, 140, 22], [350, 120, 26], [280, 110, 20], [210, 125, 24],
          [170, 255, 22], [230, 240, 28], [370, 80, 30], [420, 70, 26]
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#f472b6" opacity="0.75" />
        ))}

        {/* Floating Petals */}
        <ellipse cx="230" cy="210" rx="8" ry="4" fill="#fbcfe8" transform="rotate(35 230 210)" />
        <ellipse cx="160" cy="310" rx="7" ry="3" fill="#f472b6" transform="rotate(-25 160 310)" />
        <ellipse cx="290" cy="380" rx="9" ry="4" fill="#fbcfe8" transform="rotate(40 290 380)" />
        <ellipse cx="380" cy="340" rx="6" ry="3" fill="#f472b6" transform="rotate(-15 380 340)" />
      </svg>
    ),
  },
  {
    id: 'cyber-metropolis',
    title: 'Cyberpunk Hub',
    subtitle: 'High Velocity Execution Deck',
    theme: 'cyber' as const,
    badgeText: 'Cyber OS',
    renderArt: () => (
      <svg
        viewBox="0 0 500 600"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cyberSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#080e1c" />
            <stop offset="60%" stopColor="#0c1930" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
          <linearGradient id="neonBeam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="500" height="600" fill="url(#cyberSky)" />

        {/* Neon City Towers */}
        <rect x="40" y="240" width="70" height="360" fill="#0d1b2a" stroke="#06b6d4" strokeWidth="1" />
        <rect x="130" y="160" width="85" height="440" fill="#1b263b" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="235" y="220" width="65" height="380" fill="#0d1b2a" stroke="#ec4899" strokeWidth="1" />
        <rect x="320" y="130" width="95" height="470" fill="#162238" stroke="#06b6d4" strokeWidth="1.5" />
        <rect x="430" y="260" width="80" height="340" fill="#0d1b2a" stroke="#8b5cf6" strokeWidth="1" />

        {/* Holographic Glowing Beacon Beam */}
        <polygon points="367,130 355,0 380,0" fill="url(#neonBeam)" opacity="0.65" />
        <polygon points="172,160 160,0 185,0" fill="url(#neonBeam)" opacity="0.45" />

        {/* Glowing Neon Windows Grid */}
        <g fill="#06b6d4" opacity="0.6">
          <rect x="145" y="180" width="6" height="12" />
          <rect x="160" y="180" width="6" height="12" />
          <rect x="175" y="180" width="6" height="12" />
          <rect x="190" y="180" width="6" height="12" />
          <rect x="145" y="210" width="6" height="12" fill="#ec4899" />
          <rect x="160" y="210" width="6" height="12" />
          <rect x="340" y="160" width="8" height="14" fill="#ec4899" />
          <rect x="360" y="160" width="8" height="14" />
          <rect x="380" y="160" width="8" height="14" />
        </g>

        {/* Horizon Grid Lines */}
        <line x1="0" y1="520" x2="500" y2="520" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
        <line x1="0" y1="550" x2="500" y2="550" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
        <line x1="0" y1="580" x2="500" y2="580" stroke="#ec4899" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  },
];

export default function AuthPage() {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    authError,
    clearError,
    isConfigured,
    isPasswordRecovery,
    dismissPasswordRecovery,
    continueAsGuest,
  } = useAuth();

  // Mode: Sign In vs Create Account
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Remember Me state
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_remember_me') === 'true';
  });

  // Form Fields
  const [email, setEmail] = useState<string>(() => {
    if (localStorage.getItem('lifeos_remember_me') === 'true') {
      return localStorage.getItem('lifeos_saved_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Showcase slide state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme variation: 'emerald' | 'violet' | 'cyber'
  const currentSlide = SHOWCASE_SLIDES[activeSlideIndex];
  const colorTheme = currentSlide.theme;

  // Forgot password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // New password update state (recovery flow)
  const [newPassword, setNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const displayError = localError || authError;
  const isRateLimited = displayError ? displayError.toLowerCase().includes('rate limit') : false;

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    clearError();
    setLocalError(null);
    setInfoMessage(null);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please verify your password confirmation.');
        return;
      }
    }

    // Save remember me preference
    if (rememberMe) {
      localStorage.setItem('lifeos_remember_me', 'true');
      localStorage.setItem('lifeos_saved_email', trimmedEmail);
    } else {
      localStorage.removeItem('lifeos_remember_me');
      localStorage.removeItem('lifeos_saved_email');
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const result = await signIn(trimmedEmail, password);
        if (!result.success && result.error) {
          // Handled by authError
        }
      } else {
        const result = await signUp(trimmedEmail, password);
        if (result.success && result.message) {
          setInfoMessage(result.message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setLocalError(null);
    setInfoMessage(null);
    setGoogleSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setLocalError(result.error);
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetStatus(null);
    if (!resetEmail.trim() || !isValidEmail(resetEmail.trim())) {
      setResetError('Please enter your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword(resetEmail.trim());
      if (result.success && result.message) {
        setResetStatus(result.message);
      } else if (result.error) {
        setResetError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoveryStatus(null);

    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== recoveryConfirmPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updatePassword(newPassword);
      if (result.success && result.message) {
        setRecoveryStatus(result.message);
        setTimeout(() => {
          dismissPasswordRecovery();
        }, 1500);
      } else if (result.error) {
        setRecoveryError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Color theme variables based on selected showcase
  const themeStyles = {
    emerald: {
      primaryBtn: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      primaryBtnHover: 'rgba(16, 185, 129, 0.45)',
      primaryBtnColor: '#ffffff',
      accentColor: '#10b981',
      accentBorder: 'rgba(16, 185, 129, 0.35)',
      accentBg: 'rgba(16, 185, 129, 0.12)',
      brandGradient: 'linear-gradient(135deg, #10b981, #34d399)',
      waveHeader: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)',
      pageBg: 'radial-gradient(ellipse at top, #064e3b 0%, #022c22 45%, #01140e 100%)',
    },
    violet: {
      primaryBtn: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
      primaryBtnHover: 'rgba(99, 102, 241, 0.45)',
      primaryBtnColor: '#ffffff',
      accentColor: '#818cf8',
      accentBorder: 'rgba(129, 140, 248, 0.35)',
      accentBg: 'rgba(99, 102, 241, 0.12)',
      brandGradient: 'linear-gradient(135deg, #818cf8, #c084fc)',
      waveHeader: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #6366f1 100%)',
      pageBg: 'radial-gradient(ellipse at top, #2e1065 0%, #1e1b4b 45%, #09071a 100%)',
    },
    cyber: {
      primaryBtn: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      primaryBtnHover: 'rgba(6, 182, 212, 0.45)',
      primaryBtnColor: '#ffffff',
      accentColor: '#06b6d4',
      accentBorder: 'rgba(6, 182, 212, 0.35)',
      accentBg: 'rgba(6, 182, 212, 0.12)',
      brandGradient: 'linear-gradient(135deg, #06b6d4, #ec4899)',
      waveHeader: 'linear-gradient(135deg, #082f49 0%, #0e7490 50%, #06b6d4 100%)',
      pageBg: 'radial-gradient(ellipse at top, #0f172a 0%, #082f49 45%, #020617 100%)',
    },
  }[colorTheme];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: themeStyles.pageBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '2rem 1.5rem',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Top Floating Theme Switcher Pill (Quick access to preview both Emerald & Violet) */}
      <div
        style={{
          position: isMobile ? 'absolute' : 'fixed',
          top: isMobile ? '12px' : '20px',
          right: isMobile ? '12px' : '24px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '999px',
          padding: '4px 6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        {SHOWCASE_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveSlideIndex(idx)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: 'none',
              background: idx === activeSlideIndex ? themeStyles.primaryBtn : 'transparent',
              color: idx === activeSlideIndex ? '#ffffff' : 'rgba(203, 213, 225, 0.7)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {idx === 0 ? '🌿 Emerald' : idx === 1 ? '🔮 Violet' : '⚡ Cyber'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          DESKTOP VIEW (Width >= 768px): SPLIT-SCREEN CARD (Matches Image 1)
          ════════════════════════════════════════════════════════════════════════ */}
      {!isMobile ? (
        <div
          style={{
            width: '100%',
            maxWidth: '1040px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255,255,255,0.08)',
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            minHeight: '620px',
          }}
        >
          {/* ── LEFT COLUMN: AUTHENTICATION CONSOLE ───────────────────────── */}
          <div
            style={{
              flex: '1 1 52%',
              padding: '3rem 3.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.85) 100%)',
            }}
          >
            {/* Top Brand Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.25rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: themeStyles.primaryBtn,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '1.15rem',
                    boxShadow: `0 4px 16px ${themeStyles.primaryBtnHover}`,
                  }}
                >
                  🍃
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      fontSize: '1.28rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: '#f8fafc',
                    }}
                  >
                    Kafh <span style={{ color: themeStyles.accentColor }}>// Life OS</span>
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h1
                  style={{
                    fontSize: '2.1rem',
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '-0.03em',
                    color: '#ffffff',
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                  }}
                >
                  {mode === 'signin' ? 'Welcome Back!' : 'Create Account'}
                </h1>
                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(203, 213, 225, 0.75)',
                    margin: '0.45rem 0 0 0',
                  }}
                >
                  {mode === 'signin'
                    ? 'Please Log in to your account.'
                    : 'Start your personal sanctuary and growth journey.'}
                </p>
              </div>

              {/* Error and Info Alerts */}
              {displayError && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    fontSize: '0.84rem',
                    marginBottom: '1.25rem',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                    <span style={{ flex: 1 }}>{displayError}</span>
                  </div>
                  {isRateLimited && mode === 'signup' && (
                    <div
                      style={{
                        paddingTop: '0.35rem',
                        borderTop: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '0.78rem',
                        color: '#f1f5f9',
                      }}
                    >
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#93c5fd',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Sign in directly
                      </button>
                    </div>
                  )}
                </div>
              )}

              {infoMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#6ee7b7',
                    fontSize: '0.84rem',
                    marginBottom: '1.25rem',
                    lineHeight: 1.45,
                  }}
                >
                  <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#34d399' }} />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Main Auth Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Email Input */}
                <div>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        color: 'rgba(148, 163, 184, 0.75)',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Mail size={17} />
                    </div>
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      style={{
                        width: '100%',
                        padding: '0.85rem 2.5rem 0.85rem 2.75rem',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeStyles.accentColor;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accentBg}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    {isValidEmail(email) && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '14px',
                          color: '#34d399',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <CheckCircle2 size={17} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        color: 'rgba(148, 163, 184, 0.75)',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Lock size={17} />
                    </div>
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      style={{
                        width: '100%',
                        padding: '0.85rem 2.85rem 0.85rem 2.75rem',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeStyles.accentColor;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accentBg}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(148, 163, 184, 0.75)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (only in signup mode) */}
                {mode === 'signup' && (
                  <div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '14px',
                          color: 'rgba(148, 163, 184, 0.75)',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Lock size={17} />
                      </div>
                      <input
                        id="auth-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        style={{
                          width: '100%',
                          padding: '0.85rem 2.85rem 0.85rem 2.75rem',
                          borderRadius: '12px',
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          color: '#ffffff',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        id="toggle-confirm-password-visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(148, 163, 184, 0.75)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me & Forgot Password Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    margin: '0.2rem 0',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      color: 'rgba(203, 213, 225, 0.8)',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        accentColor: themeStyles.accentColor,
                        width: '15px',
                        height: '15px',
                        cursor: 'pointer',
                      }}
                    />
                    <span>Remember me</span>
                  </label>

                  {mode === 'signin' && (
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => {
                        setResetEmail(email);
                        setShowResetModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                        transition: 'color 0.2s',
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Dual Action Buttons (Login + Create Account) */}
                <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.35rem' }}>
                  <button
                    type="submit"
                    id="auth-submit-button"
                    disabled={submitting || googleSubmitting}
                    style={{
                      flex: 1,
                      padding: '0.85rem 1.25rem',
                      borderRadius: '12px',
                      background: themeStyles.primaryBtn,
                      border: 'none',
                      color: themeStyles.primaryBtnColor,
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      cursor: submitting || googleSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: `0 8px 24px ${themeStyles.primaryBtnHover}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: submitting || googleSubmitting ? 0.7 : 1,
                      transition: 'transform 0.15s, opacity 0.2s',
                    }}
                  >
                    {submitting ? (
                      <span>{mode === 'signin' ? 'Logging in…' : 'Creating…'}</span>
                    ) : mode === 'signin' ? (
                      'Login'
                    ) : (
                      'Create account'
                    )}
                  </button>

                  <button
                    type="button"
                    id={mode === 'signin' ? 'tab-signup' : 'tab-signin'}
                    onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: 'rgba(241, 245, 249, 0.9)',
                      fontSize: '0.94rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {mode === 'signin' ? 'Create account' : 'Sign in instead'}
                  </button>
                </div>
              </form>

              {/* "or continue with" Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '1.4rem 0 1rem 0',
                  color: 'rgba(148, 163, 184, 0.6)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
                <span style={{ padding: '0 0.85rem' }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
              </div>

              {/* ── GOOGLE LOGIN BUTTON (FEATURED) ────────────────────────── */}
              <div>
                <button
                  type="button"
                  id="google-signin-button"
                  onClick={handleGoogleSignIn}
                  disabled={googleSubmitting || submitting}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: googleSubmitting || submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                    opacity: googleSubmitting || submitting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <GoogleIcon size={20} />
                  <span>{googleSubmitting ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>
              </div>

              {/* Offline Guest Option */}
              <div style={{ marginTop: '0.9rem', textAlign: 'center' }}>
                <button
                  type="button"
                  id="continue-as-guest-button"
                  onClick={continueAsGuest}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(148, 163, 184, 0.75)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    textDecoration: 'underline',
                    padding: '4px',
                  }}
                >
                  Explore Dashboard as Guest (Offline Mode) →
                </button>
              </div>
            </div>

            {/* Bottom Terms & Data Policy */}
            <div
              style={{
                marginTop: '1.75rem',
                fontSize: '0.72rem',
                color: 'rgba(148, 163, 184, 0.55)',
                lineHeight: 1.45,
              }}
            >
              By signing up you agree to our terms and that you have read our data policy.
            </div>
          </div>

          {/* Center Connector Dot Button (Golden / Accent Circle with Arrow like Image 1) */}
          <button
            type="button"
            onClick={handleNextSlide}
            title="Next Showcase Visual"
            style={{
              position: 'absolute',
              left: '52%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#f59e0b',
              border: '4px solid #0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
              zIndex: 20,
              transition: 'transform 0.2s',
            }}
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>

          {/* ── RIGHT COLUMN: VISUAL ART SHOWCASE (Matches Image 1) ──────── */}
          <div
            style={{
              flex: '1 1 48%',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#042f2e',
            }}
          >
            {/* The SVG Graphic Illustration */}
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {currentSlide.renderArt()}
            </div>

            {/* Bottom Right Carousel Pagination Controls (like Image 1: [<- 1 ->]) */}
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(12px)',
                padding: '5px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <button
                type="button"
                onClick={handlePrevSlide}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0 4px' }}>
                {activeSlideIndex + 1}
              </span>
              <button
                type="button"
                onClick={handleNextSlide}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Top Left Slide Badge */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                zIndex: 10,
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={13} color="#f59e0b" />
              <span>{currentSlide.title}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════
            MOBILE VIEW (Width < 768px): CURVED WAVE & COMPACT CARD (Matches Image 2)
            ════════════════════════════════════════════════════════════════════════ */
        <div
          style={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0f1d',
            position: 'relative',
          }}
        >
          {/* Top Organic Wave Banner (Image 2 Style Header) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              background: themeStyles.waveHeader,
              padding: '2.5rem 1.5rem 1rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* SVG Organic Blob Wave at bottom */}
            <svg
              viewBox="0 0 400 120"
              style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                width: '100%',
                height: '60px',
                pointerEvents: 'none',
              }}
              preserveAspectRatio="none"
            >
              <path
                d="M 0,40 C 100,80 200,0 400,60 L 400,120 L 0,120 Z"
                fill="#0f172a"
              />
            </svg>

            {/* Glowing Brand Heart / Sparkle Icon in Center */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.16)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Heart size={24} fill="#ffffff" />
              </div>
              <span
                style={{
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                Life OS
              </span>
            </div>

            <h2
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: "'Outfit', 'Inter', sans-serif",
              }}
            >
              {mode === 'signin' ? 'Welcome Back!' : 'Join the Force'}
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: '0.25rem 0 0 0',
                maxWidth: '300px',
              }}
            >
              {mode === 'signin'
                ? 'Your anime productivity & personal mastery hub.'
                : 'Create your account to sync across all devices.'}
            </p>
          </div>

          {/* Main Mobile Card Container (Matches Image 2) */}
          <div
            style={{
              flex: 1,
              background: '#0f172a',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Notifications */}
              {displayError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                  <span>{displayError}</span>
                </div>
              )}

              {infoMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#6ee7b7',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#34d399' }} />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Mobile Inputs Container (Image 2 style with leading icons & trailing checks) */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Email / Username field */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'rgba(203, 213, 225, 0.85)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Email Or User Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        color: 'rgba(148, 163, 184, 0.7)',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Mail size={16} />
                    </div>
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your Email here"
                      style={{
                        width: '100%',
                        padding: '0.85rem 2.5rem 0.85rem 2.6rem',
                        borderRadius: '10px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {isValidEmail(email) && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '12px',
                          color: '#34d399',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'rgba(203, 213, 225, 0.85)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        color: 'rgba(148, 163, 184, 0.7)',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Lock size={16} />
                    </div>
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{
                        width: '100%',
                        padding: '0.85rem 2.75rem 0.85rem 2.6rem',
                        borderRadius: '10px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(148, 163, 184, 0.7)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (only in signup mode) */}
                {mode === 'signup' && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'rgba(203, 213, 225, 0.85)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          color: 'rgba(148, 163, 184, 0.7)',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Lock size={16} />
                      </div>
                      <input
                        id="auth-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        style={{
                          width: '100%',
                          padding: '0.85rem 2.75rem 0.85rem 2.6rem',
                          borderRadius: '10px',
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        id="toggle-confirm-password-visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(148, 163, 184, 0.7)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me and Forgot Password Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: 'rgba(203, 213, 225, 0.8)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: themeStyles.accentColor }}
                    />
                    <span>Remember me</span>
                  </label>

                  {mode === 'signin' && (
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => {
                        setResetEmail(email);
                        setShowResetModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: themeStyles.accentColor,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>

                {/* Pill-Shaped Solid Sign In / Create Account Button (Image 2 style) */}
                <button
                  type="submit"
                  id="auth-submit-button"
                  disabled={submitting || googleSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    borderRadius: '999px',
                    background: themeStyles.primaryBtn,
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: submitting || googleSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: `0 8px 25px ${themeStyles.primaryBtnHover}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    opacity: submitting || googleSubmitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? 'Processing…'
                    : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </form>

              {/* "OR LOGIN WITH" Section (Matches Image 2) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '1.5rem 0 1rem 0',
                  color: 'rgba(148, 163, 184, 0.65)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span style={{ padding: '0 0.75rem' }}>OR LOGIN WITH</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>

              {/* ── GOOGLE LOGIN FOR MOBILE (FEATURED) ────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  id="google-signin-button"
                  onClick={handleGoogleSignIn}
                  disabled={googleSubmitting || submitting}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: googleSubmitting || submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    opacity: googleSubmitting || submitting ? 0.7 : 1,
                  }}
                >
                  <GoogleIcon size={20} />
                  <span>{googleSubmitting ? 'Connecting…' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Register / Sign In Switch (Matches Image 2) */}
            <div
              style={{
                textAlign: 'center',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '1.5rem',
                fontSize: '0.82rem',
                color: 'rgba(203, 213, 225, 0.75)',
              }}
            >
              {mode === 'signin' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    id="switch-to-signup-link"
                    onClick={() => switchMode('signup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: themeStyles.accentColor,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Register Now
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    id="switch-to-signin-link"
                    onClick={() => switchMode('signin')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: themeStyles.accentColor,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Badges for Desktop */}
      {!isMobile && (
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '1.75rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            color: 'rgba(148, 163, 184, 0.8)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Cloud size={16} color="#818cf8" />
            <span>PostgreSQL Cloud Sync</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Shield size={16} color="#34d399" />
            <span>Encrypted Authentication</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Smartphone size={16} color="#f59e0b" />
            <Laptop size={16} color="#f59e0b" />
            <span>Cross-Device Compatibility</span>
          </div>
        </div>
      )}

      {/* Setup Notice if Supabase credentials are missing */}
      {!isConfigured && (
        <div style={{ marginTop: '1.75rem', width: '100%', maxWidth: '640px', padding: '0 1rem' }}>
          <SupabaseSetupNotice />
        </div>
      )}

      {/* ── PASSWORD RESET MODAL ────────────────────────────────────────── */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: '#0f172a',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              padding: '1.75rem',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Reset Password
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.86rem', color: 'rgba(203, 213, 225, 0.7)', lineHeight: 1.45 }}>
              Enter your registered email address. We'll send instructions to set a new password.
            </p>

            {resetError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                <span>{resetError}</span>
              </div>
            )}

            {resetStatus && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#34d399' }} />
                <span>{resetStatus}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  htmlFor="reset-email-input"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(203, 213, 225, 0.85)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Email address
                </label>
                <input
                  id="reset-email-input"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#fff',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  id="cancel-reset-password"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetStatus(null);
                    setResetError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-reset-password"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: themeStyles.primaryBtn,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: `0 4px 14px ${themeStyles.primaryBtnHover}`,
                  }}
                >
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PASSWORD RECOVERY MODAL (FROM EMAIL LINK) ───────────────────── */}
      {isPasswordRecovery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: '#0f172a',
              borderRadius: '20px',
              border: `1px solid ${themeStyles.accentBorder}`,
              padding: '1.75rem',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Set New Password
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'rgba(203, 213, 225, 0.7)' }}>
              Enter a new secure password for your account (minimum 6 characters).
            </p>

            {recoveryError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoveryStatus && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#34d399' }} />
                <span>{recoveryStatus}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label
                  htmlFor="recovery-new-password"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(203, 213, 225, 0.85)',
                    marginBottom: '0.35rem',
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recovery-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{
                      width: '100%',
                      padding: '0.8rem 2.5rem 0.8rem 0.8rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(148, 163, 184, 0.7)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="recovery-confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(203, 213, 225, 0.85)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recovery-confirm-password"
                    type={showRecoveryConfirmPassword ? 'text' : 'password'}
                    required
                    value={recoveryConfirmPassword}
                    onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{
                      width: '100%',
                      padding: '0.8rem 2.5rem 0.8rem 0.8rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryConfirmPassword(!showRecoveryConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(148, 163, 184, 0.7)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showRecoveryConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  id="cancel-recovery-password"
                  onClick={dismissPasswordRecovery}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-recovery-password"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: themeStyles.primaryBtn,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: `0 4px 14px ${themeStyles.primaryBtnHover}`,
                    fontSize: '0.9rem',
                  }}
                >
                  {submitting ? 'Saving…' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
