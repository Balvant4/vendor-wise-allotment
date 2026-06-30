import mongoose, { Schema, Document, Model } from 'mongoose';
import { UploadStatus } from '@/types';

export interface IUpload extends Document {
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: UploadStatus;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  duplicateRows: number;
  errorRows: number;
  processingErrors: { row: number; message: string; data?: unknown }[];
  processingWarnings: { row: number; message: string }[];
  sheetName?: string;
  processedAt?: Date;
  errorMessage?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = new Schema<IUpload>(
  {
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize:     { type: Number, required: true },
    mimeType:     { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    totalRows:     { type: Number, default: 0 },
    validRows:     { type: Number, default: 0 },
    skippedRows:   { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    errorRows:     { type: Number, default: 0 },
    processingErrors:   [{ row: Number, message: String, data: Schema.Types.Mixed }],
    processingWarnings: [{ row: Number, message: String }],
    sheetName:    { type: String },
    processedAt:  { type: Date },
    errorMessage: { type: String },
    isDeleted:    { type: Boolean, default: false },
    deletedAt:    { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

uploadSchema.pre(/^find/, function (this: mongoose.Query<IUpload[], IUpload>, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// countDocuments needs its own hook — not covered by /^find/
uploadSchema.pre('countDocuments', function (this: mongoose.Query<number, IUpload>, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const Upload: Model<IUpload> =
  mongoose.models.Upload || mongoose.model<IUpload>('Upload', uploadSchema);

export default Upload;