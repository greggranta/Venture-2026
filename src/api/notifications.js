import { supabase } from '../lib/supabase';

/**
 * Send an in-app notification to a user.
 */
export async function sendNotification(userId, { type, title, message, session_id = null }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    session_id,
  });

  if (error) console.error('Failed to send notification:', error);
}

/**
 * Fetch all notifications for a user, newest first.
 */
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

/**
 * Get count of unread notifications.
 */
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count || 0;
}

/**
 * Get notification type icon/emoji.
 */
export function getNotificationIcon(type) {
  const icons = {
    session_join: '🎉',
    reminder: '⏰',
    rating_request: '⭐',
    streak_update: '🔥',
    token_earned: '⚡',
    warning: '⚠️',
    suspension: '🚫',
  };
  return icons[type] || '📣';
}
