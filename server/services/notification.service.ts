import connectDB from '@/database/connection';
import Notification, { type NotificationType, type NotificationSeverity } from '@/models/Notification';
import User from '@/models/User';
import Upload from '@/models/Upload';
import { sendEmail } from '@/lib/email';
import { fmtHours } from '@/lib/utils';
import type { UserRole } from '@/types';
import mongoose from 'mongoose';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Roles that receive SLA violation alerts. Kept in one place so it's easy
// to tune without hunting through call sites — matches the existing
// VIEW_REPORTS-style permission grouping in types/index.ts.
const VIOLATION_AUDIENCE: UserRole[] = ['admin', 'manager'];

export interface ViolationRecordSummary {
  _id: mongoose.Types.ObjectId;
  vehicleNo: string;
  containerNo: string;
  transporter: string;
  division: string;
  diffHours: number;
  diffStr: string;
}

interface CreateInput {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  audienceRoles?: UserRole[];
  uploadId?: mongoose.Types.ObjectId;
  vehicleRecordIds?: mongoose.Types.ObjectId[];
  meta?: Record<string, unknown>;
}

async function createAndEmail(input: CreateInput): Promise<void> {
  await connectDB();

  const notification = await Notification.create({
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    audienceRoles: input.audienceRoles ?? VIOLATION_AUDIENCE,
    uploadId: input.uploadId,
    vehicleRecordIds: input.vehicleRecordIds,
    meta: input.meta,
  });

  // Fire-and-forget email — a failed email must never fail the upload
  // request itself, so errors are caught and recorded on the notification.
  try {
    const recipients = await User.find({
      role: { $in: notification.audienceRoles },
      isActive: true,
    })
      .select('email')
      .lean();

    const to = recipients.map((r) => r.email).filter(Boolean);

    const result = await sendEmail({
      to,
      subject: `[${input.severity.toUpperCase()}] ${input.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2 style="margin-bottom: 4px;">${input.title}</h2>
          <p style="color: #444;">${input.message}</p>
          <p style="margin-top: 24px;">
            <a href="${APP_URL}/alerts" style="background:#111;color:#fff;padding:10px 16px;
               border-radius:6px;text-decoration:none;font-size:14px;">
              View in Vendor Control Tower
            </a>
          </p>
        </div>
      `,
    });

    notification.emailSentAt = result.sent ? new Date() : undefined;
    notification.emailError = result.error;
    await notification.save();
  } catch (err) {
    notification.emailError = err instanceof Error ? err.message : 'Unknown email error';
    await notification.save();
  }
}

// ── Called from upload.service.ts right after an upload finishes processing ──
export async function notifySlaViolations(
  uploadId: mongoose.Types.ObjectId,
  violations: ViolationRecordSummary[]
): Promise<void> {
  if (violations.length === 0) return;

  await connectDB();
  const upload = await Upload.findById(uploadId).select('originalName').lean();

  const worst = [...violations].sort((a, b) => b.diffHours - a.diffHours).slice(0, 5);
  const worstList = worst
    .map((v) => `${v.vehicleNo} (${v.transporter}, ${v.division}) — ${fmtHours(v.diffHours)}`)
    .join('; ');

  const title =
    violations.length === 1
      ? `SLA violation: ${violations[0].vehicleNo}`
      : `${violations.length} SLA violations detected`;

  const message =
    violations.length === 1
      ? `Vehicle ${violations[0].vehicleNo} (${violations[0].transporter}, ${violations[0].division}) exceeded the 25h threshold at ${violations[0].diffStr}.`
      : `Upload "${upload?.originalName ?? 'file'}" produced ${violations.length} vehicles over the 25h threshold. Worst: ${worstList}.`;

  await createAndEmail({
    type: 'sla_violation',
    severity: violations.length >= 5 ? 'critical' : 'warning',
    title,
    message,
    uploadId,
    vehicleRecordIds: violations.map((v) => v._id),
    meta: { count: violations.length, worst },
  });
}

// ── Called when an upload finishes with errors, so ops isn't left guessing ──
export async function notifyUploadFailed(
  uploadId: mongoose.Types.ObjectId,
  errorMessage: string
): Promise<void> {
  await connectDB();
  const upload = await Upload.findById(uploadId).select('originalName').lean();

  await createAndEmail({
    type: 'upload_failed',
    severity: 'critical',
    title: `Upload failed: ${upload?.originalName ?? 'file'}`,
    message: `Processing failed with error: ${errorMessage}`,
    uploadId,
  });
}
