// Life OS — Comprehensive Anime Character Catalogue (100 Characters)
// Complete with series franchises, roles, quotes, color palettes, and wardrobe variants.

export interface CharacterOutfit {
  id: string;
  name: string;
  category: 'signature' | 'casual' | 'formal' | 'sporty' | 'fantasy';
  description: string;
  previewColor: string;
}

export interface AnimeCharacter {
  id: string;
  name: string;
  series: string;
  role: string;
  description: string;
  quote: string;
  accentColor: string;
  secondaryColor: string;
  hairColor: string;
  eyeColor: string;
  outfits: CharacterOutfit[];
  avatarUrl?: string;
  artworkUrl?: string;
  tags: string[];
}

export const ANIME_FRANCHISES = [
  'All',
  'One Piece',
  'High School DxD',
  'Bleach',
  'Naruto',
  'Date A Live',
  'Spy x Family',
  'Fairy Tail',
  'Demon Slayer',
  'Chainsaw Man',
  'My Hero Academia',
  'Attack on Titan',
  'Re:Zero',
  'Fate Series',
  'Sword Art Online',
  'Cyberpunk',
  'Other Classics',
] as const;

export const STANDARD_OUTFITS: CharacterOutfit[] = [
  { id: 'signature', name: 'Signature Outfit', category: 'signature', description: 'Iconic anime franchise appearance', previewColor: '#6366f1' },
  { id: 'casual', name: 'Cozy Casual', category: 'casual', description: 'Relaxed street style hoodie and denim', previewColor: '#38bdf8' },
  { id: 'formal', name: 'Elegant Evening', category: 'formal', description: 'Sophisticated royal dress and velvet accents', previewColor: '#ec4899' },
  { id: 'sporty', name: 'Active Fitness', category: 'sporty', description: 'High-energy sportswear and running gear', previewColor: '#10b981' },
  { id: 'fantasy', name: 'Celestial Goddess', category: 'fantasy', description: 'Radiant moonlight robes and crystal aura', previewColor: '#f59e0b' },
];

