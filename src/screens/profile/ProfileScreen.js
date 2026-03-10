import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, getPhotoUrl } from '../../api/users';
import { getCategoryEmoji } from '../../utils/school';
import { formatDateTime } from '../../utils/time';

export default function ProfileScreen({ route, navigation }) {
  // If viewing another user's profile, userId is passed; otherwise show own
  const { userId: viewUserId } = route?.params || {};
  const { user, profile, signOut } = useAuth();
  const targetUserId = viewUserId || user?.id;
  const isOwnProfile = !viewUserId || viewUserId === user?.id;

  const [profileData, setProfileData] = useState(isOwnProfile ? profile : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [targetUserId]);

  async function loadProfile() {
    if (!targetUserId) return;
    try {
      const data = await getUserProfile(targetUserId);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadProfile();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.electricBlue} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Profile not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} size="small" />
        </View>
      </SafeAreaView>
    );
  }

  const photoUrl = getPhotoUrl(profileData.photo_url);
  const vibeScore = profileData.vibe_score;
  const activities = profileData.activity_counts || { gym: 0, coffee: 0, study: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.electricBlue}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          {!isOwnProfile && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {isOwnProfile ? 'MY PROFILE' : 'PROFILE'}
          </Text>
          {isOwnProfile && (
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{profileData.name?.charAt(0) || '?'}</Text>
            </View>
          )}
          <Text style={styles.name}>{isOwnProfile ? 'You' : profileData.name}</Text>
          <Text style={styles.schoolBadge}>✓ {profileData.school} '{String(profileData.graduation_year || '').slice(-2)}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {vibeScore !== null && vibeScore !== undefined ? `${vibeScore}%` : '—'}
            </Text>
            <Text style={styles.statLabel}>😊 Vibe</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.total_meetups || 0}</Text>
            <Text style={styles.statLabel}>meetups</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🔥 {profileData.current_streak || 0}</Text>
            <Text style={styles.statLabel}>wk streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⚡ {profileData.token_balance || 0}</Text>
            <Text style={styles.statLabel}>tokens</Text>
          </View>
        </View>

        {/* Activity breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.activityGrid}>
            {[
              { cat: 'gym', count: activities.gym || 0 },
              { cat: 'coffee', count: activities.coffee || 0 },
              { cat: 'study', count: activities.study || 0 },
            ].map(({ cat, count }) => (
              <View key={cat} style={styles.activityItem}>
                <Text style={styles.activityEmoji}>{getCategoryEmoji(cat)}</Text>
                <Text style={styles.activityCount}>{count}</Text>
                <Text style={styles.activityLabel}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        {profileData.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{profileData.bio}</Text>
          </View>
        )}

        {/* Recent sessions */}
        {profileData.recent_sessions && profileData.recent_sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {profileData.recent_sessions.map((s, i) => (
              <View key={i} style={styles.recentSessionItem}>
                <Text style={styles.recentEmoji}>{getCategoryEmoji(s.category)}</Text>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentLocation}>{s.location}</Text>
                  <Text style={styles.recentTime}>{formatDateTime(s.start_time)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: s.status === 'expired' ? Colors.freshGreen : Colors.electricBlue },
                  ]}>
                  <Text style={styles.statusBadgeText}>
                    {s.status === 'expired' ? 'Done' : 'Active'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sign out button (own profile only) */}
        {isOwnProfile && (
          <View style={styles.section}>
            <Button
              title="Sign Out"
              variant="ghost"
              onPress={signOut}
              style={styles.signOutButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  backText: {
    ...Typography.body,
    color: Colors.electricBlue,
  },
  headerTitle: {
    ...Typography.h3,
    letterSpacing: 1,
  },
  editText: {
    ...Typography.body,
    color: Colors.electricBlue,
  },
  avatarSection: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.lightGray,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.electricBlue,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.electricBlue,
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: 36,
    fontFamily: 'Inter-Bold',
  },
  name: {
    ...Typography.h2,
    marginBottom: 4,
  },
  schoolBadge: {
    ...Typography.bodySmall,
    color: Colors.electricBlue,
    fontFamily: 'Inter-SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderGray,
    marginVertical: 4,
  },
  statValue: {
    ...Typography.h3,
    fontSize: 17,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  activityCount: {
    ...Typography.h3,
    color: Colors.midnight,
  },
  activityLabel: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textTransform: 'capitalize',
  },
  bioText: {
    ...Typography.body,
    color: Colors.slateGray,
    lineHeight: 22,
  },
  recentSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  recentEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentLocation: {
    ...Typography.bodySmall,
    fontFamily: 'Inter-SemiBold',
  },
  recentTime: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    ...Typography.body,
    color: Colors.mediumGray,
  },
});
