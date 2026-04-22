import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import SessionCard from '../../components/SessionCard';
import Button from '../../components/Button';
import { fetchActiveSessions, joinSession } from '../../api/sessions';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  { id: null, label: 'All', emoji: '' },
  { id: 'gym', label: 'Gym', emoji: '🏋️' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'study', label: 'Study', emoji: '📚' },
];

export default function FeedScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    getLocation();
    loadSessions();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [activeCategory, userLocation]);

  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.warn('Location unavailable:', error);
    }
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel('feed-sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => loadSessions()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_attendees' },
        () => loadSessions()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function loadSessions() {
    try {
      const data = await fetchActiveSessions(
        userLocation?.lat,
        userLocation?.lng,
        activeCategory ? { category: activeCategory } : {}
      );
      setSessions(data);

      // Track which sessions current user has joined
      if (user) {
        const joined = new Set(
          data
            .filter((s) => s.attendees?.some((a) => a.user_id === user.id))
            .map((s) => s.id)
        );
        setJoinedIds(joined);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await getLocation();
    await loadSessions();
  }, [activeCategory, userLocation]);

  async function handleJoin(sessionId) {
    if (joiningId) return;

    setJoiningId(sessionId);
    try {
      await joinSession(sessionId, user.id, profile?.name || 'Someone');
      setJoinedIds((prev) => new Set([...prev, sessionId]));
      await loadSessions();
    } catch (error) {
      if (error.message.includes('full')) {
        Alert.alert('Session Full', 'Sorry, this session is already full!');
      } else if (error.message.includes('time')) {
        Alert.alert(
          'Time Conflict',
          'You already have another session at this time.',
          [
            { text: 'OK' },
            {
              text: 'View My Sessions',
              onPress: () => navigation.navigate('Profile'),
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to join session. Please try again.');
      }
    } finally {
      setJoiningId(null);
    }
  }

  function handleCardPress(session) {
    navigation.navigate('SessionDetail', { session });
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🏋️☕📚</Text>
        <Text style={styles.emptyTitle}>No sessions right now</Text>
        <Text style={styles.emptySubtitle}>Be the first to post!</Text>
        <Button
          title="+ Post Activity"
          onPress={() => navigation.navigate('CategorySelect')}
          size="medium"
          style={styles.emptyButton}
        />
      </View>
    );
  }

  function renderHeader() {
    return (
      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id || 'all'}
            style={[
              styles.filterChip,
              activeCategory === cat.id && styles.filterChipActive,
            ]}
            onPress={() => setActiveCategory(cat.id)}
            accessibilityLabel={`Filter by ${cat.label}`}
            accessibilityState={{ selected: activeCategory === cat.id }}>
            <Text
              style={[
                styles.filterChipText,
                activeCategory === cat.id && styles.filterChipTextActive,
              ]}>
              {cat.emoji ? `${cat.emoji} ${cat.label}` : cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>VENTURE</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.freshGreen} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onJoin={handleJoin}
              onPress={handleCardPress}
              isJoined={joinedIds.has(item.id)}
              userId={user?.id}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={sessions.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.freshGreen}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating post button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CategorySelect')}
        accessibilityLabel="Post a new activity"
        accessibilityRole="button">
        <Text style={styles.fabText}>+ POST</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  topBar: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  logo: {
    ...Typography.h2,
    color: Colors.white,
    letterSpacing: 3,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
  },
  filterChipActive: {
    backgroundColor: Colors.freshGreen,
    borderColor: Colors.freshGreen,
  },
  filterChipText: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
    fontFamily: 'Inter-SemiBold',
  },
  filterChipTextActive: {
    color: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    letterSpacing: 8,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.mediumGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 160,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: Colors.brandPink,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: Colors.midnight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    ...Typography.buttonText,
    color: Colors.white,
    fontSize: 14,
  },
});
