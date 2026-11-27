import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Sliders,
  Palette,
  Bot,
  FileClock,
  Trash2,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Upload,
  Download,
  KeyRound,
  LogOut,
  RefreshCw,
  CheckCircle2,
  ImageIcon,
  Code2,
  MessageSquare,
  Briefcase,
  Heart,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { formatSafeErrorMessage } from '../utils/errorUtils';
import { checkAiConfig, type AiStatusResult } from '../services/aiService';
import type {
  CustomLifeArea,
  AppearanceSettings,
  ThemePreset,
  AiSettings
} from '../types';

export type SettingsTab =
  | 'areas'
  | 'appearance'
  | 'ai'
  | 'reports'
  | 'account'
  | 'recycle-bin'
  | 'data';

interface SettingsPageProps {
  initialTab?: SettingsTab;
  hideHeader?: boolean;
  hideTabs?: boolean;
}

const THEME_PRESETS: { id: ThemePreset; name: string; desc: string; previewBg: string; border: string }[] = [
  { id: 'navy-purple', name: 'Navy & Purple', desc: 'Life OS Classic deep navy and radiant purple identity', previewBg: '#0f172a', border: '#6366f1' },
  { id: 'dark-slate', name: 'Dark Slate', desc: 'Minimalist slate gray with crisp indigo contrast', previewBg: '#1e293b', border: '#818cf8' },
  { id: 'midnight-oled', name: 'Midnight OLED', desc: 'True pitch black for maximum battery and OLED contrast', previewBg: '#000000', border: '#38bdf8' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Vibrant neon pink and cyan high-contrast dark theme', previewBg: '#0d0221', border: '#ec4899' },
  { id: 'clean-light', name: 'Clean Light', desc: 'Modern bright productivity theme with slate accents', previewBg: '#f8fafc', border: '#64748b' },
];

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80';

function makeAvatarSvg(bg1: string, bg2: string, glyph: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><text x="60" y="72" text-anchor="middle" font-size="48">${glyph}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CURATED_AVATARS: { id: string; label: string; url: string }[] = [
  { id: 'cosmic', label: 'Cosmic', url: makeAvatarSvg('#6366f1', '#a855f7', '⚡') },
  { id: 'cyber', label: 'Cyber', url: makeAvatarSvg('#06b6d4', '#3b82f6', '🚀') },
  { id: 'emerald', label: 'Focus', url: makeAvatarSvg('#10b981', '#059669', '🌿') },
  { id: 'phoenix', label: 'Solar', url: makeAvatarSvg('#f59e0b', '#ef4444', '🔥') },
  { id: 'sakura', label: 'Sakura', url: makeAvatarSvg('#ec4899', '#8b5cf6', '✨') },
  { id: 'midnight', label: 'Night', url: makeAvatarSvg('#1e293b', '#4f46e5', '🌙') },
];

async function resizeAvatarToDataUrl(file: File, maxSize = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        const scale = Math.max(maxSize / img.width, maxSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (maxSize - w) / 2;
        const y = (maxSize - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ProfileIdentityCard({
  displayName,
  avatarUrl,
  onSave,
}: {
  displayName?: string;
  avatarUrl?: string;
  onSave: (updates: { displayName: string; avatarUrl?: string; profileAvatar?: string }) => Promise<void>;
}) {
  const [nameInput, setNameInput] = useState(displayName || 'Sastivelan');
  const [avatarInput, setAvatarInput] = useState(avatarUrl || '');
  const [avatarErr, setAvatarErr] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState<{ url: string; label: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameInput(displayName || 'Sastivelan');
  }, [displayName]);

  useEffect(() => {
    setAvatarInput(avatarUrl || '');
  }, [avatarUrl]);

  const previewAvatar = avatarInput || DEFAULT_AVATAR_URL;
  const previewName = nameInput.trim() || 'Sastivelan';
  const hour = new Date().getHours();
  const previewGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarErr('Please select a valid image file.');
      return;
    }
    setAvatarErr('');
    try {
      const dataUrl = await resizeAvatarToDataUrl(file, 160);
      setPendingAvatar({ url: dataUrl, label: file.name || 'Custom Avatar' });
    } catch (err: unknown) {
      setAvatarErr(formatSafeErrorMessage(err, 'Failed to process avatar image.'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSelectPresetAvatar = (url: string, label: string) => {
    setPendingAvatar({ url, label });
  };

  const confirmAvatarChange = async () => {
    if (!pendingAvatar) return;
    setAvatarInput(pendingAvatar.url);
    await onSave({ displayName: previewName, avatarUrl: pendingAvatar.url, profileAvatar: pendingAvatar.url });
    setPendingAvatar(null);
  };

  const handleResetProfile = async () => {
    setNameInput('Sastivelan');
    setAvatarInput('');
    setAvatarErr('');
    await onSave({ displayName: 'Sastivelan', avatarUrl: undefined, profileAvatar: undefined });
  };

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={17} color="#a855f7" /> Profile &amp; Identity
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Customize your Home greeting name and avatar across Sidebar, TopBar, and Dashboard.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetProfile}>
          <RotateCcw size={13} /> Reset to Default
        </button>
      </div>

      {/* Live Home Greeting Mini-Preview */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem',
          padding: '0.85rem 1rem',
          borderRadius: '14px',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border)',
          marginBottom: '1.15rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            padding: '2.5px',
            background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
            flexShrink: 0,
          }}
        >
          <img
            src={previewAvatar}
            alt={previewName}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-surface)' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Live Greeting Preview
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {previewGreeting}, {previewName}!
          </div>
          <div style={{ fontSize: '0.76rem', color: '#a855f7', fontWeight: 500 }}>
            Let&apos;s make today productive and meaningful. ✨
          </div>
        </div>
      </div>

      {/* Display Name & Custom Avatar Upload */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Display Name
          </label>
          <input
            className="input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Sastivelan"
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSave({ displayName: previewName, avatarUrl: avatarInput || undefined, profileAvatar: avatarInput || undefined })}
        >
          Save Profile
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileRef.current?.click()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Upload size={14} /> Upload Avatar
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUploadAvatar}
        />
      </div>

      {avatarErr && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
          {avatarErr}
        </p>
      )}

      {/* Curated Avatar Presets */}
      <div>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Quick Avatar Presets
        </span>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {CURATED_AVATARS.map((av) => {
            const isSelected = avatarInput === av.url;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelectPresetAvatar(av.url, av.label)}
                title={av.label}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  padding: '2px',
                  border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: 'var(--bg-surface-2)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxShadow: isSelected ? '0 0 12px var(--accent-glow)' : 'none',
                }}
              >
                <img src={av.url} alt={av.label} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar Change Permission Confirmation Modal */}
      {pendingAvatar && (
        <Modal
          isOpen={true}
          onClose={() => setPendingAvatar(null)}
          title="Confirm Avatar Change"
          maxWidth="400px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                padding: '3px',
                background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
              }}
            >
              <img
                src={pendingAvatar.url}
                alt={pendingAvatar.label}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Allow Life OS to update your profile avatar to <strong>{pendingAvatar.label}</strong> across the Home header, Sidebar, and TopBar?
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPendingAvatar(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmAvatarChange}>
                Confirm Change
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const ACCENT_COLORS = [
  { label: 'Indigo', value: '#818cf8' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose Pink', value: '#ec4899' },
  { label: 'Amber', value: '#f59e0b' },
];

function renderLifeAreaIcon(iconName: string, color: string) {
  const iconProps = { size: 17, color };
  let node: React.ReactNode;
  switch (iconName) {
    case 'Code2':
      node = <Code2 {...iconProps} />;
      break;
    case 'MessageSquare':
      node = <MessageSquare {...iconProps} />;
      break;
    case 'Briefcase':
      node = <Briefcase {...iconProps} />;
      break;
    case 'Palette':
      node = <Palette {...iconProps} />;
      break;
    case 'Heart':
      node = <Heart {...iconProps} />;
      break;
    case 'Target':
      node = <Target {...iconProps} />;
      break;
    default:
      node = iconName && iconName.length <= 4 ? (
        <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{iconName}</span>
      ) : (
        <Target {...iconProps} />
      );
  }
  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: `${color}1f`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {node}
    </div>
  );
}

