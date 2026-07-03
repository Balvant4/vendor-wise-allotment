import mongoose, { Schema, Document, Model } from 'mongoose';
import type { UserRole } from '@/types';

export type NotificationType = 'sla_violation' | 'upload_completed' | 'upload_failed';
export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface INotification extends Document {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;

  // Who should see this — broadcast by role rather than per-user, so it
  // reuses the same RBAC surface the rest of the app already relies on
  // (types/index.ts PERMISSIONS) instead of maintaining a separate
  // per-user subscription list.
  audienceRoles: UserRole[];

  // Per-user read tracking on a broadcast notification.
  readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];

  // Optional links back to the data that triggered this notification.
  uploadId?: mongoose.Types.ObjectId;
  vehicleRecordIds?: mongoose.Types.ObjectId[];
  meta?: Record<string, unknown>;

  emailSentAt?: Date;
  emailError?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['sla_violation', 'upload_completed', 'upload_failed'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'info',
    },
    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    audienceRoles: {
      type: [String],
      default: ['admin', 'manager'],
      index: true,
    },

    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],

    uploadId:         { type: Schema.Types.ObjectId, ref: 'Upload', index: true },
    vehicleRecordIds: [{ type: Schema.Types.ObjectId, ref: 'VehicleRecord' }],
    meta:             { type: Schema.Types.Mixed },

    emailSentAt: { type: Date },
    emailError:  { type: String },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ audienceRoles: 1, createdAt: -1 });

notificationSchema.pre(/^find/, function (
  this: mongoose.Query<INotification[], INotification>,
  next
) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

notificationSchema.pre('countDocuments', function (
  this: mongoose.Query<number, INotification>,
  next
) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
