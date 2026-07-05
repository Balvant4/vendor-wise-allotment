import * as XLSX from 'xlsx';
import connectDB from '@/database/connection';
import User from '@/models/User';
import VehicleRecord from '@/models/VehicleRecord';
import { sendEmail } from '@/lib/email';
import { fmtHours, fmtDateTime } from '@/lib/utils';
import { dashboardService } from './dashboard.service';
import { currentMonthService } from './current-month.service';
import type { DashboardFilters } from '@/types';

// ── NOTE on the "screenshot of the whole page" requirement ──────────────
// A full-page screenshot needs a headless browser (e.g. Puppeteer/Playwright)
// rendering the actual /current-month route server-side, which is a much
// heavier dependency than anything else in this app and often doesn't run
// on constrained serverless platforms without extra configuration. Rather
// than fake it, this service sends the two things that reliably work
// everywhere (an Excel attachment + a text/HTML summary) and leaves a clear
// extension point below (`captureScreenshot`) — wire in Puppeteer there if
// your deployment target supports it, and pass the resulting Buffer into
// the `attachments` array in `sendMonthlyReport()`.
// -------------------------------------------------------------------------

// Recipients: prefer an explicit env list; fall back to every active
// admin/manager (same audience convention as notification.service.ts's
// SLA-violation alerts) so the report still goes somewhere useful even if
// the env var is never configured. Can later be swapped for an admin
// settings-page value without changing anything below this function.
async function resolveRecipients(): Promise<string[]> {
  const envList = (process.env.MONTHLY_REPORT_RECIPIENTS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  if (envList.length > 0) return envList;

  await connectDB();
  const users = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true })
    .select('email').lean();
  return users.map((u) => u.email).filter(Boolean);
}

function previousMonthRange(): { dateFrom: string; dateTo: string; label: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
  const last  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  return {
    dateFrom: first.toISOString(),
    dateTo: last.toISOString(),
    label: first.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

async function buildExcelAttachment(filters: DashboardFilters): Promise<Buffer> {
  await connectDB();
  const rows = await VehicleRecord.find({
    isDeleted: { $ne: true },
    wllWeighIn: { $gte: new Date(filters.dateFrom!), $lte: new Date(filters.dateTo!) },
  }).limit(20000).lean();

  const sheetRows = rows.map((r, i) => ({
    'Sr. No': i + 1,
    'Document No': r.documentNumber,
    'Division': r.division,
    'Customer': r.customerName,
    'Container No': r.containerNo,
    'Transporter': r.transporter,
    'Vehicle No': r.vehicleNo,
    'WLL Weigh IN': fmtDateTime(r.wllWeighIn),
    'WLL Weigh OUT': fmtDateTime(r.wllWeighOut),
    'Duration': r.hasIncompleteData ? '—' : fmtHours(r.diffHours),
    'Status': r.isOver25h ? 'Company Detention' : 'OK',
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// Extension point — see the note at the top of this file. Returns null
// until wired up, so the email still sends without it.
async function captureScreenshot(): Promise<Buffer | null> {
  return null;
}

export interface MonthlyReportResult {
  sent: boolean;
  recipients: string[];
  label: string;
}

export async function sendMonthlyReport(): Promise<MonthlyReportResult> {
  const { dateFrom, dateTo, label } = previousMonthRange();
  const filters: DashboardFilters = { dateFrom, dateTo, dateField: 'wllWeighIn' };

  const [kpis, insights, excelBuffer, screenshot, recipients] = await Promise.all([
    dashboardService.getKPIs(filters),
    currentMonthService.getInsights(filters),
    buildExcelAttachment(filters),
    captureScreenshot(),
    resolveRecipients(),
  ]);

  if (recipients.length === 0) {
    console.warn('[MonthlyReport] No recipients configured (MONTHLY_REPORT_RECIPIENTS is empty and no active admin/manager users exist) — skipping send.');
    return { sent: false, recipients: [], label };
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; color: #111;">
      <h2 style="margin-bottom: 4px;">Monthly Logistics Report — ${label}</h2>
      <p style="color:#444;">Summary of operations for <b>${label}</b>:</p>
      <ul style="color:#333; line-height: 1.6;">
        <li>Total loads: <b>${kpis.total}</b></li>
        <li>Over 25H detentions: <b>${kpis.over25}</b> (${kpis.violationRate}% violation rate)</li>
        <li>Unique vehicles: <b>${kpis.uniqueVehicles}</b> across <b>${kpis.uniqueTransporters}</b> transporters and <b>${kpis.uniqueDivisions}</b> divisions</li>
        <li>Completed vs Pending: <b>${insights.completed}</b> / <b>${insights.pending}</b> (${insights.completionRate}% complete)</li>
        <li>Average hours per load: <b>${kpis.avgHours}h</b> (max ${kpis.maxHours}h)</li>
      </ul>
      <p style="color:#444;">The full detailed record set for the month is attached as an Excel workbook.</p>
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/current-month"
           style="background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;">
          Open Current Month Dashboard
        </a>
      </p>
    </div>
  `;

  const attachments = [
    { filename: `monthly-report-${label.replace(' ', '-')}.xlsx`, content: excelBuffer },
    ...(screenshot ? [{ filename: 'dashboard-screenshot.png', content: screenshot, contentType: 'image/png' }] : []),
  ];

  const result = await sendEmail({
    to: recipients,
    subject: `Monthly Logistics Report — ${label}`,
    html,
    attachments,
  });

  return { sent: result.sent, recipients, label };
}