export default function SettingsPage({ initialTab, hideHeader = false, hideTabs = false }: SettingsPageProps = {}) {
  const {
    settings,
    updateSettings,
    customLifeAreas,
    updateLifeAreas,
    restoreDefaultLifeAreas,
    updateAppearance,
    exportData,
    importData,
    resetData,
    syncStatus,
    tasks,
    deletedTasks,
    restoreTask,
    permanentDeleteTask,
    emptyRecycleBin,
    uploadFile,
    milestones,
  } = useApp();

  const { user, isConfigured: isSupabaseConfigured, signOut, resetPassword, isGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'areas');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const showSaveSuccess = (msg = 'Changes saved successfully') => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(null), 2500);
  };

  return (
    <div className="page-container pb-safe">
      {/* Page Header */}
      {!hideHeader && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            ⚙️ <span className="gradient-text">Life OS Control Center</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Customize life areas, appearance, secure AI execution, and data management.
          </p>
        </div>
      )}

      {/* Global save confirmation toast */}
      {saveBanner && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '0.65rem 1.1rem',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      {!hideTabs && (
        <div
          className="filter-scroll"
          style={{
            display: 'flex',
            gap: '0.4rem',
            marginBottom: '1.5rem',
            paddingBottom: '0.3rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {[
            { id: 'areas', label: 'Life-Planning Areas', icon: <Sliders size={14} /> },
            { id: 'appearance', label: 'Appearance & Backgrounds', icon: <Palette size={14} /> },
            { id: 'ai', label: 'AI Providers & Execution', icon: <Bot size={14} /> },
            { id: 'reports', label: 'Reports & History', icon: <FileClock size={14} /> },
            { id: 'account', label: 'Profile & Account', icon: <User size={14} /> },
            { id: 'recycle-bin', label: `Recycle Bin (${deletedTasks.length})`, icon: <Trash2 size={14} /> },
            { id: 'data', label: 'Data Management', icon: <Database size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              style={{
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'areas' && (
        <LifeAreasManager
          areas={customLifeAreas}
          tasks={tasks}
          onUpdate={async (newAreas) => {
            await updateLifeAreas(newAreas);
            showSaveSuccess('Life areas updated.');
          }}
          onRestoreDefaults={async () => {
            await restoreDefaultLifeAreas();
            showSaveSuccess('Restored default 5 life planning areas.');
          }}
        />
      )}

      {activeTab === 'appearance' && (
        <>
          <ProfileIdentityCard
            displayName={settings.displayName}
            avatarUrl={settings.avatarUrl || settings.profileAvatar}
            onSave={async (updates) => {
              await updateSettings(updates);
              showSaveSuccess('Profile & identity updated.');
            }}
          />
          <AppearanceManager
            settings={settings.appearance || {}}
            onSave={async (appr) => {
              await updateAppearance(appr);
              showSaveSuccess('Appearance settings saved.');
            }}
            onUploadBackground={uploadFile}
          />
        </>
      )}

      {activeTab === 'ai' && (
        <AiProvidersSettings
          settings={settings.aiSettings || {}}
          onSave={async (aiSet) => {
            await updateSettings({ aiSettings: aiSet });
            showSaveSuccess('AI provider preferences saved.');
          }}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsAndHistorySection
          tasks={tasks}
          milestones={milestones}
        />
      )}

      {activeTab === 'account' && (
        <AccountAndProfileSection
          displayName={settings.displayName}
          user={user}
          isGuest={isGuest}
          syncStatus={syncStatus}
          isSupabaseConfigured={isSupabaseConfigured}
          onSaveDisplayName={async (name) => {
            await updateSettings({ displayName: name });
            showSaveSuccess('Display name saved.');
          }}
          onPasswordReset={resetPassword}
          onSignOut={signOut}
        />
      )}

      {activeTab === 'recycle-bin' && (
        <RecycleBinEmbeddedSection
          deletedTasks={deletedTasks}
          onRestore={restoreTask}
          onPermanentDelete={permanentDeleteTask}
          onEmpty={emptyRecycleBin}
          onSuccess={showSaveSuccess}
        />
      )}

      {activeTab === 'data' && (
        <DataManagementSection
          onExport={exportData}
          onImport={importData}
          onReset={resetData}
          onSuccess={showSaveSuccess}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIFE-PLANNING AREAS MANAGER (Section 4)
// ─────────────────────────────────────────────────────────────────────────────

function LifeAreasManager({
  areas,
  tasks,
  onUpdate,
  onRestoreDefaults,
}: {
  areas: CustomLifeArea[];
  tasks: any[];
  onUpdate: (areas: CustomLifeArea[]) => Promise<void>;
  onRestoreDefaults: () => Promise<void>;
}) {
  const [areaList, setAreaList] = useState<CustomLifeArea[]>(areas);
  const [editingArea, setEditingArea] = useState<CustomLifeArea | null>(null);
  const [confirmDisableArea, setConfirmDisableArea] = useState<CustomLifeArea | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newArea, setNewArea] = useState({ name: '', icon: '🎯', color: '#818cf8', description: '' });

  useEffect(() => {
    setAreaList(areas);
  }, [areas]);

  const moveArea = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= areaList.length) return;

    const next = [...areaList];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    const updated = next.map((a, i) => ({ ...a, orderIndex: i }));
    setAreaList(updated);
    await onUpdate(updated);
  };

  const handleToggleEnable = async (area: CustomLifeArea) => {
    const isDisabling = area.isEnabled !== false;
    const activeTasksInArea = tasks.filter((t) => t.lifeArea === area.id && t.status !== 'completed').length;

    if (isDisabling && activeTasksInArea > 0) {
      setConfirmDisableArea(area);
      return;
    }

    const updated = areaList.map((a) =>
      a.id === area.id ? { ...a, isEnabled: !isDisabling } : a
    );
    setAreaList(updated);
    await onUpdate(updated);
  };

  const confirmDisableProceed = async () => {
    if (!confirmDisableArea) return;
    const updated = areaList.map((a) =>
      a.id === confirmDisableArea.id ? { ...a, isEnabled: false } : a
    );
    setAreaList(updated);
    await onUpdate(updated);
    setConfirmDisableArea(null);
  };

  const handleSaveEdit = async () => {
    if (!editingArea || !editingArea.name.trim()) return;
    const updated = areaList.map((a) =>
      a.id === editingArea.id ? { ...editingArea, name: editingArea.name.trim() } : a
    );
    setAreaList(updated);
    await onUpdate(updated);
    setEditingArea(null);
  };

  const handleCreateArea = async () => {
    if (!newArea.name.trim()) return;
    const slug = newArea.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || 'custom-area';
    const id = `${slug}-${Date.now().toString(36)}`;

    const created: CustomLifeArea = {
      id,
      name: newArea.name.trim(),
      icon: newArea.icon.trim() || '🎯',
      color: newArea.color || '#818cf8',
      description: newArea.description.trim(),
      weight: 10,
      isEnabled: true,
      orderIndex: areaList.length,
      isCustom: true,
    };

    const updated = [...areaList, created];
    setAreaList(updated);
    await onUpdate(updated);
    setIsAddingNew(false);
    setNewArea({ name: '', icon: '🎯', color: '#818cf8', description: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              Customizable Life-Planning Areas
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Customize names, icons, descriptions, and toggle which areas appear in task filters and menus.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRestoreDefaults}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Restore standard 5 life planning areas"
            >
              <RotateCcw size={13} /> Restore Defaults
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddingNew(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Plus size={14} /> Add Area
            </button>
          </div>
        </div>

        {/* Areas List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {areaList.map((area, idx) => {
            const taskCount = tasks.filter((t) => t.lifeArea === area.id).length;
            const isEnabled = area.isEnabled !== false;

            return (
              <div
                key={area.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${area.color}`,
                  borderTop: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  opacity: isEnabled ? 1 : 0.65,
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: icon & details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 200 }}>
                  {renderLifeAreaIcon(area.icon, area.color)}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {area.name}
                      </strong>
                      <span className="badge" style={{ background: `${area.color}20`, color: area.color, fontSize: '0.68rem' }}>
                        {area.id}
                      </span>
                      {!isEnabled && (
                        <span className="badge status-rescheduled" style={{ fontSize: '0.68rem' }}>
                          Disabled
                        </span>
                      )}
                    </div>
                    {area.description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {area.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Center: tasks count */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <strong>{taskCount}</strong> task{taskCount === 1 ? '' : 's'} linked
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  {/* Reorder up */}
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => moveArea(idx, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  {/* Reorder down */}
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => moveArea(idx, 'down')}
                    disabled={idx === areaList.length - 1}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                  {/* Edit */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingArea(area)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  {/* Toggle enable / disable */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={() => handleToggleEnable(area)}
                    title={isEnabled ? 'Active — click to hide area' : 'Hidden — click to enable area'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px 4px 6px',
                      borderRadius: '999px',
                      border: isEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
                      background: isEnabled ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-surface-2)',
                      color: isEnabled ? '#10b981' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: isEnabled ? '#10b981' : '#94a3b8',
                        display: 'inline-block',
                      }}
                    />
                    <span>{isEnabled ? 'Active' : 'Hidden'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Area Modal */}
      {editingArea && (
        <Modal isOpen={true} onClose={() => setEditingArea(null)} title={`Edit Area: ${editingArea.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label>Area Display Name *</label>
              <input
                className="input"
                value={editingArea.name}
                onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
              />
            </div>
            <div className="form-grid-2">
              <div>
                <label>Emoji Icon</label>
                <input
                  className="input"
                  value={editingArea.icon}
                  onChange={(e) => setEditingArea({ ...editingArea, icon: e.target.value })}
                  placeholder="e.g. 💻"
                />
              </div>
              <div>
                <label>Color Accent</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    value={editingArea.color}
                    onChange={(e) => setEditingArea({ ...editingArea, color: e.target.value })}
                    style={{ width: '40px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    className="input"
                    value={editingArea.color}
                    onChange={(e) => setEditingArea({ ...editingArea, color: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
            <div>
              <label>Description</label>
              <textarea
                className="input"
                rows={2}
                value={editingArea.description || ''}
                onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })}
                placeholder="What focus belongs to this area?"
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Note: Changing the display name or color preserves all existing task relationships and history via its stable identifier.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingArea(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Area Modal */}
      {isAddingNew && (
        <Modal isOpen={true} onClose={() => setIsAddingNew(false)} title="Create New Life-Planning Area">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label>Area Name *</label>
              <input
                className="input"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                placeholder="e.g. Leadership & Mentorship"
                autoFocus
              />
            </div>
            <div className="form-grid-2">
              <div>
                <label>Emoji Icon</label>
                <input
                  className="input"
                  value={newArea.icon}
                  onChange={(e) => setNewArea({ ...newArea, icon: e.target.value })}
                  placeholder="e.g. 🌟"
                />
              </div>
              <div>
                <label>Color Accent</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    value={newArea.color}
                    onChange={(e) => setNewArea({ ...newArea, color: e.target.value })}
                    style={{ width: '40px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    className="input"
                    value={newArea.color}
                    onChange={(e) => setNewArea({ ...newArea, color: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
            <div>
              <label>Description (optional)</label>
              <textarea
                className="input"
                rows={2}
                value={newArea.description}
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                placeholder="What kinds of goals or tasks belong here?"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsAddingNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateArea}>Create Area</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal when Disabling an Area with Active Tasks */}
      {confirmDisableArea && (
        <Modal isOpen={true} onClose={() => setConfirmDisableArea(null)} title="Confirm Area Deactivation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>
                  Disable "{confirmDisableArea.name}"?
                </strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  This life area currently contains <strong>{tasks.filter((t) => t.lifeArea === confirmDisableArea.id && t.status !== 'completed').length} active task(s)</strong>.
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Disabling it will hide it from new task menus and filters, but its existing tasks and history will be safely preserved in your database.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDisableArea(null)}>Keep Active</button>
              <button className="btn btn-danger" onClick={confirmDisableProceed}>Confirm Deactivate</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROFESSIONAL APPEARANCE & BACKGROUNDS (Section 7)
// ─────────────────────────────────────────────────────────────────────────────

function AppearanceManager({
  settings,
  onSave,
  onUploadBackground,
}: {
  settings: AppearanceSettings;
  onSave: (appr: AppearanceSettings) => Promise<void>;
  onUploadBackground?: (file: File, desc?: string) => Promise<any>;
}) {
  const [preset, setPreset] = useState<ThemePreset>(settings.themePreset || 'navy-purple');
  const [accent, setAccent] = useState(settings.accentColor || '#818cf8');
  const [bgImage, setBgImage] = useState(settings.backgroundImageUrl || '');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(() => {
    const raw = settings.backgroundOverlayOpacity;
    if (typeof raw === 'number') {
      return raw <= 1 ? Math.round(raw * 100) : Math.min(65, Math.max(5, raw));
    }
    return 25;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.themePreset) setPreset(settings.themePreset);
    if (settings.accentColor) setAccent(settings.accentColor);
  }, [settings.themePreset, settings.accentColor]);

  const buildPayload = (nextPreset: ThemePreset, nextAccent: string): AppearanceSettings => ({
    theme: nextPreset === 'clean-light' ? 'light' : 'dark',
    themePreset: nextPreset,
    accentColor: nextAccent,
    backgroundImageUrl: bgImage.trim() || undefined,
    backgroundOverlayOpacity: overlayOpacity / 100,
  });

  const handleSelectPreset = async (nextPreset: ThemePreset) => {
    setPreset(nextPreset);
    await onSave(buildPayload(nextPreset, accent));
  };

  const handleSelectAccent = async (nextAccent: string) => {
    setAccent(nextAccent);
    await onSave(buildPayload(preset, nextAccent));
  };

  const handleApply = async () => {
    await onSave(buildPayload(preset, accent));
  };

  const handleReset = async () => {
    setPreset('navy-purple');
    setAccent('#818cf8');
    setBgImage('');
    setOverlayOpacity(25);
    await onSave({
      theme: 'dark',
      themePreset: 'navy-purple',
      accentColor: '#818cf8',
      backgroundImageUrl: undefined,
      backgroundOverlayOpacity: 0.25,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB for backgrounds) and type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Background image must be under 8 MB.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      if (onUploadBackground) {
        const uploaded = await onUploadBackground(file, 'Custom workspace background');
        if (uploaded?.signedUrl) {
          setBgImage(uploaded.signedUrl);
        }
      }
    } catch (err: unknown) {
      setUploadError(formatSafeErrorMessage(err, 'Failed to upload background image.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              Theme Presets & Accent Colors
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Tailored visual identities designed for focus, readability, and contrast.
            </p>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            <RotateCcw size={13} /> Reset to Default
          </button>
        </div>

        {/* Coordinated Theme Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {THEME_PRESETS.map((t) => {
            const isSelected = preset === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectPreset(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPreset(t.id); }}
                style={{
                  cursor: 'pointer',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: t.previewBg,
                  border: `2px solid ${isSelected ? t.border : 'var(--border)'}`,
                  boxShadow: isSelected ? `0 0 16px ${t.border}40` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: t.id === 'clean-light' ? '#0f172a' : '#f8fafc' }}>
                    {t.name}
                  </strong>
                  {isSelected && <CheckCircle2 size={16} color={t.border} />}
                </div>
                <p style={{ fontSize: '0.75rem', color: t.id === 'clean-light' ? '#64748b' : '#94a3b8', margin: 0 }}>
                  {t.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Accent Colors */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Accent Color
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleSelectAccent(c.value)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c.value,
                  border: accent === c.value ? '3px solid var(--text-primary)' : '2px solid transparent',
                  boxShadow: accent === c.value ? `0 0 10px ${c.value}` : 'none',
                  cursor: 'pointer',
                }}
                title={c.label}
              />
            ))}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              Current: <strong style={{ color: accent }}>{accent}</strong>
            </span>
          </div>
        </div>

        {/* User-Uploaded Background Option */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon size={16} color="#818cf8" /> Custom Background Image
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
            Provide a custom image URL or upload an image securely to Supabase Storage. Text and cards remain legible with the opacity overlay.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 240 }}
                value={bgImage}
                onChange={(e) => setBgImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... or upload below"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Upload size={14} />
                {isUploading ? 'Uploading…' : 'Upload Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {bgImage && (
                <button className="btn btn-ghost" onClick={() => setBgImage('')}>
                  Clear
                </button>
              )}
            </div>

            {uploadError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>
                {uploadError}
              </p>
            )}

            {/* Overlay Opacity Slider */}
            {bgImage && (
              <div style={{ marginTop: '0.5rem', background: 'var(--bg-surface-2)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dark Tint Overlay (for contrast)</span>
                  <strong style={{ color: '#818cf8' }}>{overlayOpacity}%</strong>
                </div>
                <input
                  type="range"
                  min={5}
                  max={65}
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#818cf8' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleApply}>
            Save & Apply Appearance
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECURE AI PROVIDERS & INTEGRATIONS (Section 8)
// ─────────────────────────────────────────────────────────────────────────────

function AiProvidersSettings({
  settings,
  onSave,
}: {
  settings: AiSettings;
  onSave: (ai: AiSettings) => Promise<void>;
}) {
  const [provider, setProvider] = useState<'openai' | 'gemini'>(settings.provider || 'gemini');
  const [model, setModel] = useState(
    settings.model && !settings.model.startsWith('gemini-1.5')
      ? settings.model
      : provider === 'gemini'
        ? 'gemini-3.5-flash-lite'
        : 'gpt-4.1-mini'
  );
  const [status, setStatus] = useState<AiStatusResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    runCheck();
  }, []);

  const runCheck = async () => {
    setIsTesting(true);
    try {
      const res = await checkAiConfig();
      setStatus(res);
      if (res.success && !settings.provider) {
        if (!res.providerConfigured.gemini && res.providerConfigured.openai) {
          setProvider('openai');
          setModel('gpt-4.1-mini');
        } else if (res.providerConfigured.gemini) {
          setProvider('gemini');
          setModel('gemini-3.5-flash-lite');
        }
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleProviderChange = (p: 'openai' | 'gemini') => {
    setProvider(p);
    setModel(p === 'gemini' ? 'gemini-3.5-flash-lite' : 'gpt-4.1-mini');
  };

  const handleSave = async () => {
    await onSave({
      provider,
      model,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="#818cf8" /> AI Providers & Execution System
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
          Life OS connects to official AI APIs through a secure serverless architecture. API keys are kept safe on the server and are never bundled in browser code.
        </p>

        {/* Provider Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            onClick={() => handleProviderChange('gemini')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleProviderChange('gemini'); }}
            style={{
              cursor: 'pointer',
              padding: '1rem',
              borderRadius: '10px',
              border: `2px solid ${provider === 'gemini' ? '#818cf8' : 'var(--border)'}`,
              background: provider === 'gemini' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Google Gemini</strong>
              {status?.providerConfigured?.gemini ? (
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.7rem' }}>
                  ✓ Connected
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                  Unconfigured
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Gemini 3.5 Flash-Lite / 3.8 Flash / 4 Hydrogen via Google AI API
            </p>
          </div>

          <div
            onClick={() => handleProviderChange('openai')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleProviderChange('openai'); }}
            style={{
              cursor: 'pointer',
              padding: '1rem',
              borderRadius: '10px',
              border: `2px solid ${provider === 'openai' ? '#818cf8' : 'var(--border)'}`,
              background: provider === 'openai' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>OpenAI</strong>
              {status?.providerConfigured?.openai ? (
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.7rem' }}>
                  ✓ Connected
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                  Unconfigured
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              GPT-4.1 mini / GPT-4.1 / GPT-4o mini via official OpenAI API
            </p>
          </div>
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Model Selection
          </label>
          <select
            className="input select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {provider === 'gemini' ? (
              <>
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Fastest, low-cost — default)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Balanced reasoning &amp; speed)</option>
                <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Everyday coding &amp; agentic tasks)</option>
              </>
            ) : (
              <>
                <option value="gpt-4.1-mini">GPT-4.1 mini (Fast, economical, recommended)</option>
                <option value="gpt-4.1">GPT-4.1 (High precision)</option>
                <option value="gpt-4o-mini">GPT-4o mini (Legacy lightweight)</option>
              </>
            )}
          </select>
        </div>

        {/* Setup instructions for Vercel */}
        <div
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Vercel Deployment Environment Setup</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {status && (
                <span
                  className="badge"
                  style={{
                    fontSize: '0.72rem',
                    background: status.providerConfigured?.[provider]
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    color: status.providerConfigured?.[provider] ? '#10b981' : '#f59e0b',
                  }}
                >
                  {status.providerConfigured?.[provider]
                    ? '✓ Connected'
                    : status.error || 'Missing API Key in Vercel Env'}
                </span>
              )}
              <button
                className="btn btn-ghost btn-xs"
                onClick={runCheck}
                disabled={isTesting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} className={isTesting ? 'animate-spin' : ''} /> Test Connection
              </button>
            </div>
          </div>
          <ol style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <li>Go to your project in the <strong>Vercel Dashboard</strong>.</li>
            <li>Navigate to <strong>Settings → Environment Variables</strong>.</li>
            <li>Add <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> with your secret key from Google AI Studio or OpenAI.</li>
            <li>Redeploy or promote changes. Your serverless <code>/api/ai</code> endpoint will automatically authenticate.</li>
          </ol>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            Save AI Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REPORTS & HISTORY SECTION (Section 3)
// ─────────────────────────────────────────────────────────────────────────────

function ReportsAndHistorySection({
  tasks,
  milestones,
}: {
  tasks: any[];
  milestones: any[];
}) {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completedMilestones = milestones.filter((m) => m.status === 'completed');

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileClock size={18} color="#818cf8" /> Reports & Execution History
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
          Historical records, task execution timestamps, and milestone achievements with clear distinction between creation and modification times.
        </p>

        {/* High-level metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-surface-2)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Tasks Ever Logged</span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', margin: '4px 0 0 0' }}>{tasks.length}</p>
          </div>
          <div style={{ background: 'var(--bg-surface-2)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks Completed</span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', margin: '4px 0 0 0' }}>{completedTasks.length}</p>
          </div>
          <div style={{ background: 'var(--bg-surface-2)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roadmap Milestones Finished</span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0 0 0' }}>{completedMilestones.length}</p>
          </div>
        </div>

        {/* Recently completed items with explicit Created vs Modified time */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
          Recent Task Execution Records
        </h3>

        {completedTasks.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No completed tasks recorded yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '360px', overflowY: 'auto' }}>
            {completedTasks.slice(0, 15).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{t.title}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Area: <span style={{ color: '#818cf8', textTransform: 'capitalize' }}>{t.lifeArea}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <div>
                    <span>Created: </span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(t.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Last Modified: </span>
                    <strong style={{ color: '#10b981' }}>{formatDate(t.updatedAt || t.createdAt)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ACCOUNT & PROFILE SECTION
// ─────────────────────────────────────────────────────────────────────────────

function AccountAndProfileSection({
  displayName,
  user,
  isGuest,
  syncStatus,
  isSupabaseConfigured,
  onSaveDisplayName,
  onPasswordReset,
  onSignOut,
}: {
  displayName?: string;
  user: any;
  isGuest?: boolean;
  syncStatus: string;
  isSupabaseConfigured: boolean;
  onSaveDisplayName: (name: string) => Promise<void>;
  onPasswordReset: (email: string) => Promise<any>;
  onSignOut: () => Promise<void>;
}) {
  const [name, setName] = useState(displayName || '');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await onPasswordReset(user.email);
      if (res.success) {
        setResetMessage(`Password reset link sent to ${user.email}.`);
      } else {
        setResetMessage(`Error: ${res.error || 'Failed to send password reset.'}`);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0' }}>👤 Profile & Account</h2>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label>Display Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
          </div>
          <button className="btn btn-primary" onClick={() => onSaveDisplayName(name)}>
            Save Name
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div className="setting-row">
            <span className="setting-row-label">Account Email</span>
            <span className="setting-row-value">{user?.email || (isGuest ? 'Guest Demo' : 'Not Signed In')}</span>
          </div>
          <div className="setting-row">
            <span className="setting-row-label">Cloud Synchronization</span>
            <span className="setting-row-value" style={{ color: syncStatus === 'synced' ? '#10b981' : '#f59e0b' }}>
              {syncStatus === 'synced' ? '🟢 Active & Synced' : syncStatus === 'syncing' ? '🔄 Syncing…' : '🟡 Offline'}
            </span>
          </div>
          <div className="setting-row">
            <span className="setting-row-label">Supabase Database</span>
            <span className="setting-row-value" style={{ color: isSupabaseConfigured ? '#10b981' : '#f59e0b' }}>
              {isSupabaseConfigured ? '🟢 Connected' : '🟡 Local Mode'}
            </span>
          </div>
          <div className="setting-row">
            <span className="setting-row-label">PostgreSQL Row-Level Security</span>
            <span className="setting-row-value" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Active (auth.uid() Isolated)
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleReset}
                disabled={isResetting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <KeyRound size={13} /> {isResetting ? 'Sending…' : 'Send Password Reset'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={onSignOut}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onSignOut}>
              Sign In to Life OS
            </button>
          )}
        </div>

        {resetMessage && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: resetMessage.startsWith('Error') ? '#ef4444' : '#10b981', margin: '0.75rem 0 0 0' }}>
            {resetMessage}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RECYCLE BIN EMBEDDED SECTION (Section 21)
// ─────────────────────────────────────────────────────────────────────────────

function RecycleBinEmbeddedSection({
  deletedTasks,
  onRestore,
  onPermanentDelete,
  onEmpty,
  onSuccess,
}: {
  deletedTasks: any[];
  onRestore: (id: string) => Promise<any>;
  onPermanentDelete: (id: string) => Promise<any>;
  onEmpty: () => Promise<any>;
  onSuccess: (msg: string) => void;
}) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    await onRestore(id);
    onSuccess('Task restored successfully.');
  };

  const handlePermDelete = async (id: string) => {
    await onPermanentDelete(id);
    setConfirmDeleteId(null);
    onSuccess('Task permanently deleted.');
  };

  const handleEmptyAll = async () => {
    await onEmpty();
    setConfirmEmpty(false);
    onSuccess('Recycle bin emptied.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} color="#ef4444" /> Recycle Bin ({deletedTasks.length})
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Deleted tasks remain here safely until you restore them or permanently empty the bin.
            </p>
          </div>

          {deletedTasks.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmEmpty(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Trash2 size={13} /> Empty Recycle Bin
            </button>
          )}
        </div>

        {deletedTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Trash2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
            <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>The Recycle Bin is empty</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              No soft-deleted tasks found. Deleted tasks can always be restored from here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {deletedTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.9rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.84rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{t.title}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ({t.lifeArea})
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRestore(t.id)}
                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={12} /> Restore
                  </button>

                  {confirmDeleteId === t.id ? (
                    <>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handlePermDelete(t.id)}
                        style={{ fontSize: '0.72rem' }}
                      >
                        Confirm Delete
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirmDeleteId(null)}
                        style={{ fontSize: '0.72rem' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: '#ef4444' }}
                      onClick={() => setConfirmDeleteId(t.id)}
                      title="Permanently Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal for Empty Bin */}
      {confirmEmpty && (
        <Modal isOpen={true} onClose={() => setConfirmEmpty(false)} title="Empty Recycle Bin?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to permanently delete all <strong>{deletedTasks.length} task(s)</strong> in the Recycle Bin?
            </p>
            <p style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmEmpty(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleEmptyAll}>Empty Recycle Bin</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DATA MANAGEMENT & BACKUPS SECTION (Section 19)
// ─────────────────────────────────────────────────────────────────────────────

function DataManagementSection({
  onExport,
  onImport,
  onReset,
  onSuccess,
}: {
  onExport: () => void;
  onImport: (f: File) => Promise<any>;
  onReset: () => Promise<void>;
  onSuccess: (msg: string) => void;
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      await onImport(file);
      onSuccess('Data snapshot successfully imported into Life OS.');
    } catch (err: unknown) {
      setImportError(formatSafeErrorMessage(err, 'Failed to import JSON file.'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteReset = async () => {
    await onReset();
    setShowResetConfirm(false);
    onSuccess('Application data has been reset to defaults.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="#818cf8" /> Data Export, Import & Reset
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
          Export a complete, self-contained JSON backup of your tasks, projects, notes, and milestones.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onExport} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} /> Export All Data (JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={15} /> Import Backup (JSON)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>

        {importError && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.83rem' }}>
            ❌ {importError}
          </div>
        )}

        {/* Destructive Reset Area */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ color: '#ef4444', fontSize: '0.92rem' }}>⚠️ Reset Personal Data</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Clear personal tasks, schedules, and reflection records. Setting preferences are preserved.
              </p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)}>
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <Modal isOpen={true} onClose={() => setShowResetConfirm(false)} title="Confirm Data Reset">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Are you sure you want to reset your personal data?</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  This will clear your personal tasks, schedules, and reflection entries. Milestones and life areas will be restored to initial state.
                </p>
                <p style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                  Export a JSON backup first if you wish to keep a copy of your records.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel — Keep My Data</button>
              <button className="btn btn-danger" onClick={handleExecuteReset}>Reset Personal Data</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
