// Script to generate high-resolution anime aesthetic wallpapers (SVG)
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/wallpapers');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Anime Cherry Blossom Night
const sakuraNight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0b0319" />
      <stop offset="40%" stop-color="#180b33" />
      <stop offset="75%" stop-color="#2d134b" />
      <stop offset="100%" stop-color="#461c6b" />
    </linearGradient>
    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#fdf2f8" stop-opacity="0.8" />
      <stop offset="70%" stop-color="#f472b6" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="nebulaPink" cx="30%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#0b0319" stop-opacity="0" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Sky Base -->
  <rect width="1920" height="1080" fill="url(#skyGrad)" />
  <rect width="1920" height="1080" fill="url(#nebulaPink)" />

  <!-- Stars -->
  <g fill="#ffffff" opacity="0.85">
    <circle cx="120" cy="80" r="1.5" /><circle cx="280" cy="190" r="2" /><circle cx="450" cy="90" r="1.2" />
    <circle cx="620" cy="220" r="1.8" /><circle cx="780" cy="110" r="2.2" /><circle cx="940" cy="70" r="1.5" />
    <circle cx="1120" cy="160" r="2" /><circle cx="1340" cy="95" r="1.6" /><circle cx="1520" cy="180" r="2" />
    <circle cx="1680" cy="120" r="1.4" /><circle cx="1820" cy="70" r="2.4" /><circle cx="180" cy="340" r="1.8" />
    <circle cx="350" cy="420" r="1.2" /><circle cx="890" cy="310" r="2" /><circle cx="1230" cy="380" r="1.5" />
    <circle cx="1450" cy="290" r="1.7" /><circle cx="1740" cy="390" r="2" /><circle cx="560" cy="480" r="1.3" />
  </g>

  <!-- Giant Moon -->
  <circle cx="1420" cy="320" r="160" fill="url(#moonGlow)" filter="url(#glow)" />
  <circle cx="1420" cy="320" r="85" fill="#fff5f9" opacity="0.9" />

  <!-- Mountain Silhouettes -->
  <path d="M0 1080 L0 780 Q240 680 480 750 T960 720 T1440 760 T1920 690 L1920 1080 Z" fill="#130826" opacity="0.7" />
  <path d="M0 1080 L0 840 Q320 740 640 820 T1280 790 T1920 830 L1920 1080 Z" fill="#0d041c" />

  <!-- Distant Pagoda Silhouette -->
  <g fill="#080212" transform="translate(1320, 680) scale(0.65)">
    <rect x="80" y="80" width="40" height="70" />
    <path d="M50 80 Q100 65 150 80 L140 70 Q100 55 60 70 Z" />
    <rect x="85" y="45" width="30" height="25" />
    <path d="M60 45 Q100 32 140 45 L130 36 Q100 24 70 36 Z" />
    <rect x="90" y="20" width="20" height="16" />
    <path d="M70 20 Q100 10 130 20 L122 13 Q100 4 78 13 Z" />
    <line x1="100" y1="0" x2="100" y2="15" stroke="#080212" stroke-width="4" />
  </g>

  <!-- Cherry Blossom Branches (Silhouette) -->
  <g fill="#090214">
    <path d="M0 0 C180 80 340 120 540 90 C420 130 310 180 220 280 C180 210 120 160 0 130 Z" />
    <path d="M1920 0 C1720 110 1560 140 1340 90 C1460 140 1590 220 1680 320 C1740 240 1810 170 1920 140 Z" />
  </g>

  <!-- Glowing Pink Sakura Petals -->
  <g fill="#f472b6" opacity="0.85" filter="url(#glow)">
    <ellipse cx="260" cy="140" rx="14" ry="7" transform="rotate(-25 260 140)" fill="#fb7185" />
    <ellipse cx="380" cy="180" rx="16" ry="8" transform="rotate(35 380 180)" fill="#f472b6" />
    <ellipse cx="490" cy="120" rx="12" ry="6" transform="rotate(-15 490 120)" fill="#fbcfe8" />
    <ellipse cx="320" cy="260" rx="14" ry="7" transform="rotate(45 320 260)" fill="#fb7185" />
    <ellipse cx="640" cy="240" rx="10" ry="5" transform="rotate(60 640 240)" fill="#f472b6" />
    <ellipse cx="820" cy="380" rx="13" ry="6" transform="rotate(-40 820 380)" fill="#fbcfe8" />
    <ellipse cx="1040" cy="490" rx="11" ry="5" transform="rotate(20 1040 490)" fill="#f472b6" />
    <ellipse cx="1240" cy="420" rx="14" ry="7" transform="rotate(-30 1240 420)" fill="#fb7185" />
    <ellipse cx="1480" cy="220" rx="15" ry="8" transform="rotate(50 1480 220)" fill="#f472b6" />
    <ellipse cx="1620" cy="160" rx="16" ry="7" transform="rotate(-20 1620 160)" fill="#fbcfe8" />
    <ellipse cx="1730" cy="280" rx="12" ry="6" transform="rotate(30 1730 280)" fill="#fb7185" />
    <ellipse cx="1560" cy="340" rx="10" ry="5" transform="rotate(-65 1560 340)" fill="#f472b6" />
  </g>
