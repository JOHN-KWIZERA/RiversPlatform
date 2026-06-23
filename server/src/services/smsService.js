const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_API_KEY  = process.env.AFRICASTALKING_API_KEY;
const ENABLED = !!(AT_USERNAME && AT_API_KEY);

let sms = null;

if (ENABLED) {
  try {
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({ username: AT_USERNAME, apiKey: AT_API_KEY });
    sms = at.SMS;
    console.log('Africa\'s Talking SMS: configured.');
  } catch (err) {
    console.warn('Africa\'s Talking: package not installed —', err.message);
  }
} else {
  console.log('Africa\'s Talking SMS: not configured (set AFRICASTALKING_USERNAME + AFRICASTALKING_API_KEY to enable).');
}

/**
 * Send an SMS. Silently no-ops if Africa's Talking is not configured.
 * @param {string|string[]} to  - Phone number(s) in E.164 format, e.g. '+250781234567'
 * @param {string} message      - Text body (max 160 chars for a single segment)
 */
async function sendSms(to, message) {
  if (!sms) return;
  const recipients = Array.isArray(to) ? to : [to];
  try {
    await sms.send({ to: recipients, message, from: process.env.AFRICASTALKING_FROM || 'RIVERS' });
  } catch (err) {
    console.error('SMS send error:', err.message || err);
  }
}

// --- Convenience helpers ---

function toE164(rwPhone) {
  const cleaned = String(rwPhone).replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('250')) return `+${cleaned}`;
  if (cleaned.startsWith('07') || cleaned.startsWith('08')) return `+250${cleaned.slice(1)}`;
  return cleaned;
}

async function notifyDonationReceived({ leaderPhone, donorName, amount, campaignTitle }) {
  if (!leaderPhone) return;
  const body = `RIVERS: ${donorName} donated RWF ${Number(amount).toLocaleString()} to your campaign "${campaignTitle}". Log in to see details.`;
  await sendSms(toE164(leaderPhone), body);
}

async function notifyCampaignApproved({ leaderPhone, campaignTitle }) {
  if (!leaderPhone) return;
  const body = `RIVERS: Great news! Your campaign "${campaignTitle}" has been approved and is now live. Share it to start raising funds.`;
  await sendSms(toE164(leaderPhone), body);
}

async function notifyCampaignRejected({ leaderPhone, campaignTitle, adminNote }) {
  if (!leaderPhone) return;
  const body = `RIVERS: Your campaign "${campaignTitle}" needs revision.${adminNote ? ` Note: ${adminNote}` : ''} Log in to make changes.`;
  await sendSms(toE164(leaderPhone), body);
}

async function notifyMilestone({ leaderPhone, campaignTitle, milestone }) {
  if (!leaderPhone) return;
  const body = `RIVERS: Milestone reached! "${campaignTitle}" is now ${milestone}% funded. Keep spreading the word!`;
  await sendSms(toE164(leaderPhone), body);
}

module.exports = { sendSms, notifyDonationReceived, notifyCampaignApproved, notifyCampaignRejected, notifyMilestone };
