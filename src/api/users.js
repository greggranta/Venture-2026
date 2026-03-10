import { supabase } from '../lib/supabase';

/**
 * Create or update user profile after email verification.
 */
export async function createProfile({
  userId,
  email,
  name,
  school,
  graduationYear,
  photoFile,
  bio,
}) {
  let photoUrl = null;

  if (photoFile) {
    const ext = photoFile.uri.split('.').pop() || 'jpg';
    const photoPath = `${userId}/${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri: photoFile.uri,
      name: `photo.${ext}`,
      type: `image/${ext}`,
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(photoPath, formData, { upsert: true });

    if (uploadError) throw uploadError;
    photoUrl = uploadData.path;
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      name,
      school,
      graduation_year: graduationYear,
      photo_url: photoUrl || `https://picsum.photos/seed/${userId}/200`,
      bio: bio || null,
      verified: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a user's full profile with computed fields.
 */
export async function getUserProfile(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  const [
    { data: vibeScore },
    { data: activityCounts },
    { data: tokenBalance },
    { data: streak },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.rpc('get_vibe_score', { input_user_id: userId }),
    supabase.rpc('get_activity_counts', { input_user_id: userId }),
    supabase.rpc('get_token_balance', { input_user_id: userId }),
    supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),
    supabase
      .from('sessions')
      .select('id, category, location, start_time, status')
      .or(`created_by.eq.${userId}`)
      .in('status', ['expired', 'active'])
      .order('start_time', { ascending: false })
      .limit(5),
  ]);

  // Get rating counts
  const { count: totalMeetups } = await supabase
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('ratee_id', userId)
    .eq('both_showed_up', true);

  return {
    ...user,
    vibe_score: vibeScore,
    activity_counts: activityCounts || { gym: 0, coffee: 0, study: 0 },
    token_balance: tokenBalance || 0,
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    total_meetups: totalMeetups || 0,
    recent_sessions: recentSessions || [],
  };
}

/**
 * Update user profile.
 */
export async function updateProfile(userId, { name, graduationYear, bio, photoFile }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (graduationYear !== undefined) updates.graduation_year = graduationYear;
  if (bio !== undefined) updates.bio = bio || null;

  if (photoFile) {
    const ext = photoFile.uri.split('.').pop() || 'jpg';
    const photoPath = `${userId}/${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri: photoFile.uri,
      name: `photo.${ext}`,
      type: `image/${ext}`,
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(photoPath, formData, { upsert: true });

    if (uploadError) throw uploadError;
    updates.photo_url = uploadData.path;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get photo URL from storage path.
 */
export function getPhotoUrl(photoPath) {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;

  const { data } = supabase.storage.from('profile-photos').getPublicUrl(photoPath);
  return data?.publicUrl || null;
}

/**
 * Check if user account is currently suspended.
 */
export function isUserSuspended(user) {
  if (!user?.suspended_until) return false;
  return new Date(user.suspended_until) > new Date();
}
