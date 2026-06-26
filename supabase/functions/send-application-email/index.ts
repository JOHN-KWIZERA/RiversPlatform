import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL') ?? 'noreply@rivers.rw';
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const { applicantId, opportunityId, status } = await req.json();
    if (!applicantId || !status) throw new Error('Missing required fields');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    // Fetch applicant email + name
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', applicantId)
      .single();

    // Fetch opportunity title
    const { data: opp } = await supabase
      .from('opportunities')
      .select('title')
      .eq('id', opportunityId)
      .single();

    if (!user?.email) throw new Error('Applicant not found');

    const isAccepted = status === 'accepted';
    const subject    = isAccepted
      ? `🎉 You've been accepted — ${opp?.title}`
      : `Application update — ${opp?.title}`;

    const html = isAccepted ? `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
        <div style="background:#00684A;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:24px">
          <span style="color:#00ED64;font-weight:900;font-size:16px;letter-spacing:-0.5px">RIVERS</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;margin:0 0 8px">Congratulations, ${user.full_name}! 🎉</h1>
        <p style="font-size:15px;color:#4b5563;margin:0 0 24px">
          Your application for <strong>${opp?.title}</strong> has been <strong style="color:#00684A">accepted</strong>.
          The organizer will be in touch with next steps.
        </p>
        <a href="${SUPABASE_URL.replace('/rest/v1','')}/dashboard/opportunities/${opportunityId}"
           style="display:inline-block;background:#00684A;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">
          View Opportunity
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:32px">Rivers Impact Platform · Kigali, Rwanda</p>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
        <div style="background:#00684A;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:24px">
          <span style="color:#00ED64;font-weight:900;font-size:16px;letter-spacing:-0.5px">RIVERS</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;margin:0 0 8px">Application Update</h1>
        <p style="font-size:15px;color:#4b5563;margin:0 0 24px">
          Hi ${user.full_name}, thank you for applying to <strong>${opp?.title}</strong>.
          Unfortunately your application was not selected for this opportunity.
          We encourage you to explore other opportunities on the platform.
        </p>
        <a href="${SUPABASE_URL.replace('/rest/v1','')}/dashboard/opportunities"
           style="display:inline-block;background:#1a1a2e;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">
          Browse Opportunities
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:32px">Rivers Impact Platform · Kigali, Rwanda</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Rivers Platform <${FROM_EMAIL}>`, to: [user.email], subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      // Don't throw — email is best-effort, in-app notification already exists
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});
