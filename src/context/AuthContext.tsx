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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  clearError: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        setAuthError(error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (sign in, token refresh, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession) {
        setIsGuest(false);
        setAuthError(null);
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

      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(error.message);
          return { success: false, error: error.message };
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

      if (password.length < 6) {
        const err = 'Password must be at least 6 characters.';
        setAuthError(err);
        return { success: false, error: err };
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(error.message);
          return { success: false, error: error.message };
        }

        if (data.session) {
          setUser(data.user);
          setSession(data.session);
          setIsGuest(false);
          return { success: true };
        } else {
          // Email confirmation is required by Supabase project settings
          return {
            success: true,
            message: 'Account created! Please check your email to confirm your registration.',
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
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsGuest(false);
    setAuthError(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
      setAuthError(null);
      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: 'Password reset link sent to your email. Check your inbox.',
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to request password reset';
        return { success: false, error: message };
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
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
        continueAsGuest,
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
