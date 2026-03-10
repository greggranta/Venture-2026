import { supabase } from '../lib/supabase';
import { calculateDistance } from '../utils/distance';
import { awardTokens } from './tokens';
import { sendNotification } from './notifications';

/**
 * Fetch all active sessions with distance calculation.
 */
export async function fetchActiveSessions(userLat, userLng, filters = {}) {
  let query = supabase
    .from('sessions')
    .select(`
      *,
      creator:users!created_by(id, name, school, graduation_year, photo_url),
      attendees:session_attendees(user_id)
    `)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get vibe scores for creators
  const sessions = await Promise.all(
    (data || []).map(async (session) => {
      let vibeScore = null;
      if (session.creator?.id) {
        const { data: vs } = await supabase.rpc('get_vibe_score', {
          input_user_id: session.creator.id,
        });
        vibeScore = vs;
      }

      const distance =
        userLat && userLng
          ? calculateDistance(userLat, userLng, session.location_lat, session.location_lng)
          : null;

      return {
        ...session,
        distance,
        attendee_count: session.attendees?.length || 0,
        creator: session.creator
          ? { ...session.creator, vibe_score: vibeScore }
          : null,
      };
    })
  );

  // Sort by distance, then by start time
  return sessions.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      const distDiff = parseFloat(a.distance) - parseFloat(b.distance);
      if (Math.abs(distDiff) > 0.1) return distDiff;
    }
    return new Date(a.start_time) - new Date(b.start_time);
  });
}

/**
 * Get a single session by ID.
 */
export async function getSession(sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      creator:users!created_by(id, name, school, graduation_year, photo_url),
      attendees:session_attendees(user_id, users(id, name, school, graduation_year, photo_url))
    `)
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new activity session.
 */
export async function createSession({
  userId,
  category,
  location,
  locationLat,
  locationLng,
  startTime,
  duration,
  activityDetail,
  lookingFor,
}) {
  // Check for time conflicts
  const { data: hasConflict, error: conflictError } = await supabase.rpc('has_time_conflict', {
    input_user_id: userId,
    input_start_time: startTime,
    input_duration: duration,
  });

  if (conflictError) throw conflictError;
  if (hasConflict) throw new Error('You already have a session at this time');

  const expiresAt = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      created_by: userId,
      category,
      location,
      location_lat: locationLat,
      location_lng: locationLng,
      start_time: startTime,
      duration,
      activity_detail: activityDetail || null,
      looking_for: lookingFor,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Join an active session (one-tap join).
 */
export async function joinSession(sessionId, userId, userName) {
  // Get session details
  const session = await getSession(sessionId);

  if (session.status !== 'active') {
    throw new Error('This session is no longer active');
  }

  if (session.created_by === userId) {
    throw new Error('You cannot join your own session');
  }

  // Check capacity
  if (session.attendee_count >= session.looking_for) {
    throw new Error('This session is already full');
  }

  // Check for time conflicts
  const { data: hasConflict } = await supabase.rpc('has_time_conflict', {
    input_user_id: userId,
    input_start_time: session.start_time,
    input_duration: session.duration,
    exclude_session_id: sessionId,
  });

  if (hasConflict) {
    throw new Error('You already have a session at this time');
  }

  // Add to attendees
  const { error } = await supabase
    .from('session_attendees')
    .insert({ session_id: sessionId, user_id: userId });

  if (error) {
    if (error.code === '23505') throw new Error('You have already joined this session');
    throw error;
  }

  // Award creator +3 tokens for having someone join
  await awardTokens(session.created_by, 3, 'session_joined', sessionId);

  // Notify creator
  await sendNotification(session.created_by, {
    type: 'session_join',
    title: 'Someone joined your session! 🎉',
    message: `${userName} is joining your ${session.category} session at ${session.location}`,
    session_id: sessionId,
  });

  // Schedule reminders (15 min before) for both users
  const reminderTime = new Date(session.start_time);
  reminderTime.setMinutes(reminderTime.getMinutes() - 15);

  if (reminderTime > new Date()) {
    await scheduleReminder(reminderTime, [userId, session.created_by], session);
  }

  return { success: true };
}

/**
 * Cancel a session (creator only).
 */
export async function cancelSession(sessionId, userId) {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)
    .eq('created_by', userId);

  if (error) throw error;
  return { success: true };
}

/**
 * Unjoin a session (attendee only, must be > 30min before start).
 */
export async function unjoinSession(sessionId, userId) {
  const session = await getSession(sessionId);
  const startTime = new Date(session.start_time);
  const now = new Date();
  const minutesUntilStart = (startTime - now) / 60000;

  if (minutesUntilStart < 30) {
    throw new Error('Cannot unjoin a session within 30 minutes of the start time');
  }

  const { error } = await supabase
    .from('session_attendees')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}

/**
 * Get sessions for a specific user (created or joined).
 */
export async function getUserSessions(userId, status = 'active') {
  const { data: created, error: e1 } = await supabase
    .from('sessions')
    .select('*')
    .eq('created_by', userId)
    .eq('status', status)
    .order('start_time', { ascending: false });

  const { data: joined, error: e2 } = await supabase
    .from('session_attendees')
    .select('session:sessions(*)')
    .eq('user_id', userId)
    .eq('sessions.status', status);

  if (e1) throw e1;
  if (e2) throw e2;

  const joinedSessions = (joined || [])
    .map((j) => j.session)
    .filter((s) => s?.status === status);

  const all = [...(created || []), ...joinedSessions];
  all.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  return all;
}

/**
 * Schedule a reminder notification for session participants.
 */
async function scheduleReminder(reminderTime, userIds, session) {
  const categoryEmojis = { gym: '🏋️', coffee: '☕', study: '📚' };
  const emoji = categoryEmojis[session.category] || '';

  for (const userId of userIds) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'reminder',
      title: `${emoji} Your ${session.category} session starts in 15 min!`,
      message: `Head to ${session.location} now`,
      session_id: session.id,
      send_at: reminderTime.toISOString(),
    });
  }
}
