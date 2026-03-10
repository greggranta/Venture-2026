import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>VENTURE</Text>
      <ActivityIndicator size="large" color={Colors.electricBlue} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...Typography.h1,
    color: Colors.electricBlue,
    letterSpacing: 4,
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
});
