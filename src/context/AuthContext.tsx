/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../services/supabaseClient';
import { isSupabaseConfigured } from '../config/env';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authError: string | null;
  isConfigured: boolean;
  isGuest: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  clearError: () => void;
  continueAsGuest: () => void;
  dismissPasswordRecovery: () => void;
}

import { extractErrorInfo, logSafeError } from '../utils/errorUtils';

export function formatAuthErrorMessage(
  err: unknown,
  context: 'signup' | 'signin' | 'reset' | 'google' = 'signin'
): string {
  if (!err) return 'An unexpected authentication error occurred.';
  const info = extractErrorInfo(err, 'Authentication');
  const rawMessage = info.message;
  if (!rawMessage || rawMessage === '[object Object]') {
    return 'An unexpected authentication error occurred. Please try again.';
  }
  const lower = rawMessage.toLowerCase();

  // Supabase provider email rate limit
  if (
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit exceeded') ||
    lower.includes('too many requests')
  ) {
    if (context === 'signup' || context === 'reset') {
      return 'Supabase email rate limit exceeded: The built-in email sender hourly quota has been reached on this Supabase project. If you already created an account, you can Sign In directly without needing a new email. Otherwise, please wait for the hourly cooldown or configure a custom SMTP provider in the Supabase Dashboard.';
    }
    return 'Rate limit exceeded: Too many requests were sent to the authentication provider. Please wait a few moments before trying again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email has not been verified yet. Please check your inbox for the confirmation email before signing in.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in or reset your password.';
  }

  if (
    lower.includes('provider is not enabled') ||
    lower.includes('unsupported provider') ||
    lower.includes('provider disabled')
  ) {
    return 'Google sign-in is not enabled in this Supabase project. Please enable Google provider under Supabase Dashboard -> Authentication -> Providers -> Google.';
  }

  return rawMessage;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    const search = window.location.search;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (error || errorDescription) {
      let msg = errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : 'Authentication verification failed';
      const lower = msg.toLowerCase();
      if (errorCode === 'otp_expired' || lower.includes('expired')) {
        msg = 'The verification or reset link has expired. Please request a new link.';
      } else if (errorCode === 'access_denied') {
        msg = 'Access denied. The verification link is invalid or has already been used.';
      } else if (errorCode === 'over_email_send_rate_limit' || lower.includes('rate limit')) {
        msg = formatAuthErrorMessage(msg, 'signup');
      }
      return msg;
    }
    return null;
  });
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    const search = window.location.search;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
    return params.get('type') === 'recovery';
  });

  useEffect(() => {
    // Clean up error params in URL address bar on mount
    if (typeof window !== 'undefined' && (window.location.hash.includes('error=') || window.location.search.includes('error='))) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    // 2. Restore active session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error) {
          setAuthError(formatAuthErrorMessage(error.message));
        }
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        logSafeError('Restore session', err);
        const message = formatAuthErrorMessage(err, 'signin');
        setAuthError(message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          // If session was established from an auth token in the hash, clean up the address bar
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      });

    // 3. Listen for auth changes (sign in, token refresh, sign out, password recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession) {
        setIsGuest(false);
        setAuthError(null);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      if (event === 'SIGNED_IN') {
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setAuthError(null);
      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
      }

      if (!email.trim() || !password) {
        const err = 'Email and password are required.';
        setAuthError(err);
        return { success: false, error: err };
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          const userFriendlyMessage = formatAuthErrorMessage(error.message, 'signin');
          setAuthError(userFriendlyMessage);
          return { success: false, error: userFriendlyMessage };
        }

        setUser(data.user);
        setSession(data.session);
        setIsGuest(false);
        return { success: true };
      } catch (err: unknown) {
        logSafeError('Sign In', err);
        const message = formatAuthErrorMessage(err, 'signin');
        setAuthError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> => {
      setAuthError(null);
      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        const err = 'Please enter a valid email address.';
        setAuthError(err);
        return { success: false, error: err };
      }

      if (password.length < 6) {
        const err = 'Password must be at least 6 characters.';
        setAuthError(err);
        return { success: false, error: err };
      }

      setIsLoading(true);
      try {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
        });

        if (error) {
          const formatted = formatAuthErrorMessage(error.message, 'signup');
          setAuthError(formatted);
          return { success: false, error: formatted };
        }

        // Supabase returns an empty identities array if an account with this email already exists
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          const err = 'An account with this email already exists. Please sign in or reset your password.';
          setAuthError(err);
          return { success: false, error: err };
        }

        if (data.session) {
          setUser(data.user);
          setSession(data.session);
          setIsGuest(false);
          return { success: true };
        } else {
          // Email confirmation is required by Supabase project settings (mailer_autoconfirm = false)
          return {
            success: true,
            message: 'Account created! Please check your email inbox to confirm your registration before signing in.',
          };
        }
      } catch (err: unknown) {
        logSafeError('Sign Up', err);
        const message = formatAuthErrorMessage(err, 'signup');
        setAuthError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const supabase = getSupabase();
    if (!supabase) {
      const err = 'Supabase credentials are not configured.';
      setAuthError(err);
      return { success: false, error: err };
    }

    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        const formatted = formatAuthErrorMessage(error, 'google');
        setAuthError(formatted);
        return { success: false, error: formatted };
      }

      // If Supabase returned an OAuth authorization URL, redirect the browser
      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }

      return { success: true };
    } catch (err: unknown) {
      logSafeError('Google Sign In', err);
      const formatted = formatAuthErrorMessage(err, 'google');
      setAuthError(formatted);
      return { success: false, error: formatted };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout network errors
      }
    }
    setUser(null);
    setSession(null);
    setIsGuest(false);
    setIsPasswordRecovery(false);
    setAuthError(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
      setAuthError(null);
      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        const err = 'Please enter a valid email address.';
        setAuthError(err);
        return { success: false, error: err };
      }

      try {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: redirectUrl,
        });

        if (error) {
          const formatted = formatAuthErrorMessage(error, 'reset');
          setAuthError(formatted);
          return { success: false, error: formatted };
        }

        return {
          success: true,
          message: 'Password reset link sent to your email. Check your inbox and follow the link to set a new password.',
        };
      } catch (err: unknown) {
        logSafeError('Reset Password', err);
        const formatted = formatAuthErrorMessage(err, 'reset');
        return { success: false, error: formatted };
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> => {
      setAuthError(null);
      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, error: 'Supabase credentials are not configured.' };
      }

      if (newPassword.length < 6) {
        const err = 'Password must be at least 6 characters.';
        setAuthError(err);
        return { success: false, error: err };
      }

      setIsLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          const formatted = formatAuthErrorMessage(error, 'signin');
          setAuthError(formatted);
          return { success: false, error: formatted };
        }
        setIsPasswordRecovery(false);
        return {
          success: true,
          message: 'Password updated successfully! You can now continue using your account.',
        };
      } catch (err: unknown) {
        logSafeError('Update Password', err);
        const formatted = formatAuthErrorMessage(err, 'signin');
        setAuthError(formatted);
        return { success: false, error: formatted };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    setAuthError(null);
    setIsPasswordRecovery(false);
  }, []);

  const dismissPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        authError,
        isConfigured: isSupabaseConfigured,
        isGuest,
        isPasswordRecovery,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        clearError,
        continueAsGuest,
        dismissPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
