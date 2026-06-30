import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransporterMaster extends Document {
  originalName: string;   // Raw name from SAP e.g. "B R LOGIST"
  standardName: string;   // Clean name e.g. "BR LOGISTICS"
  isFix: boolean;         // true = FIX, false = NON FIX
  isActive: boolean;      // can disable without deleting
  needsReview: boolean;   // true = auto-created from upload, awaiting admin edit
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transporterMasterSchema = new Schema<ITransporterMaster>(
  {
    originalName: {
      type:     String,
      required: [true, 'Original name is required'],
      trim:     true,
      uppercase: true,
    },
    standardName: {
      type:     String,
      required: [true, 'Standard name is required'],
      trim:     true,
      uppercase: true,
    },
    isFix:       { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    needsReview: { type: Boolean, default: false, index: true },
    isDeleted:   { type: Boolean, default: false },
    deletedAt:   { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index for fast lookup during upload processing
transporterMasterSchema.index({ originalName: 1 });
transporterMasterSchema.index({ standardName: 1 });
transporterMasterSchema.index({ isFix: 1 });

// Soft delete filter — applies to find, findOne, findById, AND countDocuments
transporterMasterSchema.pre(/^find/, function (
  this: mongoose.Query<ITransporterMaster[], ITransporterMaster>,
  next
) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// countDocuments uses a separate hook name in Mongoose — not covered by /^find/
transporterMasterSchema.pre('countDocuments', function (
  this: mongoose.Query<number, ITransporterMaster>,
  next
) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const TransporterMaster: Model<ITransporterMaster> =
  mongoose.models.TransporterMaster ||
  mongoose.model<ITransporterMaster>('TransporterMaster', transporterMasterSchema);

export default TransporterMaster;