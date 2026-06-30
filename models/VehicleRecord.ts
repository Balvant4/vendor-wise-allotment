import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVehicleRecord extends Document {
  // ── Unique identifier ──────────────────────────────────
  uniqueId: string;

  // ── Raw columns from Excel (all 18) ───────────────────
  documentNumber: string;
  warehouseNumber: string;
  endCustName: string;
  containerNo: string;
  vehicleNo: string;
  gateInDate?: Date;
  exciseOutDate?: Date;
  gateExciseDiff?: string;
  loadingStartTime?: Date;
  loadingEndTime?: Date;
  loadingTimeDiff?: string;
  transporterRaw: string;      // always the original SAP name
  detentionReason?: string;
  otherReason?: string;
  customerName: string;
  wllWeighIn?: Date;
  wllWeighOut?: Date;
  weighDiffRaw?: string;

  // ── Cleaned / calculated fields ────────────────────────
  division: string;
  transporter: string;         // mapped name (or raw if unmapped)
  isFix: boolean;              // from transporter master
  isMapped: boolean;           // false = transporter not in master yet
  diffHours: number;
  diffStr: string;
  isOver25h: boolean;
  hasIncompleteData: boolean;  // true = missing WLL weigh in/out dates
  year: number;
  month: number;
  dayOfWeek: number;

  // ── Meta ───────────────────────────────────────────────
  uploadId: mongoose.Types.ObjectId;
  sourceRow: number;
  skippedReason?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleRecordSchema = new Schema<IVehicleRecord>(
  {
    uniqueId:         { type: String, required: true, unique: true },

    // Raw columns
    documentNumber:   { type: String, trim: true },
    warehouseNumber:  { type: String, trim: true },
    endCustName:      { type: String, trim: true },
    containerNo:      { type: String, trim: true, uppercase: true },
    vehicleNo:        { type: String, trim: true, uppercase: true },
    gateInDate:       { type: Date },
    exciseOutDate:    { type: Date },
    gateExciseDiff:   { type: String },
    loadingStartTime: { type: Date },
    loadingEndTime:   { type: Date },
    loadingTimeDiff:  { type: String },
    transporterRaw:   { type: String, trim: true },  // original SAP name always stored
    detentionReason:  { type: String, trim: true },
    otherReason:      { type: String, trim: true },
    customerName:     { type: String, trim: true },
    wllWeighIn:       { type: Date },
    wllWeighOut:      { type: Date },
    weighDiffRaw:     { type: String },

    // Cleaned fields
    division:         { type: String, trim: true, uppercase: true, index: true },
    transporter:      { type: String, trim: true, uppercase: true, index: true },
    isFix:            { type: Boolean, default: false, index: true },
    isMapped:         { type: Boolean, default: true, index: true },
    diffHours:        { type: Number, default: 0 },
    diffStr:          { type: String },
    isOver25h:        { type: Boolean, default: false, index: true },
    hasIncompleteData: { type: Boolean, default: false, index: true },
    year:             { type: Number, index: true },
    month:            { type: Number, index: true },
    dayOfWeek:        { type: Number },

    // Meta
    uploadId:         { type: Schema.Types.ObjectId, ref: 'Upload', required: true, index: true },
    sourceRow:        { type: Number },
    skippedReason:    { type: String },
    isDeleted:        { type: Boolean, default: false },
    deletedAt:        { type: Date },
    createdBy:        { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Compound indexes
vehicleRecordSchema.index({ year: 1, month: 1, division: 1 });
vehicleRecordSchema.index({ transporter: 1, year: 1 });
vehicleRecordSchema.index({ isOver25h: 1, year: 1, month: 1 });
vehicleRecordSchema.index({ isMapped: 1 });
vehicleRecordSchema.index({ transporterRaw: 1 });
vehicleRecordSchema.index({ containerNo: 1 });
vehicleRecordSchema.index({ vehicleNo: 1 });
vehicleRecordSchema.index({ wllWeighIn: -1 });

// Soft delete filter — find, findOne, findById
vehicleRecordSchema.pre(/^find/, function (
  this: mongoose.Query<IVehicleRecord[], IVehicleRecord>,
  next
) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// countDocuments needs its own hook — not covered by /^find/
vehicleRecordSchema.pre('countDocuments', function (
  this: mongoose.Query<number, IVehicleRecord>,
  next
) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const VehicleRecord: Model<IVehicleRecord> =
  mongoose.models.VehicleRecord ||
  mongoose.model<IVehicleRecord>('VehicleRecord', vehicleRecordSchema);

export default VehicleRecord;