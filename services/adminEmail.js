import { createHash } from 'crypto';
import { Resend } from 'resend';

let resend;

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key?.trim()) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(key.trim());
  }
  return resend;
}

function fromAddress() {
  const raw = process.env.EMAIL_FROM?.trim();
  return raw || 'Grovyn <onboarding@resend.dev>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHttpHref(raw) {
  const t = String(raw).trim();
  if (!/^https?:\/\//i.test(t)) return '';
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

/** Public login URL for CTA buttons (same logic as adminUsers.controller loginUrlHint). */
function dashboardLoginHref() {
  const dash = process.env.DASHBOARD_LOGIN_URL?.trim();
  if (dash) return safeHttpHref(dash);
  const front = process.env.FRONTEND_URL?.trim()?.replace(/\/$/, '');
  if (front) return safeHttpHref(`${front}/admin/login`);
  return '';
}

function adminSystemId(email) {
  const h = createHash('sha256')
    .update(String(email).toLowerCase().trim())
    .digest('hex');
  return `ADM-${h.slice(0, 4).toUpperCase()}-${h.slice(4, 8).toUpperCase()}`;
}

const GREEN = '#047857';
const GREEN_DARK = '#064e3b';
const GREEN_SOFT = '#ecfdf5';
const RED_ALERT_BG = '#fef2f2';
const RED_ALERT_BORDER = '#fecaca';
const RED_ALERT_TEXT = '#991b1b';
const AMBER_BG = '#fffbeb';
const AMBER_BORDER = '#fde68a';
const AMBER_TEXT = '#92400e';
const MUTED = '#6b7280';
const CARD_BORDER = '#e5e7eb';

function emailFooterHtml() {
  const year = new Date().getFullYear();
  return `
  <tr>
    <td style="padding:24px 28px 28px;background:#f9fafb;border-top:1px solid ${CARD_BORDER};">
      <p style="margin:0 0 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;color:${MUTED};line-height:1.5;text-align:center;">
        © ${year} Grovyn · Admin notifications · This message was sent automatically; please do not reply.
      </p>
      <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;color:#9ca3af;line-height:1.5;text-align:center;">
        If you did not expect this email, secure your account and contact your administrator.
      </p>
    </td>
  </tr>`;
}

function otpDigitBoxesHtml(otpRaw) {
  const d = String(otpRaw).replace(/\D/g, '').padStart(6, '0').slice(0, 6);
  const cells = [...d].map(
    (ch) =>
      `<td style="width:40px;height:48px;text-align:center;vertical-align:middle;background:#ffffff;border:1px solid #a7f3d0;border-radius:8px;font-family:ui-monospace,Consolas,monospace;font-size:20px;font-weight:700;color:${GREEN};">${escapeHtml(ch)}</td>`,
  );
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;border-collapse:separate;border-spacing:8px;">
    <tr>
      ${cells.slice(0, 3).join('')}
      <td style="width:12px;font-size:18px;color:${MUTED};text-align:center;vertical-align:middle;">–</td>
      ${cells.slice(3).join('')}
    </tr>
  </table>`;
}

function ctaButton(href, label) {
  if (!href) {
    return `<p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;color:${MUTED};text-align:center;">Open your Grovyn admin login page to continue.</p>`;
  }
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
    <tr>
      <td style="border-radius:10px;background:${GREEN_DARK};">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;color:#ffffff;text-decoration:none;text-transform:uppercase;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`;
}

function otpShellHtml({ headline, lead, otp, alertTitle, alertBody, ctaLabel, loginHref }) {
  const href = loginHref || dashboardLoginHref();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid ${CARD_BORDER};">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid ${CARD_BORDER};background:linear-gradient(180deg,${GREEN_SOFT} 0%,#ffffff 100%);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;font-weight:800;letter-spacing:0.14em;color:${GREEN_DARK};">GROVYN</span>
                    <span style="margin-left:10px;font-size:11px;font-weight:600;color:${GREEN};vertical-align:middle;">●</span>
                    <span style="margin-left:6px;font-size:10px;font-weight:600;letter-spacing:0.12em;color:${MUTED};text-transform:uppercase;">Secure terminal</span>
                  </td>
                  <td align="right" style="font-size:14px;color:${MUTED};letter-spacing:2px;">⚙</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;">
              <h1 style="margin:0 0 12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#111827;">
                ${headline}
              </h1>
              <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.55;color:#4b5563;">
                ${lead}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px;">
              ${otpDigitBoxesHtml(otp)}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${RED_ALERT_BG};border:1px solid ${RED_ALERT_BORDER};border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 6px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.1em;color:${RED_ALERT_TEXT};text-transform:uppercase;">
                      ▲ ${alertTitle}
                    </p>
                    <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;line-height:1.5;color:${RED_ALERT_TEXT};">
                      ${alertBody}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;" align="center">
              ${ctaButton(href, ctaLabel)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;" align="center">
              <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;color:${MUTED};">
                Code expires in <strong style="color:#374151;">5 minutes</strong>.
              </p>
            </td>
          </tr>
          ${emailFooterHtml()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeShellHtml({ email, initialPassword, loginUrl }) {
  const safePass = escapeHtml(initialPassword);
  const sysId = escapeHtml(adminSystemId(email));
  const safeEmail = escapeHtml(email);
  const href = safeHttpHref(loginUrl) || dashboardLoginHref();
  const fallbackText =
    loginUrl?.trim() ||
    process.env.DASHBOARD_LOGIN_URL?.trim() ||
    (process.env.FRONTEND_URL?.trim()
      ? `${process.env.FRONTEND_URL.trim().replace(/\/$/, '')}/admin/login`
      : '');
  const hrefDisplay = escapeHtml(fallbackText || 'your Grovyn admin login URL');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid ${CARD_BORDER};">
          <tr>
            <td style="padding:22px 28px;background:${GREEN_DARK};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.18em;color:#a7f3d0;">GROVYN</span>
                    <span style="margin-left:8px;font-size:12px;color:#6ee7b7;">◆</span>
                  </td>
                  <td align="right" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;color:#a7f3d0;text-transform:uppercase;">Admin</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;">
              <h1 style="margin:0 0 12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#111827;">
                Welcome to the team.
              </h1>
              <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.55;color:#4b5563;">
                You have been added as an <strong>administrator</strong> for the Grovyn dashboard. Your access is ready: use the credentials below for your first sign-in, then confirm with the verification code we send to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:6px 8px 6px 0;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid ${CARD_BORDER};border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 6px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;color:${MUTED};text-transform:uppercase;">System ID</p>
                          <p style="margin:0;font-family:ui-monospace,Consolas,monospace;font-size:14px;font-weight:700;color:${GREEN};">${sysId}</p>
                          <p style="margin:8px 0 0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;color:#9ca3af;word-break:break-all;">${safeEmail}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding:6px 0 6px 8px;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GREEN_SOFT};border:1px solid #a7f3d0;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 6px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;color:${GREEN_DARK};text-transform:uppercase;">Temporary password</p>
                          <p style="margin:0;font-family:ui-monospace,Consolas,monospace;font-size:14px;font-weight:700;color:${GREEN};word-break:break-all;line-height:1.4;">${safePass}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${AMBER_BG};border:1px solid ${AMBER_BORDER};border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;line-height:1.5;color:${AMBER_TEXT};">
                      <strong>Security notice:</strong> Change this password after you sign in (use <strong>Forgot password</strong> on the login page if you prefer). Never share these credentials.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px;" align="center">
              ${ctaButton(href, 'Login to dashboard')}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 28px 24px;" align="center">
              <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;color:${MUTED};">
                Trouble with the button? Paste this URL in your browser:<br />
                ${
                  href
                    ? `<a href="${href}" style="color:${GREEN};word-break:break-all;">${hrefDisplay}</a>`
                    : `<span style="color:#374151;">${hrefDisplay}</span>`
                }
              </p>
            </td>
          </tr>
          ${emailFooterHtml()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAdminLoginOtpEmail(to, otp) {
  const html = otpShellHtml({
    headline: 'Secure Access Terminal',
    lead: 'A <strong>sign-in attempt</strong> was detected for your Grovyn admin account. Use this code to authenticate your session.',
    otp,
    alertTitle: 'Security alert',
    alertBody:
      "If you did not try to sign in, do not share this code. Change your password from the login page and notify your organization's technical contact.",
    ctaLabel: 'Go to dashboard',
    loginHref: dashboardLoginHref(),
  });

  const { data, error } = await getResend().emails.send({
    from: fromAddress(),
    to: [to],
    subject: 'Grovyn — Secure access code',
    html,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function sendAdminPasswordResetOtpEmail(to, otp) {
  const html = otpShellHtml({
    headline: 'Verify password reset',
    lead: 'A <strong>password reset</strong> was requested for your Grovyn admin account. Enter this code on the reset screen to continue.',
    otp,
    alertTitle: 'Security alert',
    alertBody:
      'If you did not request a reset, ignore this email — your password will stay the same. If you are unsure, secure your account and contact support.',
    ctaLabel: 'Go to dashboard',
    loginHref: dashboardLoginHref(),
  });

  const { data, error } = await getResend().emails.send({
    from: fromAddress(),
    to: [to],
    subject: 'Grovyn — Password reset verification',
    html,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function sendAdminWelcomeEmail(to, initialPassword, loginUrl) {
  const html = welcomeShellHtml({
    email: to,
    initialPassword,
    loginUrl,
  });

  const { data, error } = await getResend().emails.send({
    from: fromAddress(),
    to: [to],
    subject: 'Welcome to Grovyn Admin',
    html,
  });
  if (error) throw new Error(error.message);
  return data;
}