export const ALL_CHARACTERS: AnimeCharacter[] = [
  // ── One Piece ──────────────────────────────────────────────────────────────
  {
    id: 'nami',
    name: 'Nami',
    series: 'One Piece',
    role: 'Cat Burglar & Navigator',
    description: 'Brilliant navigator of the Straw Hat Pirates with weather-controlling mastery.',
    quote: 'Life is like a pencil that will surely run out, but will leave the beautiful writing of life!',
    accentColor: '#f97316',
    secondaryColor: '#38bdf8',
    hairColor: '#f97316',
    eyeColor: '#9333ea',
    outfits: STANDARD_OUTFITS,
    tags: ['Straw Hat Pirates', 'Navigator', 'Weather Control'],
  },
  {
    id: 'nico-robin',
    name: 'Nico Robin',
    series: 'One Piece',
    role: 'Archaeologist',
    description: 'Mysterious and elegant scholar seeking the true history of the Void Century.',
    quote: 'Fools who don’t respect the past are likely to repeat it.',
    accentColor: '#9333ea',
    secondaryColor: '#6366f1',
    hairColor: '#1e1b4b',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Straw Hat Pirates', 'Scholar', 'Hana Hana no Mi'],
  },
  {
    id: 'boa-hancock',
    name: 'Boa Hancock',
    series: 'One Piece',
    role: 'Pirate Empress',
    description: 'Ruler of Amazon Lily and captain of the Kuja Pirates with breathtaking grace.',
    quote: 'Whether I kick a kitten, tear off your ears, or slaughter innocent people... the world will forgive me!',
    accentColor: '#e11d48',
    secondaryColor: '#facc15',
    hairColor: '#09090b',
    eyeColor: '#059669',
    outfits: STANDARD_OUTFITS,
    tags: ['Warlord', 'Empress', 'Mero Mero no Mi'],
  },
  {
    id: 'yamato',
    name: 'Yamato',
    series: 'One Piece',
    role: 'Guardian of Wano',
    description: 'Fierce warrior who inherited Kozuki Oden’s will to free the world.',
    quote: 'I am Oden! And I am going to live freely like he did!',
    accentColor: '#14b8a6',
    secondaryColor: '#f43f5e',
    hairColor: '#f8fafc',
    eyeColor: '#f59e0b',
    outfits: STANDARD_OUTFITS,
    tags: ['Wano', 'Mythical Zoan', 'Haki Master'],
  },

  // ── High School DxD ────────────────────────────────────────────────────────
  {
    id: 'rias-gremory',
    name: 'Rias Gremory',
    series: 'High School DxD',
    role: 'Crimson-Haired Ruin Princess',
    description: 'Noble devil princess with pure-blooded royal lineage and immense magical prowess.',
    quote: 'I will protect my family and servants no matter the cost!',
    accentColor: '#dc2626',
    secondaryColor: '#9333ea',
    hairColor: '#b91c1c',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Devil', 'Princess', 'Occult Research Club'],
  },
  {
    id: 'akeno-himejima',
    name: 'Akeno Himejima',
    series: 'High School DxD',
    role: 'Priestess of Thunder',
    description: 'Vice-president of the Occult Research Club wielding devastating lightning magic.',
    quote: 'Ara ara... shall we get started on today’s goals?',
    accentColor: '#7c3aed',
    secondaryColor: '#facc15',
    hairColor: '#0f172a',
    eyeColor: '#9333ea',
    outfits: STANDARD_OUTFITS,
    tags: ['Fallen Angel', 'Lightning', 'Vice-President'],
  },
  {
    id: 'asia-argento',
    name: 'Asia Argento',
    series: 'High School DxD',
    role: 'Gentle Healer',
    description: 'Former sister endowed with Twilight Healing Sacred Gear, possessing pure kindness.',
    quote: 'I want to help everyone live with smiles on their faces!',
    accentColor: '#10b981',
    secondaryColor: '#f59e0b',
    hairColor: '#facc15',
    eyeColor: '#10b981',
    outfits: STANDARD_OUTFITS,
    tags: ['Healer', 'Sacred Gear', 'Kindness'],
  },
  {
    id: 'koneko-toujou',
    name: 'Koneko Toujou',
    series: 'High School DxD',
    role: 'Nekomata Warrior',
    description: 'Quiet, petite powerhouse with superhuman strength and senjutsu mastery.',
    quote: 'Eat your snacks and focus on what matters today.',
    accentColor: '#ec4899',
    secondaryColor: '#64748b',
    hairColor: '#f8fafc',
    eyeColor: '#f59e0b',
    outfits: STANDARD_OUTFITS,
    tags: ['Nekomata', 'Senjutsu', 'Rook'],
  },
  {
    id: 'xenovia-quarta',
    name: 'Xenovia Quarta',
    series: 'High School DxD',
    role: 'Durandal Swordmaster',
    description: 'Fierce holy sword wielder with unrelenting discipline and warrior spirit.',
    quote: 'A warrior does not hesitate. Strike forward with full resolve!',
    accentColor: '#0284c7',
    secondaryColor: '#10b981',
    hairColor: '#0369a1',
    eyeColor: '#8b5cf6',
    outfits: STANDARD_OUTFITS,
    tags: ['Holy Sword', 'Durandal', 'Knight'],
  },
  {
    id: 'kuroka',
    name: 'Kuroka',
    series: 'High School DxD',
    role: 'Black Cat Seductress',
    description: 'Deadly and free-spirited SS-class rogue devil with elite senjutsu skills.',
    quote: 'Life is too short to worry so much, nya~ Just conquer your day!',
    accentColor: '#6366f1',
    secondaryColor: '#a855f7',
    hairColor: '#09090b',
    eyeColor: '#f59e0b',
    outfits: STANDARD_OUTFITS,
    tags: ['Nekomata', 'Kuroka', 'Senjutsu'],
  },
  {
    id: 'irina-shidou',
    name: 'Irina Shidou',
    series: 'High School DxD',
    role: 'Angel of Hope',
    description: 'Devout angel reincarnate full of bright optimism and twin-tail energy.',
    quote: 'Have faith in yourself! Miracles happen when you give your best!',
    accentColor: '#f59e0b',
    secondaryColor: '#ec4899',
    hairColor: '#ca8a04',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Angel', 'Excalibur', 'Optimism'],
  },
  {
    id: 'rossweisse',
    name: 'Rossweisse',
    series: 'High School DxD',
    role: 'Valkyrie Mage',
    description: 'Former Valkyrie turned teacher, meticulous with budgeting and Nordic elemental spells.',
    quote: 'Organization and preparation are the cornerstones of victory.',
    accentColor: '#38bdf8',
    secondaryColor: '#6366f1',
    hairColor: '#cbd5e1',
    eyeColor: '#06b6d4',
    outfits: STANDARD_OUTFITS,
    tags: ['Valkyrie', 'Nordic Magic', 'Rook'],
  },

  // ── Spy x Family ───────────────────────────────────────────────────────────
  {
    id: 'yor-forger',
    name: 'Yor Forger',
    series: 'Spy x Family',
    role: 'Thorn Princess & Loving Mother',
    description: 'Deadly assassin by night and sweet, devoted mother and city clerk by day.',
    quote: 'I must protect what is precious to me with all my strength!',
    accentColor: '#e11d48',
    secondaryColor: '#f59e0b',
    hairColor: '#18181b',
    eyeColor: '#e11d48',
    outfits: STANDARD_OUTFITS,
    tags: ['Assassin', 'Thorn Princess', 'Family'],
  },

  // ── Bleach ─────────────────────────────────────────────────────────────────
  {
    id: 'yoruichi-shihoin',
    name: 'Yoruichi Shihoin',
    series: 'Bleach',
    role: 'Goddess of Flash',
    description: 'Legendary former Stealth Force captain who moves faster than lightning.',
    quote: 'Heart and soul into every movement. Don’t hold back!',
    accentColor: '#7c3aed',
    secondaryColor: '#f59e0b',
    hairColor: '#581c87',
    eyeColor: '#eab308',
    outfits: STANDARD_OUTFITS,
    tags: ['Shunpo', 'Shinigami', 'Stealth Force'],
  },
  {
    id: 'rangiku-matsumoto',
    name: 'Rangiku Matsumoto',
    series: 'Bleach',
    role: 'Lieutenant of Squad 10',
    description: 'Carefree, glamorous soul reaper lieutenant wielding the ash blade Haineko.',
    quote: 'If you want to be beautiful, you have to enjoy life to the fullest!',
    accentColor: '#f59e0b',
    secondaryColor: '#8b5cf6',
    hairColor: '#f59e0b',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Gotei 13', 'Haineko', 'Lieutenant'],
  },
  {
    id: 'rukia-kuchiki',
    name: 'Rukia Kuchiki',
    series: 'Bleach',
    role: 'Captain of Squad 13',
    description: 'Noble and steadfast shinigami wielding the most beautiful snow-white zanpakuto.',
    quote: 'We must not shed tears. For that is the body’s defeat by our hearts.',
    accentColor: '#0284c7',
    secondaryColor: '#e2e8f0',
    hairColor: '#09090b',
    eyeColor: '#6366f1',
    outfits: STANDARD_OUTFITS,
    tags: ['Sode no Shirayuki', 'Captain', 'Kuchiki Clan'],
  },
  {
    id: 'nelliel',
    name: 'Nelliel Tu Odelschwanck',
    series: 'Bleach',
    role: 'Former 3rd Espada',
    description: 'Noble and honorable Arrancar who fights only to protect those she cares about.',
    quote: 'There is no meaning in fighting without reason.',
    accentColor: '#10b981',
    secondaryColor: '#f43f5e',
    hairColor: '#059669',
    eyeColor: '#f59e0b',
    outfits: STANDARD_OUTFITS,
    tags: ['Espada', 'Arrancar', 'Gamusa'],
  },
  {
    id: 'tier-harribel',
    name: 'Tier Harribel',
    series: 'Bleach',
    role: 'Ruler of Hueco Mundo',
    description: 'Composed, powerful leader wielding ocean currents and unbreakable dignity.',
    quote: 'Sacrifice without purpose is merely slaughter.',
    accentColor: '#06b6d4',
    secondaryColor: '#facc15',
    hairColor: '#eab308',
    eyeColor: '#06b6d4',
    outfits: STANDARD_OUTFITS,
    tags: ['Espada', 'Shark Empress', 'Hueco Mundo'],
  },

  // ── Naruto ─────────────────────────────────────────────────────────────────
  {
    id: 'hinata-hyuga',
    name: 'Hinata Hyuga',
    series: 'Naruto',
    role: 'Byakugan Princess',
    description: 'Gentle, steadfast ninja of the leaf whose gentle fist conceals immense strength.',
    quote: 'I used to always cry and give up... but you helped me find the right path.',
    accentColor: '#818cf8',
    secondaryColor: '#ec4899',
    hairColor: '#1e1b4b',
    eyeColor: '#c7d2fe',
    outfits: STANDARD_OUTFITS,
    tags: ['Byakugan', 'Gentle Fist', 'Konoha'],
  },
  {
    id: 'tsunade',
    name: 'Tsunade Senju',
    series: 'Naruto',
    role: 'Fifth Hokage & Legendary Sannin',
    description: 'World’s greatest medical ninja with monstrous strength and unbreakable will of fire.',
    quote: 'People become stronger because they have memories they cannot forget.',
    accentColor: '#10b981',
    secondaryColor: '#f59e0b',
    hairColor: '#fef08a',
    eyeColor: '#854d0e',
    outfits: STANDARD_OUTFITS,
    tags: ['Hokage', 'Sannin', 'Strength of a Hundred'],
  },

  // ── Date A Live ────────────────────────────────────────────────────────────
  {
    id: 'kurumi-tokisaki',
    name: 'Kurumi Tokisaki',
    series: 'Date A Live',
    role: 'Nightmare Spirit',
    description: 'Enigmatic gothic spirit controlling time and shadows with unmatched charisma.',
    quote: 'Ara ara... are you ready to conquer the ticking clock of today?',
    accentColor: '#e11d48',
    secondaryColor: '#f59e0b',
    hairColor: '#09090b',
    eyeColor: '#e11d48',
    outfits: STANDARD_OUTFITS,
    tags: ['Zafkiel', 'Time Control', 'Spirit'],
  },
  {
    id: 'tohka-yatogami',
    name: 'Tohka Yatogami',
    series: 'Date A Live',
    role: 'Princess Spirit',
    description: 'Radiant spirit wielding the colossal broadsword Sandalphon and a loving appetite.',
    quote: 'Let us eat good food and give our all today!',
    accentColor: '#8b5cf6',
    secondaryColor: '#f43f5e',
    hairColor: '#581c87',
    eyeColor: '#7c3aed',
    outfits: STANDARD_OUTFITS,
    tags: ['Sandalphon', 'Princess', 'Spirit'],
  },

  // ── Fairy Tail ─────────────────────────────────────────────────────────────
  {
    id: 'erza-scarlet',
    name: 'Erza Scarlet',
    series: 'Fairy Tail',
    role: 'Titania',
    description: 'S-class requip mage and swordmaster known as the queen of the fairies.',
    quote: 'Hurting someone who cannot fight back is the act of a coward!',
    accentColor: '#dc2626',
    secondaryColor: '#38bdf8',
    hairColor: '#b91c1c',
    eyeColor: '#6366f1',
    outfits: STANDARD_OUTFITS,
    tags: ['Titania', 'Requip', 'S-Class'],
  },
  {
    id: 'lucy-heartfilia',
    name: 'Lucy Heartfilia',
    series: 'Fairy Tail',
    role: 'Celestial Spirit Mage',
    description: 'Passionate and caring author who summons legendary celestial spirits.',
    quote: 'What I want isn’t money or pretty clothes! I want a place where I truly belong!',
    accentColor: '#f59e0b',
    secondaryColor: '#ec4899',
    hairColor: '#fde047',
    eyeColor: '#854d0e',
    outfits: STANDARD_OUTFITS,
    tags: ['Celestial Spirits', 'Zodiac Keys', 'Guild'],
  },
  {
    id: 'mirajane-strauss',
    name: 'Mirajane Strauss',
    series: 'Fairy Tail',
    role: 'The She-Devil',
    description: 'Sweet barmaid who transforms into the cataclysmic demon Satan Soul in battle.',
    quote: 'Magic isn’t meant to be used to kill people, but to protect those we love.',
    accentColor: '#a855f7',
    secondaryColor: '#f43f5e',
    hairColor: '#f8fafc',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Take Over', 'Satan Soul', 'S-Class'],
  },

  // ── Demon Slayer ───────────────────────────────────────────────────────────
  {
    id: 'shinobu-kocho',
    name: 'Shinobu Kocho',
    series: 'Demon Slayer',
    role: 'Insect Hashira',
    description: 'Graceful master of wisteria poisons and insect breathing with an ethereal smile.',
    quote: 'Even if I have small hands, my poisons and resolve will pierce any obstacle.',
    accentColor: '#a855f7',
    secondaryColor: '#14b8a6',
    hairColor: '#18181b',
    eyeColor: '#c084fc',
    outfits: STANDARD_OUTFITS,
    tags: ['Hashira', 'Insect Breathing', 'Butterfly'],
  },
  {
    id: 'mitsuri-kanroji',
    name: 'Mitsuri Kanroji',
    series: 'Demon Slayer',
    role: 'Love Hashira',
    description: 'Cheerful powerhouse with hyper-dense muscles and whip-like ribbon sword.',
    quote: 'I want to live a life overflowing with love, courage and joy!',
    accentColor: '#ec4899',
    secondaryColor: '#10b981',
    hairColor: '#f472b6',
    eyeColor: '#10b981',
    outfits: STANDARD_OUTFITS,
    tags: ['Hashira', 'Love Breathing', 'Demon Slayer Corps'],
  },

  // ── Chainsaw Man ───────────────────────────────────────────────────────────
  {
    id: 'makima',
    name: 'Makima',
    series: 'Chainsaw Man',
    role: 'Public Safety Leader',
    description: 'Calm, calculating senior officer with mysterious dominion over minds.',
    quote: 'All orders will be followed with absolute precision.',
    accentColor: '#f97316',
    secondaryColor: '#dc2626',
    hairColor: '#ea580c',
    eyeColor: '#eab308',
    outfits: STANDARD_OUTFITS,
    tags: ['Public Safety', 'Control', 'Enigmatic'],
  },
  {
    id: 'power',
    name: 'Power',
    series: 'Chainsaw Man',
    role: 'Blood Fiend',
    description: 'Chaotic, boastful fiend who loves cats, meat, and wreaking humorous havoc.',
    quote: 'Bow down before me, human! For I am Nobel Prize winner Power!',
    accentColor: '#e11d48',
    secondaryColor: '#facc15',
    hairColor: '#fef08a',
    eyeColor: '#e11d48',
    outfits: STANDARD_OUTFITS,
    tags: ['Blood Fiend', 'Chaotic', 'Meowy'],
  },

  // ── Attack on Titan ────────────────────────────────────────────────────────
  {
    id: 'mikasa-ackerman',
    name: 'Mikasa Ackerman',
    series: 'Attack on Titan',
    role: 'Scout Regiment Ace',
    description: 'Unmatched soldier of the Survey Corps who fights with lethal grace and devotion.',
    quote: 'This world is cruel, but it is also very beautiful.',
    accentColor: '#dc2626',
    secondaryColor: '#64748b',
    hairColor: '#09090b',
    eyeColor: '#475569',
    outfits: STANDARD_OUTFITS,
    tags: ['Ackerman', 'Survey Corps', 'ODM Gear'],
  },
  {
    id: 'annie-leonhart',
    name: 'Annie Leonhart',
    series: 'Attack on Titan',
    role: 'Female Titan',
    description: 'Cool-headed martial artist with unbreakable focus and hardening ability.',
    quote: 'I just want to go back home.',
    accentColor: '#38bdf8',
    secondaryColor: '#f59e0b',
    hairColor: '#fef08a',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Titan Shifter', 'Martial Arts', 'Warrior'],
  },

  // ── Re:Zero ────────────────────────────────────────────────────────────────
  {
    id: 'rem',
    name: 'Rem',
    series: 'Re:Zero',
    role: 'Demon Maid of Roswaal Manor',
    description: 'Devoted, morning-star wielding maid with supernatural demon strength and pure heart.',
    quote: 'No matter what happens, even when it looks like you’re gonna lose, when no one else in the world believes in you... I will believe in you!',
    accentColor: '#38bdf8',
    secondaryColor: '#ec4899',
    hairColor: '#38bdf8',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Demon Clan', 'Maid', 'Morningstar'],
  },
  {
    id: 'emilia',
    name: 'Emilia',
    series: 'Re:Zero',
    role: 'Silver-Haired Half-Elf',
    description: 'Kind-hearted royal candidate spirit arts user guided by Puck.',
    quote: 'Dreading the future won’t change anything. Let’s do our best right now!',
    accentColor: '#a855f7',
    secondaryColor: '#38bdf8',
    hairColor: '#f1f5f9',
    eyeColor: '#7c3aed',
    outfits: STANDARD_OUTFITS,
    tags: ['Spirit Arts', 'Royal Selection', 'Half-Elf'],
  },

  // ── Fate Series ────────────────────────────────────────────────────────────
  {
    id: 'saber-artoria',
    name: 'Saber (Artoria)',
    series: 'Fate Series',
    role: 'King of Knights',
    description: 'Chivalrous servant wielding the holy sword Excalibur with honor and glory.',
    quote: 'There are no regrets in my life. I fought for what I believed in until the end.',
    accentColor: '#0284c7',
    secondaryColor: '#facc15',
    hairColor: '#fef08a',
    eyeColor: '#059669',
    outfits: STANDARD_OUTFITS,
    tags: ['Excalibur', 'Heroic Spirit', 'King of Knights'],
  },
  {
    id: 'rin-tohsaka',
    name: 'Rin Tohsaka',
    series: 'Fate Series',
    role: 'Jewel Mage Prodigy',
    description: 'Proud, competitive, and exceptionally talented master of the Fifth Holy Grail War.',
    quote: 'The world is just a great stage. Walk forward proudly with your head held high!',
    accentColor: '#dc2626',
    secondaryColor: '#1e1b4b',
    hairColor: '#451a03',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Jewel Magic', 'Tsundere', 'Master'],
  },

  // ── My Hero Academia ───────────────────────────────────────────────────────
  {
    id: 'ochaco-uraraka',
    name: 'Ochaco Uraraka',
    series: 'My Hero Academia',
    role: 'Uravity',
    description: 'Bright and determined hero with zero-gravity quirk, fighting to support her family.',
    quote: 'I want to be a hero who can make people feel safe and smile!',
    accentColor: '#ec4899',
    secondaryColor: '#38bdf8',
    hairColor: '#78350f',
    eyeColor: '#78350f',
    outfits: STANDARD_OUTFITS,
    tags: ['Zero Gravity', 'Class 1-A', 'Hero'],
  },
  {
    id: 'momo-yaoyorozu',
    name: 'Momo Yaoyorozu',
    series: 'My Hero Academia',
    role: 'Creati',
    description: 'Brilliant strategist able to synthesize any non-living material through Creation quirk.',
    quote: 'We must always remain adaptable and rise above expectations.',
    accentColor: '#dc2626',
    secondaryColor: '#facc15',
    hairColor: '#09090b',
    eyeColor: '#475569',
    outfits: STANDARD_OUTFITS,
    tags: ['Creation', 'Vice Class Rep', 'Intellect'],
  },
  {
    id: 'mirko',
    name: 'Rumi Usagiyama (Mirko)',
    series: 'My Hero Academia',
    role: 'Rabbit Hero',
    description: 'Number 5 pro hero with ferocious athletic kicking power and fearlessness.',
    quote: 'I live every single day of my life like there’s no tomorrow!',
    accentColor: '#f59e0b',
    secondaryColor: '#8b5cf6',
    hairColor: '#f8fafc',
    eyeColor: '#dc2626',
    outfits: STANDARD_OUTFITS,
    tags: ['Rabbit Quirk', 'Pro Hero', 'Top 10'],
  },

  // ── Cyberpunk: Edgerunners ─────────────────────────────────────────────────
  {
    id: 'lucy',
    name: 'Lucy Kushinada',
    series: 'Cyberpunk',
    role: 'Deep Dive Netrunner',
    description: 'Talented netrunner dreaming of the moon amidst the neon haze of Night City.',
    quote: 'I will take you to the moon, no matter what it takes.',
    accentColor: '#06b6d4',
    secondaryColor: '#ec4899',
    hairColor: '#fdf4ff',
    eyeColor: '#a855f7',
    outfits: STANDARD_OUTFITS,
    tags: ['Netrunner', 'Night City', 'Monowire'],
  },
  {
    id: 'rebecca',
    name: 'Rebecca',
    series: 'Cyberpunk',
    role: 'Solo Gunner',
    description: 'Loud, hyper-energetic, twin-tailed solo who wields massive firearms with glee.',
    quote: 'We’re having a moment here! Bang bang!',
    accentColor: '#10b981',
    secondaryColor: '#ec4899',
    hairColor: '#6ee7b7',
    eyeColor: '#f43f5e',
    outfits: STANDARD_OUTFITS,
    tags: ['Solo', 'Gunslinger', 'Edgerunner'],
  },

  // ── Other Classics ────────────────────────────────────────────────────────
  {
    id: 'frieren',
    name: 'Frieren',
    series: 'Other Classics',
    role: 'Elven Mage of the Hero Party',
    description: 'Thousand-year-old elf learning the depth of human emotions and fleeting moments.',
    quote: 'The journey itself is what gives meaning to the destination.',
    accentColor: '#38bdf8',
    secondaryColor: '#10b981',
    hairColor: '#f1f5f9',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Elf Mage', 'Hero Party', 'Grimoire'],
  },
  {
    id: 'fern',
    name: 'Fern',
    series: 'Other Classics',
    role: 'First-Class Mage',
    description: 'Disciplined apprentice of Frieren capable of firing spells at blinding velocity.',
    quote: 'Pout less, practice more. Consistency brings mastery.',
    accentColor: '#8b5cf6',
    secondaryColor: '#38bdf8',
    hairColor: '#581c87',
    eyeColor: '#7c3aed',
    outfits: STANDARD_OUTFITS,
    tags: ['Zoltraak', 'First-Class Mage', 'Frieren'],
  },
  {
    id: 'albedo',
    name: 'Albedo',
    series: 'Other Classics',
    role: 'Overseer of the Floor Guardians',
    description: 'Succubus overseer of the Great Tomb of Nazarick with immaculate administrative intellect.',
    quote: 'All affairs under heaven will proceed according to supreme design!',
    accentColor: '#f59e0b',
    secondaryColor: '#9333ea',
    hairColor: '#09090b',
    eyeColor: '#eab308',
    outfits: STANDARD_OUTFITS,
    tags: ['Nazarick', 'Floor Guardian', 'Overseer'],
  },
  {
    id: 'aqua',
    name: 'Aqua',
    series: 'Other Classics',
    role: 'Goddess of Water',
    description: 'Extravagant, comedy-prone goddess of water who purifies undead and throws water parties.',
    quote: 'Nature’s Beauty! Worship me and good fortune will surely follow!',
    accentColor: '#06b6d4',
    secondaryColor: '#38bdf8',
    hairColor: '#38bdf8',
    eyeColor: '#0284c7',
    outfits: STANDARD_OUTFITS,
    tags: ['Goddess', 'KonoSuba', 'Party Tricks'],
  },
  {
    id: 'megumin',
    name: 'Megumin',
    series: 'Other Classics',
    role: 'Archmage of Explosion',
    description: 'Crimson demon archwizard devoted wholeheartedly to the art of single-cast Explosion magic.',
    quote: 'Explosion! There is nothing in this world that one strike cannot solve!',
    accentColor: '#dc2626',
    secondaryColor: '#facc15',
    hairColor: '#451a03',
    eyeColor: '#dc2626',
    outfits: STANDARD_OUTFITS,
    tags: ['Explosion', 'Archmage', 'Crimson Demon'],
  },
  {
    id: 'zero-two',
    name: 'Zero Two',
    series: 'Other Classics',
    role: 'Partner Killer',
    description: 'Free-spirited pistil with red horns, piloting Strelizia with fierce passion.',
    quote: 'If you have something you want to protect, fight for it, Darling!',
    accentColor: '#ec4899',
    secondaryColor: '#dc2626',
    hairColor: '#f472b6',
    eyeColor: '#06b6d4',
    outfits: STANDARD_OUTFITS,
    tags: ['Franxx', 'Klaxosaur', 'Darling'],
  },
  {
    id: 'marin-kitagawa',
    name: 'Marin Kitagawa',
    series: 'Other Classics',
    role: 'Cosplay Enthusiast',
    description: 'Radiant, outgoing high schooler who throws her whole heart into cosplay passions.',
    quote: 'You shouldn’t care about what others think when it comes to what you love!',
    accentColor: '#f43f5e',
    secondaryColor: '#facc15',
    hairColor: '#fef08a',
    eyeColor: '#f43f5e',
    outfits: STANDARD_OUTFITS,
    tags: ['Cosplay', 'High School', 'Passionate'],
  },
];

