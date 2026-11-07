import React, { useState, useRef } from 'react';
import {
  User,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Sliders,
  Upload,
  RotateCcw,
  Check,
  Heart,
  Search,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { WALLPAPER_COLLECTIONS } from '../../data/wallpapers';
import {
  ALL_CHARACTERS,
  ANIME_FRANCHISES,
  getCharacterById,
  getCharacterSvgDataUrl,
} from '../../data/animeCharacters';
import type { ThemePreset, PersonalizationSettings, AppearanceSettings } from '../../types';

interface PersonalizationCenterProps {
  onSuccess?: () => void;
}

export default function PersonalizationCenter({ onSuccess }: PersonalizationCenterProps) {
  const { user } = useAuth();
  const { settings, updateSettings, updateAppearance } = useApp();

  // Active sub-section
  const [subSection, setSubSection] = useState<
    'profile' | 'wallpaper' | 'character' | 'themes' | 'dashboard'
  >('wallpaper');

  // Local draft states for Live Preview before saving
  const [displayName, setDisplayName] = useState(
    settings.displayName || (user?.email ? user.email.split('@')[0] : 'Sastivelan')
  );
  const [preferredGreeting, setPreferredGreeting] = useState(
    settings.personalization?.preferredGreeting || "Good Morning! ♡ Let's make today productive together!"
  );

  // Appearance & Wallpaper drafts
  const [selectedWallpaperId, setSelectedWallpaperId] = useState<string>(
    settings.appearance?.wallpaperId || 'sakura-night'
  );
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>(
    settings.appearance?.backgroundImageUrl || ''
  );
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(
    settings.appearance?.backgroundOverlayOpacity ?? 0.28
  );
  const [wallpaperBlur, setWallpaperBlur] = useState<number>(
    settings.appearance?.wallpaperBlur ?? 0
  );
  const [wallpaperScaling, setWallpaperScaling] = useState<'cover' | 'contain' | 'auto'>(
    settings.appearance?.wallpaperScaling || 'cover'
  );
  const [wallpaperPosition, setWallpaperPosition] = useState<'center' | 'top' | 'bottom'>(
    settings.appearance?.wallpaperPosition || 'center'
  );

  // Theme drafts
  const [themePreset, setThemePreset] = useState<ThemePreset>(
    settings.appearance?.themePreset || 'purple-fantasy'
  );
  const [accentColor, setAccentColor] = useState<string>(
    settings.appearance?.accentColor || '#c084fc'
  );
  const [secondaryAccent, setSecondaryAccent] = useState<string>(
    settings.appearance?.secondaryAccent || '#f472b6'
  );
  const [cardTransparency, setCardTransparency] = useState<number>(
    settings.appearance?.cardTransparency ?? 0.32
  );
  const [glassBlur, setGlassBlur] = useState<number>(
    settings.appearance?.glassBlur ?? 16
  );
  const [glowIntensity, setGlowIntensity] = useState<number>(
    settings.appearance?.glowIntensity ?? 80
  );

  // Character drafts
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    settings.personalization?.activeCharacterId || 'nami'
  );
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(
    settings.personalization?.activeOutfitId || 'signature'
  );
  const [customCharUrl, setCustomCharUrl] = useState<string>(
    settings.personalization?.customCharacterImageUrl || ''
  );
  const [favouriteIds, setFavouriteIds] = useState<string[]>(
    settings.personalization?.favouriteCharacterIds || ['nami', 'nico-robin', 'rias-gremory', 'yor-forger']
  );
  const [sidebarDeco, setSidebarDeco] = useState<boolean>(
    settings.personalization?.sidebarDecorationEnabled !== false
  );

  // Character search & filter
  const [charSearch, setCharSearch] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('All');
  const [onlyFavourites, setOnlyFavourites] = useState(false);

  // Dashboard toggles draft
  const [dashboardWidgets, setDashboardWidgets] = useState(
    settings.personalization?.dashboardWidgets || {
      showMissions: true,
      showProgressRing: true,
      showStreakLevel: true,
      showQuickDate: true,
      showMilestone: true,
      showCompanionShowcase: true,
      showWardrobe: true,
      showQuote: true,
      showCharacterIllustration: true,
      enableAnimations: true,
      density: 'comfortable' as const,
    }
  );

  // Save / Notification states
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const charFileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered characters
  const filteredCharacters = ALL_CHARACTERS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(charSearch.toLowerCase()) ||
      c.series.toLowerCase().includes(charSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(charSearch.toLowerCase());
    const matchesFranchise =
      selectedFranchise === 'All' || c.series.toLowerCase() === selectedFranchise.toLowerCase();
    const matchesFav = !onlyFavourites || favouriteIds.includes(c.id);
    return matchesSearch && matchesFranchise && matchesFav;
  });

  const activeChar = getCharacterById(selectedCharacterId);

  // Handle custom wallpaper file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomWallpaperUrl(dataUrl);
        setSelectedWallpaperId('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle custom character upload
  const handleCharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomCharUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFavourite = (id: string) => {
    setFavouriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Save all settings to AppContext & persistent storage
  const handleSaveAll = async () => {
    const updatedAppearance: AppearanceSettings = {
      ...settings.appearance,
      themePreset,
      accentColor,
      secondaryAccent,
      glowIntensity,
      glassBlur,
      cardTransparency,
      wallpaperId: selectedWallpaperId,
      backgroundImageUrl:
        selectedWallpaperId === 'custom'
          ? customWallpaperUrl
          : `/wallpapers/${selectedWallpaperId}.svg`,
      backgroundOverlayOpacity: wallpaperOpacity,
      wallpaperBlur,
      wallpaperScaling,
      wallpaperPosition,
    };

    const updatedPersonalization: PersonalizationSettings = {
      activeCharacterId: selectedCharacterId,
      activeOutfitId: selectedOutfitId,
      customCharacterImageUrl: customCharUrl,
      favouriteCharacterIds: favouriteIds,
      sidebarDecorationEnabled: sidebarDeco,
      preferredGreeting,
      dashboardWidgets,
    };

    await updateSettings({
      displayName: displayName.trim(),
      appearance: updatedAppearance,
      personalization: updatedPersonalization,
    });

    await updateAppearance(updatedAppearance);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onSuccess) onSuccess();
  };

  // Reset to default settings
  const handleResetDefaults = async () => {
    setSelectedWallpaperId('sakura-night');
    setCustomWallpaperUrl('');
    setWallpaperOpacity(0.28);
    setWallpaperBlur(0);
    setThemePreset('purple-fantasy');
    setAccentColor('#c084fc');
    setSecondaryAccent('#f472b6');
    setCardTransparency(0.32);
    setGlassBlur(16);
    setSelectedCharacterId('nami');
    setSelectedOutfitId('signature');
    setCustomCharUrl('');
    setSidebarDeco(true);
    setPreferredGreeting("Good Morning! ♡ Let's make today productive together!");
    setDashboardWidgets({
      showMissions: true,
      showProgressRing: true,
      showStreakLevel: true,
      showQuickDate: true,
      showMilestone: true,
      showCompanionShowcase: true,
      showWardrobe: true,
      showQuote: true,
      showCharacterIllustration: true,
      enableAnimations: true,
      density: 'comfortable',
    });
    setShowResetConfirm(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.15))',
          borderRadius: '20px',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} color="#c084fc" /> Personalization Center
          </h2>
          <p style={{ margin: '4px 0 0', color: '#c084fc', fontSize: '0.85rem' }}>
            Customize your anime universe: wallpapers, characters, themes, neon glow & dashboard experience.
          </p>
        </div>

        {/* Active Companion Card with Change Button matching user request */}
        <div
          style={{
            background: 'rgba(15, 10, 30, 0.75)',
            backdropFilter: 'blur(12px)',
            borderRadius: '14px',
            padding: '0.65rem 1.15rem',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: activeChar.accentColor, fontWeight: 700 }}>
              {activeChar.series}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              {activeChar.name}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSubSection('character')}
            style={{
              color: '#c084fc',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              background: 'rgba(192, 132, 252, 0.12)',
              cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowResetConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSaveAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
              padding: '0.55rem 1.25rem',
              fontWeight: 700,
            }}
          >
            <Save size={15} /> Save Changes
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            color: '#10b981',
            fontWeight: 700,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} /> Settings successfully saved and applied!
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(168, 85, 247, 0.18)',
          paddingBottom: '0.75rem',
        }}
      >
        {[
          { id: 'wallpaper', label: 'Wallpapers & Background', icon: <ImageIcon size={16} /> },
          { id: 'character', label: 'Anime Character & Wardrobe', icon: <Sparkles size={16} /> },
          { id: 'themes', label: 'Theme & Neon Colors', icon: <Palette size={16} /> },
          { id: 'profile', label: 'Profile & Greetings', icon: <User size={16} /> },
          { id: 'dashboard', label: 'Dashboard & Widgets', icon: <Sliders size={16} /> },
        ].map((tab) => {
          const active = subSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubSection(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                border: active ? '1px solid #c084fc' : '1px solid transparent',
                background: active ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: active ? '#ffffff' : '#94a3b8',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── SECTION: WALLPAPERS ────────────────────────────────────────────── */}
      {subSection === 'wallpaper' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Built-in Wallpaper Gallery */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Built-in Anime Wallpaper Collections
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              Select an atmospheric background or upload your own high-resolution artwork.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {WALLPAPER_COLLECTIONS.map((wp) => {
                const isSelected = selectedWallpaperId === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      setSelectedWallpaperId(wp.id);
                      setCustomWallpaperUrl('');
                    }}
                    style={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: isSelected
                        ? '2px solid #c084fc'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected
                        ? '0 0 20px rgba(192, 132, 252, 0.45)'
                        : 'none',
                      cursor: 'pointer',
                      background: 'rgba(15, 10, 30, 0.7)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        height: '140px',
                        backgroundImage: `url("${wp.url}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#c084fc',
                            color: '#ffffff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                          }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '0.85rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                        {wp.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                        {wp.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Wallpaper Upload Card */}
          <div
            style={{
              background: 'rgba(18, 10, 40, 0.65)',
              border: selectedWallpaperId === 'custom' ? '2px solid #c084fc' : '1px dashed rgba(168, 85, 247, 0.35)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 700 }}>
                  Upload Custom Wallpaper Image
                </h4>
                <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Upload any JPG, PNG, WEBP or SVG image from your device.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} /> Choose File
                </button>

                {customWallpaperUrl && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setCustomWallpaperUrl('');
                      setSelectedWallpaperId('sakura-night');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
            </div>

            {customWallpaperUrl && (
              <div
                style={{
                  marginTop: '1rem',
                  height: '120px',
                  borderRadius: '12px',
                  backgroundImage: `url("${customWallpaperUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(192, 132, 252, 0.4)',
                }}
              />
            )}
          </div>

          {/* Wallpaper Tuning Sliders */}
          <div
            style={{
              background: 'rgba(18, 10, 40, 0.65)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem', color: '#f8fafc', fontSize: '1rem', fontWeight: 700 }}>
              Wallpaper Display & Opacity Tuning
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dark Overlay Opacity</span>
                  <span>{Math.round(wallpaperOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={wallpaperOpacity}
                  onChange={(e) => setWallpaperOpacity(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Wallpaper Blur</span>
                  <span>{wallpaperBlur}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={wallpaperBlur}
                  onChange={(e) => setWallpaperBlur(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  Scaling Mode
                </label>
                <select
                  className="input input-sm"
                  value={wallpaperScaling}
                  onChange={(e) => setWallpaperScaling(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="cover">Cover (Fill Screen)</option>
                  <option value="contain">Contain (Fit Aspect)</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  Positioning
                </label>
                <select
                  className="input input-sm"
                  value={wallpaperPosition}
                  onChange={(e) => setWallpaperPosition(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: ANIME CHARACTERS ────────────────────────────────────────── */}
      {subSection === 'character' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Companion Showcase Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(28, 14, 56, 0.8), rgba(12, 6, 28, 0.9))',
              borderRadius: '20px',
              border: `2px solid ${activeChar.accentColor}`,
              padding: '1.5rem',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              boxShadow: `0 0 30px ${activeChar.accentColor}33`,
            }}
          >
            <div
              style={{
                width: '120px',
                height: '150px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${activeChar.accentColor}`,
                flexShrink: 0,
              }}
            >
              <img
                src={customCharUrl || getCharacterSvgDataUrl(activeChar, selectedOutfitId)}
                alt={activeChar.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: activeChar.accentColor,
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {activeChar.series}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{activeChar.role}</span>
              </div>

              <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
                {activeChar.name}
              </h3>

              <p style={{ margin: '6px 0 10px', fontSize: '0.84rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                "{activeChar.quote}"
              </p>

              {/* Wardrobe Selector */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                  👗 Choose Character Wardrobe Style:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {activeChar.outfits.map((outfit) => {
                    const isEquipped = selectedOutfitId === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        onClick={() => setSelectedOutfitId(outfit.id)}
                        style={{
                          background: isEquipped ? activeChar.accentColor : 'rgba(255,255,255,0.06)',
                          color: isEquipped ? '#ffffff' : '#cbd5e1',
                          border: isEquipped ? `1px solid ${activeChar.accentColor}` : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: isEquipped ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {outfit.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom Character Upload */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px dashed rgba(192, 132, 252, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600 }}>Custom Character Image</span>
              <input
                type="file"
                ref={charFileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCharUpload}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => charFileInputRef.current?.click()}
                style={{ fontSize: '0.75rem' }}
              >
                <Upload size={13} /> Upload Image
              </button>
              {customCharUrl && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCustomCharUrl('')}
                  style={{ fontSize: '0.7rem', color: '#f43f5e' }}
                >
                  Clear Custom
                </button>
              )}
            </div>
          </div>

          {/* Search & Franchise Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search characters by name, series, or role..."
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                className="input input-sm"
                style={{ paddingLeft: '32px', width: '100%' }}
              />
            </div>

            <button
              type="button"
              className={`btn btn-sm ${onlyFavourites ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setOnlyFavourites(!onlyFavourites)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Heart size={14} fill={onlyFavourites ? 'currentColor' : 'none'} /> Favourites Only
            </button>
          </div>

          {/* Franchise Badges */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {ANIME_FRANCHISES.map((franchise) => {
              const isSelected = selectedFranchise === franchise;
              return (
                <button
                  key={franchise}
                  onClick={() => setSelectedFranchise(franchise)}
                  style={{
                    background: isSelected ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    border: isSelected ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '999px',
                    padding: '3px 12px',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {franchise}
                </button>
              );
            })}
          </div>

          {/* 100 Characters Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {filteredCharacters.map((char) => {
              const isSelected = selectedCharacterId === char.id;
              const isFav = favouriteIds.includes(char.id);
              const previewSvg = getCharacterSvgDataUrl(char, 'signature');

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedCharacterId(char.id);
                    setSelectedOutfitId('signature');
                  }}
                  style={{
                    borderRadius: '16px',
                    background: isSelected
                      ? 'linear-gradient(180deg, rgba(35, 15, 65, 0.9), rgba(15, 8, 30, 0.95))'
                      : 'rgba(15, 10, 30, 0.65)',
                    border: isSelected
                      ? `2px solid ${char.accentColor}`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isSelected
                      ? `0 0 18px ${char.accentColor}55`
                      : 'none',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Favourite Heart */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavourite(char.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isFav ? '#ec4899' : '#94a3b8',
                      zIndex: 2,
                    }}
                  >
                    <Heart size={14} fill={isFav ? '#ec4899' : 'none'} />
                  </button>

                  <div
                    style={{
                      height: '130px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                      marginBottom: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={previewSvg}
                      alt={char.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ fontSize: '0.68rem', color: char.accentColor, fontWeight: 700 }}>
                    {char.series}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', margin: '1px 0' }}>
                    {char.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {char.role}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Decoration Switch */}
          <div
            style={{
              background: 'rgba(18, 10, 40, 0.65)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                Show Anime Companion Banner in Sidebar Footer
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Displays "You're doing amazing! ♡" with your companion's encouragement.
              </div>
            </div>
            <input
              type="checkbox"
              checked={sidebarDeco}
              onChange={(e) => setSidebarDeco(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#c084fc', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}

      {/* ── SECTION: THEMES & NEON COLORS ────────────────────────────────────── */}
      {subSection === 'themes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Selectable Color Themes
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              Choose a curated anime fantasy theme preset or customize your primary accent.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {[
                { id: 'purple-fantasy', name: 'Purple Fantasy', primary: '#c084fc', secondary: '#ec4899', bg: '#070314' },
                { id: 'pink-sakura', name: 'Pink Sakura', primary: '#f472b6', secondary: '#fb7185', bg: '#0e0414' },
                { id: 'midnight-blue', name: 'Midnight Blue', primary: '#38bdf8', secondary: '#818cf8', bg: '#020617' },
                { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', primary: '#f43f5e', secondary: '#06b6d4', bg: '#060112' },
                { id: 'lavender-dream', name: 'Lavender Dream', primary: '#a78bfa', secondary: '#6366f1', bg: '#0a0718' },
                { id: 'cyan-galaxy', name: 'Cyan Galaxy', primary: '#22d3ee', secondary: '#3b82f6', bg: '#030816' },
              ].map((theme) => {
                const isSelected = themePreset === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setThemePreset(theme.id as any);
                      setAccentColor(theme.primary);
                      setSecondaryAccent(theme.secondary);
                    }}
                    style={{
                      background: theme.bg,
                      borderRadius: '14px',
                      padding: '1rem',
                      border: isSelected ? `2px solid ${theme.primary}` : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected ? `0 0 16px ${theme.primary}55` : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: theme.primary }} />
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: theme.secondary }} />
                    </div>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>{theme.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Glass Sliders */}
          <div
            style={{
              background: 'rgba(18, 10, 40, 0.65)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem', color: '#f8fafc', fontSize: '1rem', fontWeight: 700 }}>
              Fine-Tuning Color Accents & Glass Blur
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Primary Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: '40px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="input input-sm"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Secondary Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={secondaryAccent}
                    onChange={(e) => setSecondaryAccent(e.target.value)}
                    style={{ width: '40px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={secondaryAccent}
                    onChange={(e) => setSecondaryAccent(e.target.value)}
                    className="input input-sm"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Glassmorphism Blur</span>
                  <span>{glassBlur}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={glassBlur}
                  onChange={(e) => setGlassBlur(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Card Transparency</span>
                  <span>{Math.round(cardTransparency * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={cardTransparency}
                  onChange={(e) => setCardTransparency(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Neon Glow Intensity</span>
                  <span>{glowIntensity}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={glowIntensity}
                  onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: PROFILE & GREETING ──────────────────────────────────────── */}
      {subSection === 'profile' && (
        <div
          style={{
            background: 'rgba(18, 10, 40, 0.65)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div>
            <label style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name (e.g. Sastivelan)"
              className="input"
              style={{ maxWidth: '420px', width: '100%' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              This name will be used across dynamic greetings, top navigation, and companion speech bubbles.
            </p>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Preferred Daily Companion Greeting
            </label>
            <input
              type="text"
              value={preferredGreeting}
              onChange={(e) => setPreferredGreeting(e.target.value)}
              placeholder="e.g. Good Morning! ♡ Let's make today productive together!"
              className="input"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* ── SECTION: DASHBOARD CUSTOMIZATION ──────────────────────────────────── */}
      {subSection === 'dashboard' && (
        <div
          style={{
            background: 'rgba(18, 10, 40, 0.65)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <h4 style={{ margin: '0 0 1rem', color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700 }}>
            Dashboard Widget Toggles
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {[
              { key: 'showMissions', label: 'Today Missions Timeline' },
              { key: 'showProgressRing', label: 'Circular Progress Ring' },
              { key: 'showStreakLevel', label: '7-Day Streak & Productive Level' },
              { key: 'showQuickDate', label: 'Quick Date Selector' },
              { key: 'showMilestone', label: 'Next Milestone & Achievements' },
              { key: 'showCompanionShowcase', label: 'Change Companion Carousel' },
              { key: 'showWardrobe', label: 'Wardrobe & Outfits Picker' },
              { key: 'showCharacterIllustration', label: 'Anime Character Illustration' },
              { key: 'showQuote', label: 'Floating Motivational Quote' },
              { key: 'enableAnimations', label: 'Interactive Glowing Animations' },
            ].map((widget) => {
              const val = (dashboardWidgets as any)[widget.key] ?? true;
              return (
                <label
                  key={widget.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{widget.label}</span>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setDashboardWidgets({
                        ...dashboardWidgets,
                        [widget.key]: e.target.checked,
                      })
                    }
                    style={{ width: '18px', height: '18px', accentColor: '#c084fc' }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#0f0a22',
              border: '1px solid #f43f5e',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={36} color="#f43f5e" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontWeight: 800 }}>Reset to Defaults?</h3>
            <p style={{ margin: '0 0 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              This will restore the original Anime Cherry Blossom wallpaper, Nami companion, and Purple Fantasy theme.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetDefaults}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
