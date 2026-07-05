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
// Protected by CRON_SECRET (set in .env) so it can't be triggered by a
// random request — if CRON_SECRET is unset, the check is skipped (useful
// for local testing only; always set it in production).
export const GET = withErrorHandler(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('authorization')?.replace('Bearer ', '');

  if (secret && provided !== secret) {
    return apiError('Unauthorized', 401, 'INVALID_CRON_SECRET');
  }

  const result = await sendMonthlyReport();
  return apiSuccess(result, result.sent ? 'Monthly report sent' : 'Monthly report skipped — no recipients configured');
});