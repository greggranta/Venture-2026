import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record?.session_id || !record?.user_id || !record?.message) {
      return new Response('Missing fields', { status: 400 });
    }

    const { session_id, user_id: senderId, message } = record;

    // Get session creator + sender name
    const [{ data: session }, { data: senderUser }] = await Promise.all([
      supabase.from('sessions').select('created_by').eq('id', session_id).single(),
      supabase.from('users').select('name').eq('id', senderId).single(),
    ]);

    if (!session) return new Response('Session not found', { status: 404 });

    // Get all attendees
    const { data: attendees } = await supabase
      .from('session_attendees')
      .select('user_id')
      .eq('session_id', session_id);

    // Build recipient set: creator + attendees, minus the sender
    const recipientIds = new Set<string>();
    recipientIds.add(session.created_by);
    (attendees || []).forEach((a: { user_id: string }) => recipientIds.add(a.user_id));
    recipientIds.delete(senderId);

    if (recipientIds.size === 0) {
      return new Response('No recipients', { status: 200 });
    }

    // Fetch push tokens for recipients from users.fcm_token
    const { data: usersWithTokens } = await supabase
      .from('users')
      .select('fcm_token')
      .in('id', [...recipientIds])
      .not('fcm_token', 'is', null);

    if (!usersWithTokens || usersWithTokens.length === 0) {
      return new Response('No tokens', { status: 200 });
    }

    const senderName = senderUser?.name || 'Someone';
    const truncated = message.length > 80 ? message.slice(0, 77) + '...' : message;

    // Send push notifications via Expo
    const notifications = usersWithTokens.map((u: { fcm_token: string }) => ({
      to: u.fcm_token,
      title: senderName,
      body: truncated,
      data: { type: 'chat', session_id },
      sound: 'default',
      priority: 'high',
    }));

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(notifications),
    });

    const result = await expoRes.json();
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    console.error('chat-notification error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
