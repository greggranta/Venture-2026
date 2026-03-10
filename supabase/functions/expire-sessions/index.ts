import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const now = new Date().toISOString();

    // Find all active sessions that have expired
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('sessions')
      .select('*, session_attendees(user_id)')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (fetchError) throw fetchError;

    if (!expiredSessions || expiredSessions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, expired: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Update session status to expired
    const sessionIds = expiredSessions.map((s: any) => s.id);
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'expired' })
      .in('id', sessionIds);

    if (updateError) throw updateError;

    // Trigger rating prompts for all expired sessions
    for (const session of expiredSessions) {
      await triggerRatingPrompts(supabase, session);
    }

    return new Response(
      JSON.stringify({ success: true, expired: expiredSessions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

async function triggerRatingPrompts(supabase: any, session: any) {
  const attendees = session.session_attendees || [];
  const participants = [
    session.created_by,
    ...attendees.map((a: any) => a.user_id),
  ];

  // Only trigger ratings if there were attendees (someone actually joined)
  if (participants.length < 2) return;

  // Schedule rating request 30 minutes after session expires
  const ratingTime = new Date(session.expires_at);
  ratingTime.setMinutes(ratingTime.getMinutes() + 30);

  const categoryEmojis: Record<string, string> = {
    gym: '🏋️',
    coffee: '☕',
    study: '📚',
  };

  for (const userId of participants) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'rating_request',
        title: 'How was your session?',
        message: `Rate your ${categoryEmojis[session.category] || ''} ${session.category} session at ${session.location}`,
        session_id: session.id,
        send_at: ratingTime.toISOString(),
      });

    if (error) {
      console.error(`Failed to create rating notification for user ${userId}:`, error);
    }
  }
}
