import * as Sentry from '@sentry/react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { supabase } from './src/lib/supabase';

if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !__DEV__,
    tracesSampleRate: 0.1,
  });
}

// TODO: Add Inter font files to assets/fonts/ to enable custom typography
// import { useFonts } from 'expo-font';

SplashScreen.preventAutoHideAsync();

function App() {
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Called by the Retry button in LoadingScreen (and by ErrorBoundary restart).
  // Signs out first to clear any stale Supabase session, then bumps the key so
  // AuthProvider fully unmounts + remounts for a guaranteed clean init.
  const handleRetry = useCallback(() => {
    supabase.auth.signOut().finally(() => {
      setAuthKey((k) => k + 1);
    });
  }, []);

  return (
    <AppErrorBoundary>
      <AuthProvider key={authKey} onRetry={handleRetry}>
        <NotificationProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default Sentry.wrap(App);
