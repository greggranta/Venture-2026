import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const REVIEWER_EMAIL = 'reviewer@colum.edu';
const REVIEWER_CODE = '12345678';
const REVIEWER_PASSWORD = process.env.EXPO_PUBLIC_REVIEWER_PASSWORD;

const CODE_LENGTH = 8;

export default function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const { verifyOtp, signInWithOtp } = useAuth();

  const fullCode = code.join('');
  const isComplete = fullCode.length === CODE_LENGTH;

  function handleCodeChange(index, value) {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index, key) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (!isComplete) return;

    // Reviewer bypass: sign in directly with password, skip OTP verification
    if (email === REVIEWER_EMAIL && fullCode === REVIEWER_CODE) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: REVIEWER_EMAIL,
          password: REVIEWER_PASSWORD,
        });
        if (error) throw error;
        // AuthContext onAuthStateChange handles navigation
      } catch (error) {
        Alert.alert('Invalid Code', 'The verification code is incorrect or expired. Please try again.');
        setCode(['', '', '', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await verifyOtp(email, fullCode);
      if (error) throw error;

      // AuthContext listener will handle navigation based on profile existence
    } catch (error) {
      Alert.alert('Invalid Code', 'The verification code is incorrect or expired. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { error } = await signInWithOtp(email);
      if (error) throw error;
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent an 8-digit code to:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Code input boxes */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={(val) => handleCodeChange(index, val)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1} of verification code`}
            />
          ))}
        </View>

        <Button
          title="Verify"
          onPress={handleVerify}
          size="large"
          disabled={!isComplete}
          loading={loading}
          style={styles.verifyButton}
        />

        <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendButton}>
          <Text style={styles.resendText}>
            {resending ? 'Sending...' : "Didn't get it? Resend code"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Use a different email</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...Typography.h2,
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.mediumGray,
    marginBottom: 4,
  },
  emailText: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
    color: Colors.freshGreen,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  codeInput: {
    width: 38,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    borderRadius: 10,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.midnight,
    backgroundColor: Colors.lightGray,
  },
  codeInputFilled: {
    borderColor: Colors.electricBlue,
    backgroundColor: Colors.background,
  },
  verifyButton: {
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    ...Typography.body,
    color: Colors.freshGreen,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
});
