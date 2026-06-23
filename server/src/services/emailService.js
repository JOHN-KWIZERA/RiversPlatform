const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'RIVERS Platform <noreply@rivers.rw>';

function passwordResetHtml(fullName, resetLink) {
  const name = fullName ? fullName.split(' ')[0] : 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your RIVERS password</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#001E2B;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>
                  <td style="background:#00684A;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:15px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">R</td>
                  <td style="padding-left:10px;font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;vertical-align:middle;">RIVERS</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8e9eb;border-right:1px solid #e8e9eb;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#001E2B;letter-spacing:-0.3px;">Reset your password</p>
              <p style="margin:0 0 28px;font-size:15px;color:#5c6370;line-height:1.6;">Hi ${name}, we received a request to reset the password for your RIVERS account. Click the button below to choose a new one.</p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#00684A;border-radius:8px;">
                    <a href="${resetLink}" target="_blank"
                      style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#8a8f98;line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 28px;font-size:12px;color:#00684A;word-break:break-all;">
                <a href="${resetLink}" style="color:#00684A;">${resetLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #f0f1f3;margin:0 0 24px;" />

              <p style="margin:0;font-size:13px;color:#8a8f98;line-height:1.6;">
                This link expires in <strong style="color:#5c6370;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e8e9eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#adb1b8;">
                © 2025 RIVERS Platform · Rwanda Community Fundraising
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendPasswordReset(email, resetLink, fullName) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your RIVERS password',
    html: passwordResetHtml(fullName, resetLink),
  });
}

module.exports = { sendPasswordReset };
