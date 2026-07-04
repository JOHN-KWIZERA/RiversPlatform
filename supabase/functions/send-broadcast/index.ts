import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, emailShell, sendEmail } from '../_shared/email.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'noreply@rivers.rw';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY       = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SITE_URL       = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://rivers-platform.vercel.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { broadcastId } = await req.json();
    if (!broadcastId) throw new Error('Missing broadcastId');

    // ── Verify the caller is an admin ──────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const { data: me } = await userClient.from('users').select('role').eq('id', user.id).single();
    if (me?.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    // ── Load broadcast + resolve segment ──────────────────
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: bc, error: bcErr } = await admin
      .from('email_broadcasts').select('*').eq('id', broadcastId).single();
    if (bcErr || !bc) throw new Error('Broadcast not found');
    if (bc.status === 'sent') return json({ ok: true, alreadySent: true, recipientCount: bc.recipient_count });

    await admin.from('email_broadcasts').update({ status: 'sending' }).eq('id', broadcastId);

    let query = admin.from('users')
      .select('id, email, full_name, unsubscribe_token')
      .eq('email_opt_out', false)
      .not('email', 'is', null);
    if (bc.segment && bc.segment !== 'all') query = query.eq('role', bc.segment);
    const { data: recipients } = await query;

    let sent = 0;
    const logRows: Array<Record<string, unknown>> = [];
    for (const r of recipients ?? []) {
      if (!r.email) continue;
      const html = emailShell({
        heading: bc.subject,
        bodyHtml: bc.body_html,
        unsubscribeUrl: `${SITE_URL}/unsubscribe/${r.unsubscribe_token}`,
      });
      const ok = await sendEmail({ resendKey: RESEND_API_KEY, from: FROM_EMAIL, to: r.email, subject: bc.subject, html });
      logRows.push({ user_id: r.id, kind: 'broadcast', ref_id: broadcastId, status: ok ? 'sent' : 'failed' });
      if (ok) sent++;
    }

    if (logRows.length) await admin.from('email_log').insert(logRows);
    await admin.from('email_broadcasts').update({
      status: 'sent', sent_at: new Date().toISOString(), sent_by: user.id, recipient_count: sent,
    }).eq('id', broadcastId);

    return json({ ok: true, recipientCount: sent, considered: recipients?.length ?? 0 });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
