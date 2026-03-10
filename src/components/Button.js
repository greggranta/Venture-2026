import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    isDisabled && styles.disabled,
    isDisabled && variant === 'secondary' && styles.disabledSecondary,
    style,
  ];

  const labelStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.electricBlue}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.electricBlue,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.electricBlue,
  },
  success: {
    backgroundColor: Colors.freshGreen,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  disabled: {
    backgroundColor: Colors.borderGray,
  },
  disabledSecondary: {
    backgroundColor: 'transparent',
    borderColor: Colors.borderGray,
  },
  text: {
    ...Typography.buttonText,
  },
  text_primary: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.electricBlue,
  },
  text_success: {
    color: Colors.white,
  },
  text_danger: {
    color: Colors.white,
  },
  text_ghost: {
    color: Colors.electricBlue,
  },
  textSize_small: {
    fontSize: 13,
  },
  textSize_medium: {
    fontSize: 15,
  },
  textSize_large: {
    fontSize: 16,
  },
  disabledText: {
    color: Colors.mediumGray,
  },
});
