import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, emailShell, sendEmail } from '../_shared/email.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'noreply@rivers.rw';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL       = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://rivers-platform.vercel.app';

const DAY = 86400000;
const LOOKBACK_DAYS = 3;   // consider intents from the last 3 days
const COOLDOWN_DAYS = 14;  // don't nudge the same campaign more than once per 2 weeks

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = Date.now();
    const since = new Date(now - LOOKBACK_DAYS * DAY).toISOString();
    const cooldownAgo = new Date(now - COOLDOWN_DAYS * DAY).toISOString();

    // Sponsors who started a donation recently.
    const { data: started, error } = await supabase
      .from('sponsor_activity')
      .select('sponsor_id, campaign_id, created_at')
      .eq('event', 'donation_started')
      .gte('created_at', since)
      .not('campaign_id', 'is', null);
    if (error) throw error;

    // De-dupe to unique (sponsor, campaign) pairs.
    const pairs = new Map<string, { sponsor_id: string; campaign_id: string }>();
    for (const r of started ?? []) {
      pairs.set(`${r.sponsor_id}:${r.campaign_id}`, { sponsor_id: r.sponsor_id, campaign_id: r.campaign_id });
    }

    let sent = 0, skipped = 0;

    for (const { sponsor_id, campaign_id } of pairs.values()) {
      // Completed that campaign already? skip.
      const { count: done } = await supabase
        .from('donations')
        .select('id', { count: 'exact', head: true })
        .eq('sponsor_id', sponsor_id).eq('campaign_id', campaign_id).eq('status', 'completed');
      if ((done ?? 0) > 0) { skipped++; continue; }

      // Nudged recently? skip.
      const { count: nudged } = await supabase
        .from('email_log')
        .select('id', { count: 'exact', head: true })
        .eq('kind', 'abandoned_nudge').eq('ref_id', campaign_id)
        .eq('user_id', sponsor_id).gte('created_at', cooldownAgo);
      if ((nudged ?? 0) > 0) { skipped++; continue; }

      const { data: user } = await supabase
        .from('users').select('email, full_name, email_opt_out, unsubscribe_token')
        .eq('id', sponsor_id).single();
      if (!user?.email || user.email_opt_out) { skipped++; continue; }

      const { data: campaign } = await supabase
        .from('campaigns').select('title').eq('id', campaign_id).single();
      const title = campaign?.title ?? 'a campaign you viewed';

      const html = emailShell({
        heading: 'You were almost there',
        bodyHtml: `<p>Hi ${user.full_name || 'there'}, you started a donation to <strong>${title}</strong> but didn't finish.</p>
                   <p>The community still needs your support — it only takes a moment to complete your gift.</p>`,
        ctaLabel: 'Finish my donation',
        ctaUrl: `${SITE_URL}/dashboard/campaigns/${campaign_id}`,
        unsubscribeUrl: `${SITE_URL}/unsubscribe/${user.unsubscribe_token}`,
      });

      const ok = await sendEmail({ resendKey: RESEND_API_KEY, from: FROM_EMAIL, to: user.email, subject: `Complete your gift to ${title}`, html });

      await supabase.from('notifications').insert({
        user_id: sponsor_id, type: 'info',
        title: 'Complete your donation',
        body: `You started a donation to "${title}" — finish it any time.`,
        link: `/dashboard/campaigns/${campaign_id}`,
      });

      await supabase.from('email_log').insert({
        user_id: sponsor_id, kind: 'abandoned_nudge', ref_id: campaign_id, status: ok ? 'sent' : 'failed',
      });

      if (ok) sent++; else skipped++;
    }

    return json({ ok: true, sent, skipped, pairs: pairs.size });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
