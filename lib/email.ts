import nodemailer from 'nodemailer';

// Lightweight SMTP mailer. Configure any provider that speaks SMTP
// (SendGrid, Postmark, SES, Gmail app password, your own relay) via the
// env vars below — no provider-specific SDK needed.
//
// If SMTP_HOST is not set, email sending is a no-op (logs to console
// instead) so local dev / first-run setups don't crash for lack of
// credentials. In-app notifications keep working regardless.

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? 'Vendor Control Tower <no-reply@logistics.local>';
const IS_CONFIGURED = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!IS_CONFIGURED) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export interface SendEmailInput {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  if (to.length === 0) return { sent: false, error: 'No recipients' };

  const tx = getTransporter();
  if (!tx) {
    console.log(`[Email] SMTP not configured — skipping send. Would have sent "${subject}" to ${to.join(', ')}`);
    return { sent: false, error: 'SMTP not configured' };
  }

  try {
    await tx.sendMail({
      from: SMTP_FROM,
      to: to.join(', '),
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email] Send failed:', message);
    return { sent: false, error: message };
  }
}
