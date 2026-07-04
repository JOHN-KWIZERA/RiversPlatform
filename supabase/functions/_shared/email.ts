// Shared email helpers for RIVERS edge functions.
// Mirrors the branded shell used by send-application-email.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Must include every header supabase-js sends, or the preflight is rejected
  // and the browser reports "Failed to send a request to the Edge Function".
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

interface ShellOpts {
  heading: string;
  bodyHtml: string;      // inner paragraphs / content (already HTML-safe)
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

// Wraps content in the RIVERS-branded HTML frame.
export function emailShell({ heading, bodyHtml, ctaLabel, ctaUrl, unsubscribeUrl }: ShellOpts): string {
  const cta = ctaLabel && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:#00684A;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">${ctaLabel}</a>`
    : '';
  const unsub = unsubscribeUrl
    ? `<p style="font-size:11px;color:#9ca3af;margin-top:24px">Don't want these emails? <a href="${unsubscribeUrl}" style="color:#9ca3af">Unsubscribe</a>.</p>`
    : '';
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <div style="background:#00684A;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:24px">
        <span style="color:#00ED64;font-weight:900;font-size:16px;letter-spacing:-0.5px">RIVERS</span>
      </div>
      <h1 style="font-size:22px;font-weight:900;margin:0 0 8px">${heading}</h1>
      <div style="font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.6">${bodyHtml}</div>
      ${cta}
      <p style="font-size:12px;color:#9ca3af;margin-top:32px">Rivers Impact Platform · Kigali, Rwanda</p>
      ${unsub}
    </div>
  `;
}

// Sends one email via Resend. Returns true on success (best-effort).
export async function sendEmail(opts: {
  resendKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opts.resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Rivers Platform <${opts.from}>`, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('Resend fetch failed:', e);
    return false;
  }
}

export const fmtRWF = (n: number) =>
  new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(Number(n) || 0) + ' RWF';
