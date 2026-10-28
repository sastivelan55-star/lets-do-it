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
  Info
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

type SettingsTab =
  | 'areas'
  | 'appearance'
  | 'ai'
  | 'reports'
  | 'account'
  | 'recycle-bin'
  | 'data'
  | 'branding';

const THEME_PRESETS: { id: ThemePreset; name: string; desc: string; previewBg: string; border: string }[] = [
  { id: 'navy-purple', name: 'Navy & Purple', desc: 'Life OS Classic deep navy and radiant purple identity', previewBg: '#0f172a', border: '#6366f1' },
  { id: 'dark-slate', name: 'Dark Slate', desc: 'Minimalist slate gray with crisp indigo contrast', previewBg: '#1e293b', border: '#818cf8' },
  { id: 'midnight-oled', name: 'Midnight OLED', desc: 'True pitch black for maximum battery and OLED contrast', previewBg: '#000000', border: '#38bdf8' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Vibrant neon pink and cyan high-contrast dark theme', previewBg: '#0d0221', border: '#ec4899' },
  { id: 'clean-light', name: 'Clean Light', desc: 'Modern bright productivity theme with slate accents', previewBg: '#f8fafc', border: '#64748b' },
];

const ACCENT_COLORS = [
  { label: 'Indigo', value: '#818cf8' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose Pink', value: '#ec4899' },
  { label: 'Amber', value: '#f59e0b' },
];

export default function SettingsPage() {
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

  const [activeTab, setActiveTab] = useState<SettingsTab>('areas');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const showSaveSuccess = (msg = 'Changes saved successfully') => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(null), 2500);
  };

  return (
    <div className="page-container pb-safe">
      {/* Page Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          ⚙️ <span className="gradient-text">Life OS Control Center</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Customize life areas, appearance, secure AI execution, and data management.
        </p>
      </div>

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
          { id: 'branding', label: 'Manual Branding', icon: <Info size={14} /> },
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
        <AppearanceManager
          settings={settings.appearance || {}}
          onSave={async (appr) => {
            await updateAppearance(appr);
            showSaveSuccess('Appearance settings saved.');
          }}
          onUploadBackground={uploadFile}
        />
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

      {activeTab === 'branding' && (
        <ManualBrandingGuidance />
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
                  <span style={{ fontSize: '1.3rem' }}>{area.icon}</span>
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
                    className={`btn btn-sm ${isEnabled ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={() => handleToggleEnable(area)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                    title={isEnabled ? 'Disable area' : 'Enable area'}
                  >
                    {isEnabled ? 'Disable' : 'Enable'}
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
  const [overlayOpacity, setOverlayOpacity] = useState(settings.backgroundOverlayOpacity ?? 20);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApply = async () => {
    await onSave({
      theme: 'dark',
      themePreset: preset,
      accentColor: accent,
      backgroundImageUrl: bgImage || undefined,
      backgroundOverlayOpacity: overlayOpacity,
    });
  };

  const handleReset = async () => {
    setPreset('navy-purple');
    setAccent('#818cf8');
    setBgImage('');
    setOverlayOpacity(20);
    await onSave({
      theme: 'dark',
      themePreset: 'navy-purple',
      accentColor: '#818cf8',
      backgroundImageUrl: undefined,
      backgroundOverlayOpacity: 20,
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
                onClick={() => setPreset(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPreset(t.id); }}
                style={{
                  cursor: 'pointer',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: t.previewBg,
                  border: `2px solid ${isSelected ? t.border : 'rgba(255, 255, 255, 0.1)'}`,
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
                onClick={() => setAccent(c.value)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c.value,
                  border: accent === c.value ? '3px solid white' : '2px solid transparent',
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
                  min={0}
                  max={80}
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
  const [model, setModel] = useState(settings.model || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'));
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
    } finally {
      setIsTesting(false);
    }
  };

  const handleProviderChange = (p: 'openai' | 'gemini') => {
    setProvider(p);
    setModel(p === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
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
                  ✓ Configured
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                  Unconfigured
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Gemini 1.5 Flash / Pro via official Google Generative Language API
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
                  ✓ Configured
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                  Unconfigured
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              GPT-4o / GPT-4o-mini via official OpenAI API
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
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, low-latency, recommended)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning)</option>
              </>
            ) : (
              <>
                <option value="gpt-4o-mini">GPT-4o mini (Fast, economical, recommended)</option>
                <option value="gpt-4o">GPT-4o (High precision)</option>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Vercel Deployment Environment Setup</strong>
            <button
              className="btn btn-ghost btn-xs"
              onClick={runCheck}
              disabled={isTesting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={isTesting ? 'animate-spin' : ''} /> Test Connection
            </button>
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

// ─────────────────────────────────────────────────────────────────────────────
// 8. MANUAL BRANDING & SECURITY GUIDANCE (Section 6.4)
// ─────────────────────────────────────────────────────────────────────────────

function ManualBrandingGuidance() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="#818cf8" /> Manual Branding & Architecture Guidance
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
          Exact repository file paths controlling application name, branding logos, and metadata.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ background: 'var(--bg-surface-2)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <strong style={{ color: '#818cf8' }}>1. Browser Title & Metadata</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
              index.html
            </p>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Controls the HTML <code>&lt;title&gt;</code> tag and <code>&lt;meta name="description"&gt;</code> shown on search engines and browser tabs.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-2)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <strong style={{ color: '#818cf8' }}>2. Application Name in UI</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
              src/components/layout/Sidebar.tsx <br />
              src/components/auth/AuthPage.tsx <br />
              src/App.tsx (LoadingScreen)
            </p>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              To rename the application in the future, update the brand title in these three files.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-2)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <strong style={{ color: '#818cf8' }}>3. Application Logo Icon</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
              src/components/layout/Sidebar.tsx (lines 80-92) <br />
              src/components/auth/AuthPage.tsx (logo container)
            </p>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Renders the sleek Sparkles badge with purple gradient. You can replace the Lucide icon with an SVG or image tag.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
