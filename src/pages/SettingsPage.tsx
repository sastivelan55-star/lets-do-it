import React, { useState, useRef } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Monitor, AlertTriangle, Check, Cloud, ShieldCheck, LogOut, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { AppSettings, LifeAreaWeights } from '../types';
import SupabaseSetupNotice from '../components/auth/SupabaseSetupNotice';

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData, resetData, syncStatus } = useApp();
  const { user, isConfigured, signOut, resetPassword, isGuest } = useAuth();

  const [showReset, setShowReset] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [weightsEdit, setWeightsEdit] = useState<LifeAreaWeights>({ ...settings.lifeAreaWeights });
  const [nameEdit, setNameEdit] = useState(settings.displayName);
  const [saved, setSaved] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    setResetError('');
    setResetSent(false);
    try {
      const res = await resetPassword(user.email);
      if (res.success) {
        setResetSent(true);
      } else {
        setResetError(res.error || 'Failed to send password reset email.');
      }
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setIsResetting(false);
    }
  };

  const weightsTotal = Object.values(weightsEdit).reduce((s: number, v: number) => s + Number(v), 0);
  const weightsValid = weightsTotal === 100;

  const handleSaveProfile = async () => {
    await updateSettings({ displayName: nameEdit });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveWeights = async () => {
    if (!weightsValid) return;
    await updateSettings({ lifeAreaWeights: { ...weightsEdit } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTheme = (theme: AppSettings['theme']) => {
    updateSettings({ theme });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess('');
    try {
      await importData(file);
      setImportSuccess('Data imported successfully! The app has been updated.');
    } catch (err: unknown) {
      setImportError(`Import failed: ${err}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleReset = async () => {
    await resetData();
    setShowReset(false);
  };

  const AREA_LABELS: Record<string, string> = {
    technical: '💻 Technical Mastery (50%)',
    communication: '🗣️ Communication (15%)',
    career: '💼 Career Readiness (15%)',
    creativity: '🎨 Creativity & Identity (10%)',
    health: '💚 Health & Reflection (10%)',
  };

  const AREA_COLORS: Record<string, string> = {
    technical: '#6366f1',
    communication: '#06b6d4',
    career: '#f59e0b',
    creativity: '#ec4899',
    health: '#10b981',
  };

  return (
    <div className="page-container pb-safe">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          ⚙️ <span className="gradient-text">Settings & Data</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure cloud sync, appearance, and life-area planning weights.
        </p>
      </div>

      {/* Cloud & Security Status */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cloud size={18} color="#818cf8" /> Cloud Database & Account
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div className="setting-row">
            <span className="setting-row-label">Authenticated Account</span>
            <span className="setting-row-value">
              {user?.email ?? (isGuest ? 'Guest User (Demo Mode)' : 'Not signed in')}
            </span>
          </div>
          <div className="setting-row">
            <span className="setting-row-label">Database Sync Status</span>
            <span className="setting-row-value" style={{ color: syncStatus === 'synced' ? '#10b981' : syncStatus === 'syncing' ? '#818cf8' : '#f59e0b' }}>
              {syncStatus === 'synced' ? '🟢 Active & Synced' : syncStatus === 'syncing' ? '🔄 Syncing…' : '🟡 Local / Offline'}
            </span>
          </div>
          <div className="setting-row">
            <span className="setting-row-label">Security Architecture</span>
            <span className="setting-row-value" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <ShieldCheck size={14} /> PostgreSQL RLS (auth.uid() Isolated)
            </span>
          </div>
        </div>

        {/* Account Controls */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {user ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePasswordReset}
                disabled={isResetting}
                id="settings-reset-pw-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <KeyRound size={14} />
                {isResetting ? 'Sending…' : 'Reset Password'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                id="settings-signout-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={14} />
                {isSigningOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          ) : isGuest ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSignOut}
              id="settings-exit-guest-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Exit Demo & Sign In
            </button>
          ) : null}

          {resetSent && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', color: '#34d399', fontSize: '0.83rem' }}>
              ✅ Password reset email sent to {user?.email}. Follow the instructions in the email.
            </div>
          )}
          {resetError && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '0.83rem' }}>
              ❌ {resetError}
            </div>
          )}
        </div>

        {!isConfigured && (
          <div style={{ marginTop: '1rem' }}>
            <SupabaseSetupNotice />
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>👤 Profile</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label htmlFor="display-name">Display Name</label>
            <input
              id="display-name"
              className="input"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSaveProfile}>
            {saved ? <><Check size={15} /> Saved</> : 'Save'}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>🎨 Appearance</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {([
            { value: 'dark',   label: 'Dark',   icon: <Moon size={16} /> },
            { value: 'light',  label: 'Light',  icon: <Sun size={16} /> },
            { value: 'system', label: 'System', icon: <Monitor size={16} /> },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              className={`btn btn-sm ${settings.theme === opt.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTheme(opt.value)}
              id={`theme-${opt.value}`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Life Area Weights */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>⚖️ Life Area Planning Weights</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          These percentages represent planning priorities, not personal worth or health scores. Total must equal 100%.
        </p>

        {!weightsValid && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '0.875rem', fontSize: '0.83rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={14} />
            Total is {weightsTotal}% — must be exactly 100%
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(Object.entries(weightsEdit) as [keyof LifeAreaWeights, number][]).map(([area, value]) => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ margin: 0, minWidth: '130px', flex: '1 1 130px', color: AREA_COLORS[area], fontWeight: 600, fontSize: '0.85rem' }}>
                {AREA_LABELS[area] ?? area}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '2 1 180px', minWidth: 0 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => setWeightsEdit((w: LifeAreaWeights) => ({ ...w, [area]: Number(e.target.value) }))}
                  style={{ flex: 1, minWidth: 0, accentColor: AREA_COLORS[area] }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '56px', textAlign: 'center', padding: '0.4rem 0.5rem' }}
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => setWeightsEdit((w: LifeAreaWeights) => ({ ...w, [area]: Number(e.target.value) }))}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: weightsValid ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
            Total: {weightsTotal}% {weightsValid ? '✓' : '⚠️'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={handleSaveWeights} disabled={!weightsValid}>
            Save Weights
          </button>
        </div>
      </div>

      {/* Data management */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>💾 Data Management</h2>

        <div
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '0.875rem', marginBottom: '1rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}
        >
          ℹ️ You can export a snapshot backup of your entire LifeMap state as JSON anytime.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={exportData} id="export-btn">
            <Download size={15} /> Export All Data (JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} id="import-btn">
            <Upload size={15} /> Import from JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>

        {importError && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', color: '#f87171', fontSize: '0.83rem' }}>
            ❌ {importError}
          </div>
        )}
        {importSuccess && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', color: '#34d399', fontSize: '0.83rem' }}>
            ✅ {importSuccess}
          </div>
        )}

        <div className="divider" />

        {/* Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem', margin: '0 0 2px 0' }}>⚠️ Reset All Data</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>This will clear all tasks, records, and entries. Roadmap and projects will be restored to defaults.</p>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowReset(true)} id="reset-btn">
            <Trash2 size={14} /> Reset App
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>ℹ️ About LifeMap OS</h2>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p><strong style={{ color: 'var(--text-primary)' }}>Edition:</strong> LifeMap OS · Personal Progress & Cloud Execution</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Data Isolation:</strong> Authenticated Account Isolated via Cloud PostgreSQL RLS</p>
          <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            "Focus. Execute. Improve. Repeat. 8 months of consistency = a lifetime of opportunities."
          </p>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showReset && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowReset(false); }}>
          <div className="modal-box" style={{ maxWidth: '28rem', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Reset All Data?</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  This will permanently delete all your tasks, daily records, health entries, and communication logs. The roadmap milestones and projects will be restored to their initial state.
                </p>
                <p style={{ fontSize: '0.85rem', color: '#f87171', marginTop: '0.5rem', fontWeight: 600 }}>
                  This action cannot be undone. Export your data first if you want a backup.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowReset(false)}>Cancel — Keep Data</button>
              <button className="btn btn-danger" onClick={handleReset} id="confirm-reset-btn">Reset Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
