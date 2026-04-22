import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationIcon,
} from '../../api/notifications';
import { getPendingRatings } from '../../api/ratings';
import { supabase } from '../../lib/supabase';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { markRead } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    if (!user) return;

    // Real-time: pick up new notifications without pull-to-refresh
    const channel = supabase
      .channel(`notifications-screen-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { loadData(); }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  async function loadData() {
    if (!user) return;
    const [notifs, ratings] = await Promise.all([
      fetchNotifications(user.id),
      getPendingRatings(user.id),
    ]);
    setNotifications(notifs);
    setPendingRatings(ratings);
    markRead(); // clear the badge once we've loaded the screen
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  async function handleNotificationPress(notification) {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    if (notification.type === 'rating_request' && notification.session_id) {
      // Find pending rating for this session
      const pending = pendingRatings.find((r) => r.session.id === notification.session_id);
      if (pending) {
        navigation.navigate('Rating', {
          session: pending.session,
          rateeId: pending.rateeId,
          ratee: pending.ratee,
        });
      }
    } else if (notification.session_id) {
      navigation.navigate('SessionDetail', { session: { id: notification.session_id } });
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markRead();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  function renderNotification({ item: notif }) {
    return (
      <TouchableOpacity
        style={[styles.notifItem, !notif.read && styles.notifUnread]}
        onPress={() => handleNotificationPress(notif)}
        activeOpacity={0.85}>
        <View style={styles.notifIconContainer}>
          <Text style={styles.notifIcon}>{getNotificationIcon(notif.type)}</Text>
          {!notif.read && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !notif.read && styles.notifTitleBold]}>
            {notif.title}
          </Text>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {notif.message}
          </Text>
          <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
        </View>
        {notif.type === 'rating_request' && (
          <Text style={styles.rateNow}>Rate Now →</Text>
        )}
      </TouchableOpacity>
    );
  }

  function renderPendingRating({ item: pending }) {
    return (
      <TouchableOpacity
        style={styles.pendingRatingCard}
        onPress={() =>
          navigation.navigate('Rating', {
            session: pending.session,
            rateeId: pending.rateeId,
            ratee: pending.ratee,
          })
        }>
        <Text style={styles.pendingRatingTitle}>
          ⭐ Rate your{' '}
          {pending.session.category} session
        </Text>
        <Text style={styles.pendingRatingSubtitle}>
          with {pending.ratee?.name} at {pending.session.location}
        </Text>
        <Text style={styles.pendingRatingAction}>Tap to rate →</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListHeaderComponent={
          pendingRatings.length > 0 ? (
            <View>
              <Text style={styles.sectionHeader}>Pending Ratings</Text>
              {pendingRatings.map((r, i) => (
                <View key={i}>{renderPendingRating({ item: r })}</View>
              ))}
              <Text style={styles.sectionHeader}>Recent Activity</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              You'll see updates here when someone joins your session or you need to rate.
            </Text>
          </View>
        }
        contentContainerStyle={
          notifications.length === 0 && pendingRatings.length === 0 ? { flex: 1 } : {}
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.freshGreen}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  title: {
    ...Typography.h3,
  },
  markAllRead: {
    ...Typography.bodySmall,
    color: Colors.freshGreen,
  },
  sectionHeader: {
    ...Typography.label,
    color: Colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.lightGray,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    alignItems: 'flex-start',
  },
  notifUnread: {
    backgroundColor: Colors.lightGray,
  },
  notifIconContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.freshGreen,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
    marginBottom: 2,
  },
  notifTitleBold: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.midnight,
  },
  notifMessage: {
    ...Typography.caption,
    color: Colors.mediumGray,
    marginBottom: 4,
    lineHeight: 18,
  },
  notifTime: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  rateNow: {
    ...Typography.caption,
    color: Colors.freshGreen,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    alignSelf: 'center',
  },
  pendingRatingCard: {
    margin: 12,
    padding: 16,
    backgroundColor: Colors.electricBlue,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.brandPink,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pendingRatingTitle: {
    ...Typography.body,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  pendingRatingSubtitle: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
    marginBottom: 8,
  },
  pendingRatingAction: {
    ...Typography.bodySmall,
    color: Colors.freshGreen,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
