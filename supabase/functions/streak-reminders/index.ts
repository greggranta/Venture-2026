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

    // Get current week string
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const currentWeek = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;

    // Find users with active streaks (>0) who haven't been active this week
    const { data: usersAtRisk, error } = await supabase
      .from('streaks')
      .select('user_id, current_streak, last_activity_week')
      .neq('last_activity_week', currentWeek)
      .gt('current_streak', 0);

    if (error) throw error;

    let notificationsSent = 0;

    for (const user of (usersAtRisk || [])) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.user_id,
          type: 'streak_update',
          title: `Don't break your ${user.current_streak}-week streak! 🔥`,
          message: 'Post or join a session before midnight to keep your streak going.',
        });

      if (!notifError) notificationsSent++;
    }

    return new Response(
      JSON.stringify({ success: true, notificationsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
