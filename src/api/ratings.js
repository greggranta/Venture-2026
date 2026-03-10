import { supabase } from '../lib/supabase';
import { awardTokens } from './tokens';
import { sendNotification } from './notifications';

/**
 * Submit a rating for a session participant.
 */
export async function submitRating({
  sessionId,
  raterId,
  rateeId,
  bothShowedUp,
  vibeScore, // 'positive' | 'neutral' | 'negative' | null
}) {
  // Validate vibe score only required when both showed up
  const finalVibeScore = bothShowedUp ? vibeScore : null;

  const { data: rating, error } = await supabase
    .from('ratings')
    .insert({
      session_id: sessionId,
      rater_id: raterId,
      ratee_id: rateeId,
      both_showed_up: bothShowedUp,
      vibe_score: finalVibeScore,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('You have already rated this session');
    throw error;
  }

  let tokensEarned = 0;

  if (bothShowedUp) {
    // Rater earns +2 tokens for showing up
    await awardTokens(raterId, 2, 'showed_up', sessionId);
    tokensEarned = 2;

    // Ratee earns +1 token if they got a positive rating
    if (finalVibeScore === 'positive') {
      await awardTokens(rateeId, 1, 'positive_rating', sessionId);

      // Notify ratee of positive rating
      await sendNotification(rateeId, {
        type: 'token_earned',
        title: '😊 Positive rating!',
        message: 'You earned +1 token for a great session',
        session_id: sessionId,
      });
    }
  } else {
    // Handle no-show consequences
    await checkNoShowThreshold(rateeId);
  }

  // Update rater's streak
  await supabase.rpc('update_streak', { input_user_id: raterId });

  return { rating, tokensEarned };
}

/**
 * Get pending ratings for a user (sessions that expired and need rating).
 */
export async function getPendingRatings(userId) {
  // Get expired sessions where user was a participant
  const { data: createdSessions } = await supabase
    .from('sessions')
    .select('*, attendees:session_attendees(user_id, users(id, name, photo_url, school))')
    .eq('created_by', userId)
    .eq('status', 'expired')
    .gt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // last 24hrs

  const { data: joinedSessions } = await supabase
    .from('session_attendees')
    .select('session:sessions(*, creator:users!created_by(id, name, photo_url, school))')
    .eq('user_id', userId)
    .eq('sessions.status', 'expired')
    .gt('sessions.expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const pending = [];

  // Check which ones still need rating
  for (const session of (createdSessions || [])) {
    for (const attendee of (session.attendees || [])) {
      if (attendee.user_id === userId) continue;
      const hasRated = await hasUserRated(userId, attendee.user_id, session.id);
      if (!hasRated) {
        pending.push({
          session,
          rateeId: attendee.user_id,
          ratee: attendee.users,
          isCreator: true,
        });
      }
    }
  }

  for (const j of (joinedSessions || [])) {
    const session = j.session;
    if (!session) continue;
    const hasRated = await hasUserRated(userId, session.created_by, session.id);
    if (!hasRated) {
      pending.push({
        session,
        rateeId: session.created_by,
        ratee: session.creator,
        isCreator: false,
      });
    }
  }

  return pending;
}

/**
 * Check if a user has already rated someone for a given session.
 */
export async function hasUserRated(raterId, rateeId, sessionId) {
  const { data } = await supabase
    .from('ratings')
    .select('id')
    .eq('session_id', sessionId)
    .eq('rater_id', raterId)
    .eq('ratee_id', rateeId)
    .single();

  return !!data;
}

/**
 * Get all ratings received by a user.
 */
export async function getUserRatings(userId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('ratee_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Check and enforce no-show threshold.
 */
async function checkNoShowThreshold(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: noShows } = await supabase
    .from('ratings')
    .select('id')
    .eq('ratee_id', userId)
    .eq('both_showed_up', false)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const noShowCount = (noShows || []).length;

  await supabase.from('users').update({ no_show_count: noShowCount }).eq('id', userId);

  if (noShowCount === 2) {
    await sendNotification(userId, {
      type: 'warning',
      title: '⚠️ No-Show Warning',
      message:
        'You have 2 no-shows in the last 30 days. One more and your account will be suspended for 1 week.',
    });
  } else if (noShowCount >= 3) {
    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + 7);

    await supabase
      .from('users')
      .update({ suspended_until: suspendUntil.toISOString() })
      .eq('id', userId);

    await sendNotification(userId, {
      type: 'suspension',
      title: '🚫 Account Suspended',
      message: `Your account is suspended until ${suspendUntil.toLocaleDateString()} due to repeated no-shows.`,
    });
  }
}
