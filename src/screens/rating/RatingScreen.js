import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { submitRating } from '../../api/ratings';
import { getPhotoUrl } from '../../api/users';
import { getCategoryEmoji } from '../../utils/school';
import { formatDateTime } from '../../utils/time';

const VIBE_OPTIONS = [
  { value: 'positive', emoji: '😊', label: 'Great!' },
  { value: 'neutral', emoji: '😐', label: 'It was fine' },
  { value: 'negative', emoji: '☹️', label: 'Not great' },
];

export default function RatingScreen({ route, navigation }) {
  const { session, rateeId, ratee } = route.params;
  const { user } = useAuth();

  const [bothShowedUp, setBothShowedUp] = useState(null); // null | true | false
  const [vibeScore, setVibeScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tokensEarned, setTokensEarned] = useState(0);

  const canSubmit = bothShowedUp !== null;
  const rateePhoto = getPhotoUrl(ratee?.photo_url);

  async function handleSubmit() {
    setLoading(true);
    try {
      const { tokensEarned: earned } = await submitRating({
        sessionId: session.id,
        raterId: user.id,
        rateeId,
        bothShowedUp,
        vibeScore: bothShowedUp ? vibeScore : null,
      });

      setTokensEarned(earned);
      setSubmitted(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <SuccessScreen tokensEarned={tokensEarned} session={session} onDone={() => navigation.popToTop()} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How was your session?</Text>

        {/* Session info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionEmoji}>{getCategoryEmoji(session.category)}</Text>
          <View>
            <Text style={styles.sessionName}>{session.location}</Text>
            {session.activity_detail && (
              <Text style={styles.sessionDetail}>{session.activity_detail}</Text>
            )}
            <Text style={styles.sessionTime}>{formatDateTime(session.start_time)}</Text>
          </View>
        </View>

        {/* Rate who */}
        <View style={styles.rateeSection}>
          <Text style={styles.ratingLabel}>You're rating:</Text>
          <View style={styles.rateeRow}>
            {rateePhoto ? (
              <Image source={{ uri: rateePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{ratee?.name?.charAt(0) || '?'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.rateeName}>{ratee?.name}</Text>
              <Text style={styles.rateeMeta}>
                {ratee?.school} '{String(ratee?.graduation_year || '').slice(-2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Did you both show up? */}
        <Text style={styles.questionText}>Did you both show up?</Text>
        <View style={styles.showedUpOptions}>
          {[
            { value: true, label: '✓ Yes, we met', active: bothShowedUp === true },
            { value: 'they_no_show', label: '✗ They didn\'t show', active: bothShowedUp === false && vibeScore === 'they_no_show' },
            { value: 'i_no_show', label: '✗ I didn\'t show', active: bothShowedUp === false && vibeScore === 'i_no_show' },
          ].map((opt) => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.showedUpOption, opt.active && styles.showedUpOptionActive]}
              onPress={() => {
                if (opt.value === true) {
                  setBothShowedUp(true);
                  setVibeScore(null);
                } else {
                  setBothShowedUp(false);
                  setVibeScore(opt.value === 'they_no_show' ? 'they_no_show' : 'i_no_show');
                }
              }}>
              <Text style={[styles.showedUpOptionText, opt.active && styles.showedUpOptionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vibe score (only if both showed up) */}
        {bothShowedUp === true && (
          <View style={styles.vibeSection}>
            <Text style={styles.questionText}>How was it? (optional)</Text>
            <View style={styles.vibeOptions}>
              {VIBE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.vibeOption,
                    vibeScore === opt.value && styles.vibeOptionActive,
                  ]}
                  onPress={() => setVibeScore(opt.value === vibeScore ? null : opt.value)}
                  accessibilityLabel={`${opt.emoji} ${opt.label}`}>
                  <Text style={styles.vibeEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.vibeLabel,
                      vibeScore === opt.value && styles.vibeLabelActive,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Button
          title="Submit Rating"
          onPress={handleSubmit}
          size="large"
          disabled={!canSubmit}
          loading={loading}
          style={styles.submitButton}
        />

        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SuccessScreen({ tokensEarned, session, onDone }) {
  return (
    <SafeAreaView style={styles.successContainer}>
      <View style={styles.successContent}>
        <Text style={styles.successTitle}>✓ Thanks for rating!</Text>

        {tokensEarned > 0 && (
          <View style={styles.tokenEarned}>
            <Text style={styles.tokenEmoji}>
              {getCategoryEmoji(session.category)} +{tokensEarned} tokens
            </Text>
            <Text style={styles.tokenLabel}>for showing up</Text>
          </View>
        )}

        <Button title="Back to Feed" onPress={onDone} size="large" style={styles.doneButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.electricBlue,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    ...Typography.h2,
    marginBottom: 20,
    textAlign: 'center',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  sessionEmoji: {
    fontSize: 32,
  },
  sessionName: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
  },
  sessionDetail: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
  sessionTime: {
    ...Typography.caption,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  rateeSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  ratingLabel: {
    ...Typography.label,
    color: Colors.mediumGray,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  rateeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGray,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.electricBlue,
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  rateeName: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
  },
  rateeMeta: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  questionText: {
    ...Typography.h3,
    marginBottom: 16,
  },
  showedUpOptions: {
    gap: 10,
    marginBottom: 24,
  },
  showedUpOption: {
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    borderRadius: 10,
    padding: 14,
    backgroundColor: Colors.lightGray,
  },
  showedUpOptionActive: {
    borderColor: Colors.electricBlue,
    backgroundColor: Colors.lightGray,
  },
  showedUpOptionText: {
    ...Typography.body,
    color: Colors.slateGray,
  },
  showedUpOptionTextActive: {
    color: Colors.freshGreen,
    fontFamily: 'Inter-SemiBold',
  },
  vibeSection: {
    marginBottom: 24,
  },
  vibeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  vibeOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
  vibeOptionActive: {
    borderColor: Colors.electricBlue,
    backgroundColor: Colors.lightGray,
  },
  vibeEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  vibeLabel: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  vibeLabelActive: {
    color: Colors.freshGreen,
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    marginBottom: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.electricBlue,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: {
    ...Typography.h1,
    color: Colors.freshGreen,
    marginBottom: 32,
  },
  tokenEarned: {
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
  },
  tokenEmoji: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.midnight,
    marginBottom: 4,
  },
  tokenLabel: {
    ...Typography.body,
    color: Colors.mediumGray,
  },
  doneButton: {
    width: '100%',
  },
});
