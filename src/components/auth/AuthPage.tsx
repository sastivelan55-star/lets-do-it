import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Cloud,
  Shield,
  Zap,
  Smartphone,
  Laptop,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import SupabaseSetupNotice from './SupabaseSetupNotice';

function GoogleIcon({ size = 18 }: { size?: number }) {
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
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    clearError();
    setLocalError(null);
    setInfoMessage(null);
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

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const result = await signIn(trimmedEmail, password);
        if (!result.success && result.error) {
          // Handled by authError from context
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
    if (!resetEmail.trim()) {
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0f19 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        color: 'var(--text-primary, #ffffff)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
            marginBottom: '0.75rem',
            fontSize: '1.75rem',
          }}
        >
          ⚡
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: '2.2rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontFamily: 'Outfit, sans-serif',
            background: 'linear-gradient(135deg, #ffffff, #c7d2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          LifeMap OS
        </h1>
        <p style={{ margin: '0.4rem 0 0 0', color: 'rgba(203, 213, 225, 0.75)', fontSize: '0.95rem' }}>
          Personal Progress & Cloud Execution System
        </p>
      </div>

      {/* Main Auth Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 5vw, 2rem)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            id="tab-signin"
            onClick={() => switchMode('signin')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'signin' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : 'rgba(203, 213, 225, 0.65)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-signup"
            onClick={() => switchMode('signup')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'signup' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : 'rgba(203, 213, 225, 0.65)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        {displayError && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              lineHeight: 1.45,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
              <span style={{ flex: 1 }}>{displayError}</span>
            </div>

            {/* Actionable guidance if email rate limit was exceeded */}
            {isRateLimited && mode === 'signup' && (
              <div
                style={{
                  marginTop: '0.25rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '0.8rem',
                  color: '#e2e8f0',
                }}
              >
                Already registered previously?{' '}
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
                  Sign In directly with email & password
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
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              lineHeight: 1.45,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#34d399' }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              htmlFor="auth-email-input"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                color: 'rgba(203, 213, 225, 0.9)',
              }}
            >
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(148, 163, 184, 0.7)',
                  pointerEvents: 'none',
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
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label
                htmlFor="auth-password-input"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'rgba(203, 213, 225, 0.9)',
                  margin: 0,
                }}
              >
                Password
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
                    color: '#818cf8',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(148, 163, 184, 0.7)',
                  pointerEvents: 'none',
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
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.65)',
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password in SignUp Mode */}
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-confirm-password-input"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  color: 'rgba(203, 213, 225, 0.9)',
                }}
              >
                Confirm password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(148, 163, 184, 0.7)',
                    pointerEvents: 'none',
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
                  placeholder="Repeat your password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.65)',
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
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="auth-submit-button"
            disabled={submitting || googleSubmitting}
            style={{
              marginTop: '0.35rem',
              padding: '0.85rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: submitting || googleSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: submitting || googleSubmitting ? 0.7 : 1,
              transition: 'opacity 0.2s',
              width: '100%',
              minHeight: '48px',
              touchAction: 'manipulation',
            }}
          >
            {submitting ? (
              <span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
            ) : mode === 'signin' ? (
              <>
                <Zap size={18} /> Sign In
              </>
            ) : (
              <>
                <Cloud size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.4rem 0',
            color: 'rgba(148, 163, 184, 0.6)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ padding: '0 0.75rem' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Google OAuth Button */}
        <div>
          <button
            type="button"
            id="google-signin-button"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting || submitting}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: googleSubmitting || submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              transition: 'background 0.2s, border-color 0.2s',
              opacity: googleSubmitting || submitting ? 0.7 : 1,
            }}
          >
            <GoogleIcon size={18} />
            <span>{googleSubmitting ? 'Connecting to Google…' : 'Sign in with Google'}</span>
          </button>
          <p
            style={{
              margin: '0.4rem 0 0 0',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'rgba(148, 163, 184, 0.55)',
            }}
          >
            Requires Google OAuth provider enabled in Supabase
          </p>
        </div>

        {/* Bottom Mode Switch Link */}
        <div
          style={{
            marginTop: '1.4rem',
            paddingTop: '1.2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.85rem',
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
                  color: '#818cf8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.85rem',
                }}
              >
                Create one now <ArrowRight size={13} style={{ verticalAlign: 'middle' }} />
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
                  color: '#818cf8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.85rem',
                }}
              >
                Sign In instead <ArrowRight size={13} style={{ verticalAlign: 'middle' }} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Feature Badges */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem 1.25rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '560px',
          color: 'rgba(148, 163, 184, 0.75)',
          fontSize: '0.78rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Cloud size={16} color="#818cf8" />
          <span>Real PostgreSQL Cloud Sync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Shield size={16} color="#34d399" />
          <span>Row-Level Security (RLS)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Smartphone size={16} color="#f59e0b" />
          <Laptop size={16} color="#f59e0b" />
          <span>Multi-Device Sync</span>
        </div>
      </div>

      {/* Setup Notice if Supabase credentials are missing */}
      {!isConfigured && (
        <div style={{ marginTop: '2rem', width: '100%', maxWidth: '640px' }}>
          <SupabaseSetupNotice />
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              Reset Password
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'rgba(203, 213, 225, 0.7)', lineHeight: 1.4 }}>
              Enter your registered email address. We'll send instructions to set a new password.
            </p>

            {resetError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
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
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
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

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
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
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
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
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Recovery Modal (when user arrives from reset link in email) */}
      {isPasswordRecovery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '1.75rem',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
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
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
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
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
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

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                      padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
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
                      padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
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

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  id="cancel-recovery-password"
                  onClick={dismissPasswordRecovery}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
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
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    fontSize: '0.88rem',
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
