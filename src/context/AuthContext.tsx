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
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  clearError: () => void;
  continueAsGuest: () => void;
  dismissPasswordRecovery: () => void;
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
      if (errorCode === 'otp_expired' || msg.toLowerCase().includes('expired')) {
        msg = 'The verification or reset link has expired. Please request a new link.';
      } else if (errorCode === 'access_denied') {
        msg = 'Access denied. The verification link is invalid or has already been used.';
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
          setAuthError(error.message);
        }
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to restore session';
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
          let userFriendlyMessage = error.message;
          const lower = error.message.toLowerCase();
          if (lower.includes('email not confirmed')) {
            userFriendlyMessage =
              'Your email has not been verified yet. Please check your inbox for the confirmation email before signing in.';
          } else if (lower.includes('invalid login credentials')) {
            userFriendlyMessage = 'Invalid email or password. Please verify your credentials and try again.';
          }
          setAuthError(userFriendlyMessage);
          return { success: false, error: userFriendlyMessage };
        }

        setUser(data.user);
        setSession(data.session);
        setIsGuest(false);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unexpected sign in error';
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
          setAuthError(error.message);
          return { success: false, error: error.message };
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
        const message = err instanceof Error ? err.message : 'Unexpected sign up error';
        setAuthError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: 'Password reset link sent to your email. Check your inbox and follow the link to set a new password.',
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to request password reset';
        return { success: false, error: message };
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
          setAuthError(error.message);
          return { success: false, error: error.message };
        }
        setIsPasswordRecovery(false);
        return {
          success: true,
          message: 'Password updated successfully! You can now continue using your account.',
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update password';
        setAuthError(message);
        return { success: false, error: message };
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
