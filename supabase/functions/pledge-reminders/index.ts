import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, emailShell, sendEmail, fmtRWF } from '../_shared/email.ts';

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL      = Deno.env.get('FROM_EMAIL') ?? 'noreply@rivers.rw';
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL        = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://rivers-platform.vercel.app';

const DAY = 86400000;
const CYCLE_DAYS = 25; // don't re-send the same kind within a pledge cycle

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dueSoonStr = new Date(today.getTime() + 3 * DAY).toISOString().slice(0, 10);
    const lapsedStr = new Date(today.getTime() - 2 * DAY).toISOString().slice(0, 10);
    const cycleAgo = new Date(today.getTime() - CYCLE_DAYS * DAY).toISOString();

    // Active pledges + sponsor + campaign
    const { data: pledges, error } = await supabase
      .from('recurring_donations')
      .select('id, amount, currency, next_due_date, sponsor_id, campaign_id, users:sponsor_id(email, full_name, email_opt_out, unsubscribe_token), campaigns:campaign_id(title)')
      .eq('status', 'active')
      .not('next_due_date', 'is', null);
    if (error) throw error;

    let sent = 0, skipped = 0;

    for (const p of pledges ?? []) {
      const user = p.users;
      if (!user?.email || user.email_opt_out) { skipped++; continue; }

      const due = p.next_due_date as string;
      let kind: 'pledge_reminder' | 'pledge_lapsed' | null = null;
      if (due >= todayStr && due <= dueSoonStr) kind = 'pledge_reminder';
      else if (due < lapsedStr)                 kind = 'pledge_lapsed';
      if (!kind) continue;

      // De-dupe within the cycle
      const { count } = await supabase
        .from('email_log')
        .select('id', { count: 'exact', head: true })
        .eq('kind', kind).eq('ref_id', p.id).gte('created_at', cycleAgo);
      if ((count ?? 0) > 0) { skipped++; continue; }

      const campaignTitle = p.campaigns?.title ?? 'your campaign';
      const amount = fmtRWF(p.amount);
      const recurringLink = `${SITE_URL}/dashboard/recurring`;
      const unsubUrl = `${SITE_URL}/unsubscribe/${user.unsubscribe_token}`;

      const isReminder = kind === 'pledge_reminder';
      const subject = isReminder
        ? `Reminder: your ${amount} pledge is due soon`
        : `Continue your pledge to ${campaignTitle}`;
      const heading = isReminder ? `Your pledge is coming up` : `We miss your support`;
      const bodyHtml = isReminder
        ? `<p>Hi ${user.full_name || 'there'}, this is a friendly reminder that your <strong>${amount}</strong> pledge to <strong>${campaignTitle}</strong> is due on <strong>${due}</strong>.</p>
           <p>Please make sure you have the funds ready and complete your contribution via Mobile Money when you're ready.</p>`
        : `<p>Hi ${user.full_name || 'there'}, your <strong>${amount}</strong> pledge to <strong>${campaignTitle}</strong> (due ${due}) hasn't been completed yet.</p>
           <p>The community is counting on steady support — you can continue your pledge any time.</p>`;

      const html = emailShell({
        heading, bodyHtml,
        ctaLabel: isReminder ? 'Complete my pledge' : 'Continue giving',
        ctaUrl: recurringLink,
        unsubscribeUrl: unsubUrl,
      });

      const ok = await sendEmail({ resendKey: RESEND_API_KEY, from: FROM_EMAIL, to: user.email, subject, html });

      // In-app notification (reuse existing notifications table)
      await supabase.from('notifications').insert({
        user_id: p.sponsor_id,
        type: 'info',
        title: isReminder ? 'Pledge due soon' : 'Continue your pledge',
        body: isReminder
          ? `Your ${amount} pledge to "${campaignTitle}" is due ${due}.`
          : `Your ${amount} pledge to "${campaignTitle}" is still open.`,
        link: '/dashboard/recurring',
      });

      await supabase.from('email_log').insert({
        user_id: p.sponsor_id, kind, ref_id: p.id, status: ok ? 'sent' : 'failed',
      });

      if (ok) sent++; else skipped++;
    }

    return json({ ok: true, sent, skipped, considered: pledges?.length ?? 0 });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