</svg>`;

// 2. Purple Fantasy Moonlight
const purpleMoonlight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="moonSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#070214" />
      <stop offset="50%" stop-color="#180738" />
      <stop offset="100%" stop-color="#3b136f" />
    </linearGradient>
    <radialGradient id="superMoon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#e9d5ff" />
      <stop offset="55%" stop-color="#a855f7" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#3b136f" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a0d52" />
      <stop offset="100%" stop-color="#0a0316" />
    </linearGradient>
    <filter id="fantasyGlow">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Sky -->
  <rect width="1920" height="1080" fill="url(#moonSky)" />

  <!-- Stars -->
  <g fill="#c084fc" opacity="0.8">
    <circle cx="200" cy="150" r="2" /><circle cx="340" cy="90" r="1.5" /><circle cx="510" cy="220" r="2.5" />
    <circle cx="720" cy="120" r="1.8" /><circle cx="890" cy="70" r="2" /><circle cx="1100" cy="190" r="1.4" />
    <circle cx="1350" cy="110" r="2.2" /><circle cx="1580" cy="240" r="1.6" /><circle cx="1750" cy="80" r="2" />
  </g>

  <!-- Huge Fantasy Supermoon -->
  <circle cx="960" cy="380" r="240" fill="url(#superMoon)" filter="url(#fantasyGlow)" />
  <circle cx="960" cy="380" r="140" fill="#f5f3ff" opacity="0.95" />

  <!-- Mountain Ranges -->
  <path d="M0 720 L300 520 L620 660 L960 480 L1320 640 L1680 510 L1920 690 L1920 1080 L0 1080 Z" fill="#14062a" opacity="0.6" />
  <path d="M0 780 L240 640 L520 740 L880 610 L1240 730 L1580 620 L1920 760 L1920 1080 L0 1080 Z" fill="#0d031c" />

  <!-- Reflective Water Lake -->
  <rect x="0" y="820" width="1920" height="260" fill="url(#lakeGrad)" />
  <!-- Moonlight Water Reflection -->
  <path d="M880 820 L1040 820 L1120 1080 L800 1080 Z" fill="#a855f7" opacity="0.18" filter="url(#fantasyGlow)" />
  <ellipse cx="960" cy="900" rx="120" ry="8" fill="#e9d5ff" opacity="0.4" />
  <ellipse cx="960" cy="950" rx="160" ry="10" fill="#e9d5ff" opacity="0.3" />
  <ellipse cx="960" cy="1010" rx="200" ry="12" fill="#c084fc" opacity="0.25" />
</svg>`;

