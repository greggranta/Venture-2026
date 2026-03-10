import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { isEduEmail } from '../../utils/school';

export default function WelcomeScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithOtp } = useAuth();

  const isValidEmail = isEduEmail(email.trim());

  async function handleContinue() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail) {
      Alert.alert('Invalid Email', 'Please enter a valid .edu email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithOtp(trimmedEmail);
      if (error) throw error;

      navigation.navigate('VerifyEmail', { email: trimmedEmail });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        {/* Logo section */}
        <View style={styles.hero}>
          <Text style={styles.logo}>VENTURE</Text>
          <Text style={styles.tagline}>Real connections start here</Text>
          <View style={styles.iconRow}>
            <Text style={styles.icon}>🏋️</Text>
            <Text style={styles.icon}>☕</Text>
            <Text style={styles.icon}>📚</Text>
          </View>
        </View>

        {/* Email form */}
        <View style={styles.form}>
          <Text style={styles.formLabel}>Enter your .edu email</Text>
          <TextInput
            style={[styles.input, email.length > 0 && !isValidEmail && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@university.edu"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            accessibilityLabel="Email address input"
          />
          {email.length > 0 && !isValidEmail && (
            <Text style={styles.errorText}>Must be a valid .edu email address</Text>
          )}

          <Button
            title="Continue"
            onPress={handleContinue}
            size="large"
            disabled={!isValidEmail}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.disclaimer}>
            Chicago college students only.{'\n'}
            Columbia • UChicago • Northwestern • DePaul • Loyola • UIC
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontFamily: 'Inter-Bold',
    fontSize: 42,
    letterSpacing: 6,
    color: Colors.electricBlue,
    marginBottom: 8,
  },
  tagline: {
    ...Typography.body,
    color: Colors.slateGray,
    marginBottom: 24,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
  },
  icon: {
    fontSize: 36,
  },
  form: {
    width: '100%',
  },
  formLabel: {
    ...Typography.label,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.midnight,
    marginBottom: 8,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
