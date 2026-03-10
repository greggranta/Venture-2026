import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { getCategoryEmoji, getCategoryName } from '../utils/school';
import { getTimeDisplay, getUrgencyColor, isUrgent, formatDuration } from '../utils/time';
import { formatDistance } from '../utils/distance';
import Button from './Button';
import { getPhotoUrl } from '../api/users';

export default function SessionCard({ session, onJoin, onPress, isJoined = false, userId }) {
  const urgencyColor = getUrgencyColor(session.start_time);
  const timeDisplay = getTimeDisplay(session.start_time);
  const urgent = isUrgent(session.start_time);
  const isFull = session.attendee_count >= session.looking_for;
  const isOwn = session.created_by === userId;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (urgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [urgent]);

  const creatorPhotoUrl = getPhotoUrl(session.creator?.photo_url);

  function getJoinButtonProps() {
    if (isOwn) return { title: 'YOUR POST', variant: 'ghost', disabled: true };
    if (isJoined) return { title: "YOU'RE GOING ✓", variant: 'success', disabled: true };
    if (isFull) return { title: 'FULL', variant: 'ghost', disabled: true };
    return { title: "I'M THERE", variant: 'primary', disabled: false };
  }

  const joinProps = getJoinButtonProps();

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: urgencyColor }]}
      onPress={() => onPress && onPress(session)}
      activeOpacity={0.95}
      accessibilityLabel={`${getCategoryName(session.category)} session at ${session.location}`}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.categoryEmoji}>{getCategoryEmoji(session.category)}</Text>
        <Text style={[styles.categoryName, { color: urgencyColor }]}>
          {getCategoryName(session.category)}
        </Text>
        {urgent && (
          <Animated.Text
            style={[styles.urgentBadge, { transform: [{ scale: pulseAnim }] }]}>
            🔴
          </Animated.Text>
        )}
      </View>

      {/* Location and time */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {session.distance ? `📍 ${formatDistance(session.distance)} • ` : '📍 '}
          {timeDisplay}
        </Text>
        <Text style={styles.durationText}>{formatDuration(session.duration)}</Text>
      </View>

      {/* Activity title */}
      <Text style={styles.activityTitle}>
        {session.location}
        {session.activity_detail ? ` – ${session.activity_detail}` : ''}
      </Text>

      {/* Creator info */}
      {session.creator && (
        <View style={styles.creatorRow}>
          {creatorPhotoUrl ? (
            <Image
              source={{ uri: creatorPhotoUrl }}
              style={styles.avatar}
              accessibilityLabel={`${session.creator.name}'s photo`}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {session.creator.name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.creatorName}>
            {session.creator.name} • {session.creator.school} '
            {String(session.creator.graduation_year).slice(-2)}
          </Text>
          {session.creator.vibe_score !== null && session.creator.vibe_score !== undefined && (
            <Text style={styles.vibeScore}>{session.creator.vibe_score}% 😊</Text>
          )}
        </View>
      )}

      {/* Attendee count */}
      {session.attendee_count > 0 && !isOwn && (
        <Text style={styles.attendeeCount}>
          {session.attendee_count} joined
        </Text>
      )}

      {/* Join button */}
      <Button
        title={joinProps.title}
        variant={joinProps.variant}
        size="large"
        disabled={joinProps.disabled}
        onPress={() => !joinProps.disabled && onJoin && onJoin(session.id)}
        style={styles.joinButton}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: Colors.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  categoryName: {
    ...Typography.label,
    flex: 1,
  },
  urgentBadge: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
    flex: 1,
  },
  durationText: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  activityTitle: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    color: Colors.midnight,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: Colors.lightGray,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.electricBlue,
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  creatorName: {
    ...Typography.bodySmall,
    flex: 1,
  },
  vibeScore: {
    ...Typography.bodySmall,
    fontFamily: 'Inter-SemiBold',
    color: Colors.slateGray,
  },
  attendeeCount: {
    ...Typography.caption,
    color: Colors.mediumGray,
    marginBottom: 10,
  },
  joinButton: {
    marginTop: 4,
  },
});
