// Life OS — Selectable Background Wallpaper Collections

export interface WallpaperItem {
  id: string;
  name: string;
  category: 'anime' | 'fantasy' | 'cyberpunk' | 'nature' | 'minimal' | 'custom';
  description: string;
  url: string;
  previewUrl: string;
  defaultOpacity: number;
  defaultBlur: number;
}

export const WALLPAPER_COLLECTIONS: WallpaperItem[] = [
  {
    id: 'sakura-night',
    name: 'Anime Cherry Blossom Night',
    category: 'anime',
    description: 'Moonlit midnight purple sky with falling glowing pink cherry blossoms & pagoda silhouette.',
    url: '/wallpapers/sakura-night.svg',
    previewUrl: '/wallpapers/sakura-night.svg',
    defaultOpacity: 0.35,
    defaultBlur: 0,
  },
  {
    id: 'purple-moonlight',
    name: 'Purple Fantasy Moonlight',
    category: 'fantasy',
    description: 'Gigantic glowing supermoon casting radiant beams across tranquil reflective mountain waters.',
    url: '/wallpapers/purple-moonlight.svg',
    previewUrl: '/wallpapers/purple-moonlight.svg',
    defaultOpacity: 0.35,
    defaultBlur: 0,
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk Neon City',
    category: 'cyberpunk',
    description: 'Futuristic anime metropolis skyline with glowing neon cyan and magenta skyscrapers.',
    url: '/wallpapers/cyberpunk-city.svg',
    previewUrl: '/wallpapers/cyberpunk-city.svg',
    defaultOpacity: 0.35,
    defaultBlur: 0,
  },
  {
    id: 'summer-sunset',
    name: 'Japanese Summer Sunset',
    category: 'nature',
    description: 'Golden hour twilight with Mount Fuji and traditional crimson Torii gate silhouette.',
    url: '/wallpapers/summer-sunset.svg',
    previewUrl: '/wallpapers/summer-sunset.svg',
    defaultOpacity: 0.35,
    defaultBlur: 0,
  },
  {
    id: 'starry-galaxy',
    name: 'Starry Galaxy',
    category: 'fantasy',
    description: 'Deep cosmic nebula with swirling violet-cyan celestial dust and radiant star clusters.',
    url: '/wallpapers/starry-galaxy.svg',
    previewUrl: '/wallpapers/starry-galaxy.svg',
    defaultOpacity: 0.35,
    defaultBlur: 0,
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark Purple',
    category: 'minimal',
    description: 'Sleek dark violet obsidian vignette with subtle ambient glowing hexagonal mesh.',
    url: '/wallpapers/minimal-dark.svg',
    previewUrl: '/wallpapers/minimal-dark.svg',
    defaultOpacity: 0.45,
    defaultBlur: 0,
  },
];