// 3. Cyberpunk Neon City
const cyberpunkCity = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="cyberSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#05000d" />
      <stop offset="60%" stop-color="#140228" />
      <stop offset="100%" stop-color="#2d054f" />
    </linearGradient>
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff007f" />
      <stop offset="100%" stop-color="#7900ff" />
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#4facfe" />
    </linearGradient>
    <filter id="cyberGlow">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="1920" height="1080" fill="url(#cyberSky)" />

  <!-- Distant Skyscrapers Silhouette -->
  <g fill="#0a0118">
    <rect x="80" y="380" width="120" height="700" />
    <rect x="230" y="280" width="160" height="800" />
    <rect x="420" y="440" width="90" height="640" />
    <rect x="540" y="320" width="180" height="760" />
    <rect x="750" y="220" width="140" height="860" />
    <rect x="920" y="360" width="200" height="720" />
    <rect x="1150" y="260" width="160" height="820" />
    <rect x="1340" y="420" width="110" height="660" />
    <rect x="1480" y="310" width="190" height="770" />
    <rect x="1700" y="370" width="140" height="710" />
  </g>

  <!-- Midground Neon Lit Buildings -->
  <g fill="#070010" stroke="#00f2fe" stroke-width="1.5" opacity="0.85">
    <rect x="160" y="460" width="150" height="620" />
    <rect x="340" y="380" width="130" height="700" stroke="#ff007f" />
    <rect x="620" y="410" width="170" height="670" stroke="#a855f7" />
    <rect x="830" y="300" width="120" height="780" stroke="#00f2fe" />
    <rect x="1000" y="430" width="180" height="650" stroke="#ff007f" />
    <rect x="1220" y="360" width="150" height="720" stroke="#00f2fe" />
    <rect x="1420" y="450" width="160" height="630" stroke="#a855f7" />
    <rect x="1620" y="400" width="140" height="680" stroke="#ff007f" />
  </g>

  <!-- Neon Window Grids & Billboard Accents -->
  <g fill="#00f2fe" opacity="0.6" filter="url(#cyberGlow)">
    <rect x="180" y="500" width="20" height="8" /><rect x="220" y="500" width="20" height="8" />
    <rect x="180" y="540" width="20" height="8" /><rect x="220" y="540" width="20" height="8" />
    <rect x="850" y="340" width="80" height="15" fill="#ff007f" />
    <rect x="850" y="380" width="30" height="10" />
    <rect x="1240" y="400" width="90" height="20" fill="#a855f7" />
    <rect x="1240" y="440" width="30" height="10" />
    <rect x="1640" y="440" width="80" height="14" fill="#00f2fe" />
  </g>

  <!-- Flying Light Beams / Traffic Trails -->
  <line x1="0" y1="840" x2="1920" y2="760" stroke="#ff007f" stroke-width="3" filter="url(#cyberGlow)" opacity="0.8" />
  <line x1="0" y1="880" x2="1920" y2="820" stroke="#00f2fe" stroke-width="2.5" filter="url(#cyberGlow)" opacity="0.75" />
</svg>`;

// 4. Japanese Summer Sunset
const summerSunset = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#14052b" />
      <stop offset="35%" stop-color="#4a154b" />
      <stop offset="65%" stop-color="#a62639" />
      <stop offset="85%" stop-color="#db5461" />
      <stop offset="100%" stop-color="#f7a072" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#fed7aa" />
      <stop offset="70%" stop-color="#f97316" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#a62639" stop-opacity="0" />
    </radialGradient>
    <filter id="sunsetFilter">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="1920" height="1080" fill="url(#sunsetSky)" />

  <!-- Huge Sunset Sun -->
  <circle cx="1320" cy="560" r="180" fill="url(#sunGlow)" filter="url(#sunsetFilter)" />
  <circle cx="1320" cy="560" r="100" fill="#fff7ed" opacity="0.9" />

  <!-- Distant Mount Fuji Silhouette -->
  <polygon points="960,420 1260,780 660,780" fill="#2d0b3b" opacity="0.8" />
  <polygon points="960,420 1040,510 880,510" fill="#e9d5ff" opacity="0.35" />

  <!-- Foreground Mountain Ridge -->
  <path d="M0 1080 L0 800 Q360 700 720 780 T1440 760 T1920 710 L1920 1080 Z" fill="#170321" />

  <!-- Torii Gate Silhouette on Hill -->
  <g fill="#0b0110" transform="translate(320, 640) scale(0.9)">
    <rect x="40" y="50" width="18" height="180" />
    <rect x="182" y="50" width="18" height="180" />
    <rect x="10" y="40" width="220" height="16" rx="3" />
    <rect x="25" y="75" width="190" height="12" />
    <rect x="110" y="54" width="20" height="23" />
  </g>

  <!-- Birds in Flight -->
  <g stroke="#170321" stroke-width="2.5" fill="none">
    <path d="M720 320 Q730 310 740 320 Q750 310 760 320" />
    <path d="M780 340 Q788 332 796 340 Q804 332 812 340" />
    <path d="M830 315 Q837 308 844 315 Q851 308 858 315" />
  </g>
</svg>`;

