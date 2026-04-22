import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
        // Step 1: fetch stored session with a hard timeout
        const { data: { session: storedSession } } = await withLaunchTimeout(
          supabase.auth.getSession(),
          'getSession'
        );

        if (cancelledRef.current) return;

        if (!storedSession) {
          setLoading(false);
          return;
        }

        // Step 2: if stored token is expired, attempt refresh before proceeding
        const now = Math.floor(Date.now() / 1000);
        let activeSession = storedSession;

        if (storedSession.expires_at && storedSession.expires_at < now) {
          try {
            const { data: refreshData, error: refreshError } = await withLaunchTimeout(
              supabase.auth.refreshSession(),
              'refreshSession'
            );
            if (refreshError || !refreshData?.session) {
              throw new Error(refreshError?.message ?? 'refresh returned no session');
            }
            activeSession = refreshData.session;
          } catch (refreshErr) {
            console.warn('[LAUNCH_TIMEOUT] Token refresh failed, clearing session:', refreshErr.message);
            await supabase.auth.signOut();
            if (!cancelledRef.current) setLoading(false);
            return;
          }
        }

        if (cancelledRef.current) return;

        setSession(activeSession);
        setUser(activeSession.user);

        // Step 3: fetch profile with a hard timeout
        await withLaunchTimeout(
          fetchProfileInternal(activeSession.user.id),
          'fetchProfile'
        );
      } catch (err) {
        console.error('[LAUNCH_TIMEOUT] Launch init failed:', err.message);
        // Clear any partial auth state so AppNavigator routes to Welcome
        await supabase.auth.signOut();
        if (!cancelledRef.current) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    init();

    // Post-launch: listen for auth state changes (sign-in / sign-out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileInternal(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

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
    onRetry,
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
