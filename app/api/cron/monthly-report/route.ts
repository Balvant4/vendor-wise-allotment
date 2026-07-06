import { withErrorHandler, apiSuccess, apiError } from '@/lib/api-response';
import { sendMonthlyReport } from '@/server/services/monthly-report.service';

// GET /api/cron/monthly-report
//
// This route does the sending; it does NOT schedule itself — Next.js Route
// Handlers have no built-in cron, so wire ONE of the following:
//
//   1. Vercel Cron (if deployed on Vercel) — add a `vercel.json` with:
//        {
//          "crons": [
//            { "path": "/api/cron/monthly-report", "schedule": "0 10 1 * *" }
//          ]
//        }
//      That's 10:00 UTC on the 1st of every month — adjust the hour for
//      your timezone, since Vercel Cron always runs in UTC.
//
//   2. Self-hosted / long-running server — use `node-cron` inside a small
//      startup script and call `sendMonthlyReport()` directly instead of
//      hitting this URL over HTTP, e.g.:
//        import cron from 'node-cron';
//        import { sendMonthlyReport } from '@/server/services/monthly-report.service';
//        cron.schedule('0 10 1 * *', () => sendMonthlyReport());
//      (npm install node-cron if you go this route.)
//
//   3. Any external scheduler (cron-job.org, GitHub Actions `schedule:`,
//      your infra's own cron) configured to GET this URL once a month with
//      an `Authorization: Bearer <CRON_SECRET>` header.
//
// Protected by CRON_SECRET (set in .env).
//
// SECURITY: this now FAILS CLOSED in production. The previous version
// skipped the check entirely if CRON_SECRET was unset — meaning a forgotten
// env var in production silently turned this into a public, unauthenticated
// endpoint that anyone could hit to trigger report emails. Skipping the
// check is only allowed outside production, for local testing.
export const GET = withErrorHandler(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProd) {
      console.error('[cron/monthly-report] CRON_SECRET is not set in production — refusing to run.');
      return apiError('Cron endpoint is not configured', 503, 'CRON_NOT_CONFIGURED');
    }
    // Non-production with no secret set: allowed, for local testing only.
  } else {
    const provided = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
    if (!timingSafeEqual(provided, secret)) {
      return apiError('Unauthorized', 401, 'INVALID_CRON_SECRET');
    }
  }

  const result = await sendMonthlyReport();
  return apiSuccess(result, result.sent ? 'Monthly report sent' : 'Monthly report skipped — no recipients configured');
});

// Plain !== on secrets leaks timing information (an attacker can measure
// response time to guess the secret one byte at a time). Comparing
// constant-time is cheap and standard practice for any secret comparison.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