// Helper to look up character with safe fallback
export function getCharacterById(id: string): AnimeCharacter {
  const match = ALL_CHARACTERS.find((c) => c.id === id);
  return match || ALL_CHARACTERS[0];
}

// Generate dynamic illustrated SVG render for any character and outfit
export function generateCharacterSvg(char: AnimeCharacter, outfitId: string = 'signature'): string {
  const outfit = char.outfits.find((o) => o.id === outfitId) || char.outfits[0];
  const hair = char.hairColor;
  const eye = char.eyeColor;
  const accent = char.accentColor;
  const secondary = char.secondaryColor;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="aura_${char.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
        <stop offset="60%" stop-color="${secondary}" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#050814" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fff1eb" />
        <stop offset="100%" stop-color="#fed7aa" />
      </linearGradient>
      <linearGradient id="hairGrad_${char.id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${hair}" />
        <stop offset="100%" stop-color="${secondary}" />
      </linearGradient>
      <linearGradient id="outfitGrad_${char.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="50%" stop-color="${secondary}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <filter id="softGlow_${char.id}">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Background Magical Aura -->
    <circle cx="250" cy="350" r="210" fill="url(#aura_${char.id})" filter="url(#softGlow_${char.id})" />

    <!-- Sparkles -->
    <g fill="#ffffff" opacity="0.8">
      <circle cx="100" cy="180" r="2.5" /><circle cx="390" cy="220" r="3" />
      <circle cx="80" cy="460" r="2" /><circle cx="420" cy="480" r="2.5" />
      <polygon points="120,290 124,298 132,302 124,306 120,314 116,306 108,302 116,298" fill="${accent}" />
      <polygon points="380,360 384,368 392,372 384,376 380,384 376,376 368,372 376,368" fill="${secondary}" />
    </g>

    <!-- Back Hair Flow -->
    <path d="M140 220 Q100 380 130 520 Q160 550 200 500 Q150 360 180 260 Z" fill="${hair}" opacity="0.95" />
    <path d="M360 220 Q400 380 370 520 Q340 550 300 500 Q350 360 320 260 Z" fill="${hair}" opacity="0.95" />

    <!-- Body Torso / Outfit -->
    <path d="M190 380 L310 380 L350 580 L150 580 Z" fill="url(#outfitGrad_${char.id})" />
    <!-- Neck -->
    <path d="M225 320 L275 320 L280 390 L220 390 Z" fill="url(#skin)" />
    <!-- Collar / Outfit Accent -->
    <path d="M200 380 L250 440 L300 380 L320 400 L250 470 L180 400 Z" fill="${accent}" filter="url(#softGlow_${char.id})" />

    <!-- Head / Face -->
    <path d="M185 210 Q250 160 315 210 Q325 310 250 350 Q175 310 185 210 Z" fill="url(#skin)" />

    <!-- Anime Eyes -->
    <g>
      <!-- Left Eye -->
      <ellipse cx="215" cy="245" rx="15" ry="18" fill="#ffffff" />
      <ellipse cx="215" cy="246" rx="10" ry="14" fill="${eye}" />
      <ellipse cx="215" cy="247" rx="6" ry="9" fill="#09090b" />
      <circle cx="212" cy="240" r="4" fill="#ffffff" />
      <circle cx="218" cy="251" r="2" fill="#ffffff" />
      <path d="M198 232 Q215 224 232 234" stroke="#09090b" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M202 222 Q215 216 230 224" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round" />

      <!-- Right Eye -->
      <ellipse cx="285" cy="245" rx="15" ry="18" fill="#ffffff" />
      <ellipse cx="285" cy="246" rx="10" ry="14" fill="${eye}" />
      <ellipse cx="285" cy="247" rx="6" ry="9" fill="#09090b" />
      <circle cx="282" cy="240" r="4" fill="#ffffff" />
      <circle cx="288" cy="251" r="2" fill="#ffffff" />
      <path d="M268 234 Q285 224 302 232" stroke="#09090b" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M270 224 Q285 216 298 222" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </g>

    <!-- Blush -->
    <ellipse cx="195" cy="265" rx="12" ry="6" fill="#f43f5e" opacity="0.35" />
    <ellipse cx="305" cy="265" rx="12" ry="6" fill="#f43f5e" opacity="0.35" />

    <!-- Cute Smile -->
    <path d="M242 285 Q250 292 258 285" stroke="#be123c" stroke-width="2.2" fill="none" stroke-linecap="round" />

    <!-- Front Bangs & Styled Hair -->
    <g fill="url(#hairGrad_${char.id})">
      <path d="M170 190 Q250 120 330 190 Q345 260 325 320 Q305 230 290 205 Q275 240 260 210 Q240 250 225 210 Q205 240 185 215 Q165 260 170 190 Z" />
      <!-- Hair Highlights -->
      <path d="M200 160 Q250 145 300 160" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round" />
    </g>

    <!-- Outfit Badge Ribbon -->
    <g transform="translate(250, 480)">
      <rect x="-60" y="-12" width="120" height="24" rx="12" fill="rgba(15, 23, 42, 0.85)" stroke="${accent}" stroke-width="1.5" />
      <text x="0" y="4" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" letter-spacing="0.5">
        ${outfit.name.toUpperCase()}
      </text>
    </g>
  </svg>`;
}

// Convert SVG string to data URL
export function getCharacterSvgDataUrl(char: AnimeCharacter, outfitId?: string): string {
  const svg = generateCharacterSvg(char, outfitId);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