// 5. Starry Galaxy
const starryGalaxy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="nebulaCenter" cx="45%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.6" />
      <stop offset="35%" stop-color="#4f46e5" stop-opacity="0.4" />
      <stop offset="65%" stop-color="#06b6d4" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#030014" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="nebulaPink2" cx="70%" cy="40%" r="40%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#a855f7" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#030014" stop-opacity="0" />
    </radialGradient>
    <filter id="starGlow">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Space Background -->
  <rect width="1920" height="1080" fill="#04010f" />
  <rect width="1920" height="1080" fill="url(#nebulaCenter)" />
  <rect width="1920" height="1080" fill="url(#nebulaPink2)" />

  <!-- Swirling Galactic Dust -->
  <g fill="#ffffff">
    <circle cx="150" cy="120" r="1.5" /><circle cx="280" cy="240" r="2.2" filter="url(#starGlow)" />
    <circle cx="430" cy="180" r="1.2" /><circle cx="610" cy="90" r="2.8" filter="url(#starGlow)" />
    <circle cx="780" cy="260" r="1.4" /><circle cx="920" cy="140" r="3.2" filter="url(#starGlow)" />
    <circle cx="1060" cy="220" r="1.6" /><circle cx="1250" cy="80" r="2.5" filter="url(#starGlow)" />
    <circle cx="1420" cy="250" r="1.4" /><circle cx="1620" cy="130" r="3.5" filter="url(#starGlow)" />
    <circle cx="1780" cy="290" r="1.8" /><circle cx="220" cy="480" r="1.5" />
    <circle cx="460" cy="560" r="2.5" filter="url(#starGlow)" /><circle cx="820" cy="480" r="1.8" />
    <circle cx="1140" cy="520" r="3.0" filter="url(#starGlow)" /><circle cx="1380" cy="460" r="1.5" />
    <circle cx="1560" cy="620" r="2.2" filter="url(#starGlow)" /><circle cx="1720" cy="540" r="1.6" />
  </g>

  <!-- Radiant Big Starburst -->
  <g transform="translate(920, 360)" filter="url(#starGlow)">
    <circle cx="0" cy="0" r="8" fill="#ffffff" />
    <line x1="-40" y1="0" x2="40" y2="0" stroke="#ffffff" stroke-width="2" />
    <line x1="0" y1="-40" x2="0" y2="40" stroke="#ffffff" stroke-width="2" />
    <line x1="-20" y1="-20" x2="20" y2="20" stroke="#c084fc" stroke-width="1.5" />
    <line x1="-20" y1="20" x2="20" y2="-20" stroke="#c084fc" stroke-width="1.5" />
  </g>
</svg>`;

// 6. Minimal Dark Purple
const minimalDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#140827" />
      <stop offset="60%" stop-color="#0a0314" />
      <stop offset="100%" stop-color="#040108" />
    </radialGradient>
    <linearGradient id="purpleMesh" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.08" />
      <stop offset="50%" stop-color="#ec4899" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.08" />
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="url(#vignette)" />
  <rect width="1920" height="1080" fill="url(#purpleMesh)" />

  <!-- Subtle Ambient Glow Orbs -->
  <circle cx="300" cy="200" r="350" fill="#8b5cf6" opacity="0.06" />
  <circle cx="1600" cy="800" r="450" fill="#ec4899" opacity="0.05" />
  <circle cx="960" cy="540" r="500" fill="#6366f1" opacity="0.04" />
</svg>`;

fs.writeFileSync(path.join(outDir, 'sakura-night.svg'), sakuraNight.trim(), 'utf8');
fs.writeFileSync(path.join(outDir, 'purple-moonlight.svg'), purpleMoonlight.trim(), 'utf8');
fs.writeFileSync(path.join(outDir, 'cyberpunk-city.svg'), cyberpunkCity.trim(), 'utf8');
fs.writeFileSync(path.join(outDir, 'summer-sunset.svg'), summerSunset.trim(), 'utf8');
fs.writeFileSync(path.join(outDir, 'starry-galaxy.svg'), starryGalaxy.trim(), 'utf8');
fs.writeFileSync(path.join(outDir, 'minimal-dark.svg'), minimalDark.trim(), 'utf8');

console.log('Successfully generated all 6 anime wallpapers!');

