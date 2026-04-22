import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

// Phase transitions:
//  0 →  2s  clean spinner, no text
//  2 →  5s  "Connecting..."
//  5 →  8s  "Taking longer than usual..."
//  8s+      "Having trouble connecting" + Retry button
const PHASES = [
  { delay: 2000, message: null },
  { delay: 5000, message: 'Connecting...' },
  { delay: 8000, message: 'Taking longer than usual...' },
];

export default function LoadingScreen({ onRetry }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = PHASES.map((p, i) =>
      setTimeout(() => setPhase(i + 1), p.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const isRetryPhase = phase >= PHASES.length;
  const message = isRetryPhase
    ? 'Having trouble connecting'
    : PHASES[phase - 1]?.message ?? null;

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>VENTURE</Text>
      <ActivityIndicator size="large" color={Colors.freshGreen} style={styles.spinner} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {isRetryPhase && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.75}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...Typography.h1,
    color: Colors.white,
    letterSpacing: 4,
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: Colors.electricBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  retryText: {
    ...Typography.buttonText,
    color: Colors.white,
  },
});
