import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getSession, joinSession, cancelSession } from '../../api/sessions';
import { getPhotoUrl } from '../../api/users';
import { getCategoryEmoji, getCategoryName } from '../../utils/school';
import { formatDateTime, formatDuration, getTimeDisplay, getUrgencyColor } from '../../utils/time';
import { formatDistance } from '../../utils/distance';

export default function SessionDetailScreen({ route, navigation }) {
  const { session: initialSession } = route.params;
  const { user, profile } = useAuth();
  const [session, setSession] = useState(initialSession);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCreator = session.created_by === user?.id;
  const isAttendee = session.attendees?.some((a) => a.user_id === user?.id);
  const isFull = (session.attendee_count || 0) >= session.looking_for;

  useEffect(() => {
    refreshSession();
  }, []);

  async function refreshSession() {
    try {
      const fresh = await getSession(session.id);
      setSession(fresh);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  }

  async function handleJoin() {
    setJoining(true);
    try {
      await joinSession(session.id, user.id, profile?.name || 'Someone');
      await refreshSession();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join session.');
    } finally {
      setJoining(false);
    }
  }

  async function handleCancel() {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session? Attendees will be notified.',
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelSession(session.id, user.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel session.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

  function openMaps() {
    const lat = session.location_lat;
    const lng = session.location_lng;
    const label = encodeURIComponent(session.location);
    const url = `https://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
    Linking.openURL(url);
  }

  const urgencyColor = getUrgencyColor(session.start_time);
  const creatorPhoto = getPhotoUrl(session.creator?.photo_url);

  function renderJoinButton() {
    if (isCreator) {
      return (
        <Button
          title="Cancel Session"
          variant="danger"
          size="large"
          onPress={handleCancel}
          loading={cancelling}
        />
      );
    }
    if (isAttendee) {
      return (
        <Button
          title="YOU'RE GOING ✓"
          variant="success"
          size="large"
          disabled
        />
      );
    }
    if (isFull) {
      return <Button title="FULL" variant="ghost" size="large" disabled />;
    }
    return (
      <Button
        title="I'M THERE"
        variant="primary"
        size="large"
        onPress={handleJoin}
        loading={joining}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: urgencyColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(session.category)}</Text>
            <Text style={[styles.categoryName, { color: urgencyColor }]}>
              {getCategoryName(session.category)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Activity info */}
          <Text style={styles.activityTitle}>
            {session.location}
            {session.activity_detail ? ` – ${session.activity_detail}` : ''}
          </Text>
          <Text style={styles.timeText}>{formatDateTime(session.start_time)}</Text>
          <Text style={styles.durationText}>{formatDuration(session.duration)}</Text>
          <Text style={[styles.statusText, { color: urgencyColor }]}>
            {getTimeDisplay(session.start_time)}
          </Text>

          {/* Creator */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Posted by</Text>
            <TouchableOpacity
              style={styles.personRow}
              onPress={() => navigation.navigate('UserProfile', { userId: session.created_by })}>
              {creatorPhoto ? (
                <Image source={{ uri: creatorPhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {session.creator?.name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{session.creator?.name}</Text>
                <Text style={styles.personMeta}>
                  {session.creator?.school} '
                  {String(session.creator?.graduation_year || '').slice(-2)}
                </Text>
              </View>
              {session.creator?.vibe_score !== undefined && session.creator?.vibe_score !== null && (
                <Text style={styles.vibeScore}>{session.creator.vibe_score}% 😊</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Attendees */}
          {session.attendees && session.attendees.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Going ({session.attendees.length}/{session.looking_for})
              </Text>
              {session.attendees.map((attendee) => {
                const attendeeUser = attendee.users || attendee;
                const photo = getPhotoUrl(attendeeUser?.photo_url);
                return (
                  <TouchableOpacity
                    key={attendee.user_id}
                    style={styles.personRow}
                    onPress={() => navigation.navigate('UserProfile', { userId: attendee.user_id })}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitial}>
                          {attendeeUser?.name?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>
                        {attendee.user_id === user?.id ? 'You' : attendeeUser?.name}
                      </Text>
                      {attendeeUser?.school && (
                        <Text style={styles.personMeta}>
                          {attendeeUser.school} '{String(attendeeUser.graduation_year || '').slice(-2)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Looking for */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Looking for</Text>
            <Text style={styles.lookingFor}>
              {session.looking_for === 1
                ? '1 person'
                : `${session.looking_for} people`}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <TouchableOpacity style={styles.locationRow} onPress={openMaps}>
              <View>
                <Text style={styles.locationName}>📍 {session.location}</Text>
                {session.distance && (
                  <Text style={styles.distanceText}>
                    {formatDistance(session.distance)} away
                  </Text>
                )}
              </View>
              <Text style={styles.mapsLink}>Open Maps →</Text>
            </TouchableOpacity>
          </View>

          {/* Reminder */}
          {isAttendee && (
            <View style={styles.reminderBox}>
              <Text style={styles.reminderText}>
                ⏰ You'll get a reminder 15 minutes before the session
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        {renderJoinButton()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: 16,
    borderBottomWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
  },
  backBtnText: {
    ...Typography.body,
    color: Colors.electricBlue,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  categoryName: {
    ...Typography.h3,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  activityTitle: {
    ...Typography.h2,
    marginBottom: 8,
  },
  timeText: {
    ...Typography.body,
    color: Colors.slateGray,
    marginBottom: 4,
  },
  durationText: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
    marginBottom: 4,
  },
  statusText: {
    ...Typography.label,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.mediumGray,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: Colors.lightGray,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.electricBlue,
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
  },
  personMeta: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  vibeScore: {
    ...Typography.bodySmall,
    fontFamily: 'Inter-SemiBold',
  },
  lookingFor: {
    ...Typography.body,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationName: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  distanceText: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  mapsLink: {
    ...Typography.bodySmall,
    color: Colors.electricBlue,
  },
  reminderBox: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  reminderText: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
    textAlign: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
});
