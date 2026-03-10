import { supabase } from '../lib/supabase';

/**
 * Award tokens to a user.
 */
export async function awardTokens(userId, amount, reason, sessionId = null) {
  const { error } = await supabase.from('tokens').insert({
    user_id: userId,
    amount,
    reason,
    session_id: sessionId,
  });

  if (error) throw error;
}

/**
 * Get total token balance for a user.
 */
export async function getTokenBalance(userId) {
  const { data, error } = await supabase.rpc('get_token_balance', {
    input_user_id: userId,
  });

  if (error) throw error;
  return data || 0;
}

/**
 * Get token history for a user (last N transactions).
 */
export async function getTokenHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*, session:sessions(category, location)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get a human-readable label for a token reason.
 */
export function getTokenReasonLabel(reason) {
  const labels = {
    showed_up: 'Showed up to session',
    positive_rating: 'Received a 😊 rating',
    session_joined: 'Someone joined your session',
  };
  return labels[reason] || reason;
}
