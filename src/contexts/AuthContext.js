import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { supabase } from '../lib/supabase';

const LAUNCH_TIMEOUT_MS = 6000;

function withLaunchTimeout(promise, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`[LAUNCH_TIMEOUT] ${label} timed out after ${LAUNCH_TIMEOUT_MS}ms`)),
      LAUNCH_TIMEOUT_MS
    )
  );
  return Promise.race([promise, timeout]);
}

const AuthContext = createContext(null);

export function AuthProvider({ children, onRetry }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function init() {
      try {
        // Step 1: force refresh unconditionally — never boot with a stale token
        const { data: refreshData, error: refreshError } = await withLaunchTimeout(
          supabase.auth.refreshSession(),
          'refreshSession'
        );

        if (cancelledRef.current) return;

        if (refreshError || !refreshData?.session) {
          // Not logged in, or refresh token expired/revoked — route to login
          if (!cancelledRef.current) {
            setUser(null);
            setProfile(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }

        const activeSession = refreshData.session;
        setSession(activeSession);
        setUser(activeSession.user);

        // Step 2: fetch profile with a hard timeout
        await withLaunchTimeout(
          fetchProfileInternal(activeSession.user.id),
          'fetchProfile'
        );
      } catch (err) {
        console.error('[LAUNCH_TIMEOUT] Launch init failed:', err.message);
        if (!__DEV__) Sentry.captureException(err);
        if (!cancelledRef.current) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    init();

    // Listen for auth state changes; init() owns the initial boot sequence
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (cancelledRef.current) return;
      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        fetchProfileInternal(newSession.user.id);
      }
    });

    return () => {
      cancelledRef.current = true;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfileInternal(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!cancelledRef.current) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }

  async function handleRetryInternal() {
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(true);

    try {
      const { data: refreshData, error: refreshError } = await withLaunchTimeout(
        supabase.auth.refreshSession(),
        'refreshSession-retry'
      );

      if (cancelledRef.current) return;

      if (refreshError || !refreshData?.session) {
        // Refresh failed — state already cleared, route to login
        if (!cancelledRef.current) setLoading(false);
        onRetry?.(); // force clean remount via App.js authKey bump
        return;
      }

      const activeSession = refreshData.session;
      setSession(activeSession);
      setUser(activeSession.user);
      await fetchProfileInternal(activeSession.user.id);
      // Success — state restored in place; do NOT call onRetry (App.js signs out first)
    } catch (err) {
      console.error('[RETRY] Refresh failed:', err.message);
      if (!__DEV__) Sentry.captureException(err);
      if (!cancelledRef.current) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
      }
      onRetry?.(); // force clean remount via App.js authKey bump
    }
  }

  async function signInWithOtp(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Omitting emailRedirectTo forces Supabase to send a 6-digit OTP
        // code instead of a magic link. Also ensure the Supabase dashboard
        // email template uses {{ .Token }} not {{ .ConfirmationURL }}.
        emailRedirectTo: undefined,
      },
    });
    return { data, error };
  }

  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  async function refreshProfile() {
    if (user) await fetchProfileInternal(user.id);
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithOtp,
    verifyOtp,
    signOut,
    refreshProfile,
    onRetry: handleRetryInternal,
    isAuthenticated: !!user,
    hasProfile: !!profile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
