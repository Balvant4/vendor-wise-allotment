import * as XLSX from 'xlsx';
import connectDB from '@/database/connection';
import Upload, { IUpload } from '@/models/Upload';
import VehicleRecord from '@/models/VehicleRecord';
import TransporterMaster from '@/models/TransporterMaster';
import { notifySlaViolations, notifyUploadFailed, type ViolationRecordSummary } from '@/server/services/notification.service';
import mongoose from 'mongoose';

const ALERT_HOURS = Number(process.env.ALERT_THRESHOLD_HOURS ?? 25);

// ── Valid divisions after mapping ─────────────────────────────────────────────
const VALID_DIVISIONS = ['AT', 'TT', 'BS'];

const DIVISION_MAP: Record<string, string> = {
  '107': 'TT',
  '108': 'BS',
  'AT1': 'AT',
  'AT2': 'AT',
  'AT3': 'AT',
};

function mapDivision(raw: string): string {
  const key = raw.trim().toUpperCase();
  return DIVISION_MAP[key] ?? key;
}

// ── Date parser for DD.MM.YYYY HH:MM:SS ──────────────────────────────────────
function parseSAPDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  const str = String(val).trim();
  if (!str) return undefined;

  const match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, dd, mm, yyyy, hh, min, ss] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? undefined : fallback;
}

// ── Calculate diff hours from actual dates ────────────────────────────────────
function calcDiffHours(inDate?: Date, outDate?: Date): number {
  if (!inDate || !outDate) return 0;
  const diff = outDate.getTime() - inDate.getTime();
  return diff < 0 ? 0 : diff / 3_600_000;
}

// ── Format hours to readable string ──────────────────────────────────────────
function fmtDiff(hours: number): string {
  if (hours <= 0) return '0h 0m';
  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  const m = Math.round((hours % 1) * 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(' ') || '0m';
}

// ── Unique ID ─────────────────────────────────────────────────────────────────
// Primary: Container + Vehicle + WLL Weigh IN (most reliable, real-world unique)
// Fallback: if WLL Weigh IN missing, use Gate In date instead
// Final fallback: Document Number (SAP's own unique reference) to avoid collisions
function makeUniqueId(
  containerNo: string,
  vehicleNo: string,
  documentNumber: string,
  wllWeighIn?: Date,
  gateInDate?: Date
): string {
  const datePart = wllWeighIn
    ? wllWeighIn.toISOString()
    : gateInDate
      ? `gatein-${gateInDate.toISOString()}`
      : `doc-${documentNumber}`;
  return `${containerNo.trim().toUpperCase()}|${vehicleNo.trim().toUpperCase()}|${datePart}`;
}

// ── Load transporter master from DB ──────────────────────────────────────────
// Returns a map of originalName → { standardName, isFix }
async function loadTransporterMaster(): Promise<Map<string, { standardName: string; isFix: boolean }>> {
  const records = await TransporterMaster.find({ isActive: true }).lean();
  const map = new Map<string, { standardName: string; isFix: boolean }>();
  for (const r of records) {
    map.set(r.originalName.trim().toUpperCase(), {
      standardName: r.standardName.trim().toUpperCase(),
      isFix:        r.isFix,
    });
  }
  return map;
}

// ── Skipped row type ──────────────────────────────────────────────────────────
interface SkippedRow {
  row: number;
  reason: string;
  data?: unknown;
}

// ── Main parse and process function ──────────────────────────────────────────
export async function parseAndProcessExcel(
  buffer: Buffer,
  uploadId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<{
  inserted: number;
  duplicates: number;
  skipped: number;
  unmapped: number;
  incompleteCount: number;
  totalRows: number;
  skippedDetails: SkippedRow[];
  unmappedTransporters: { name: string; count: number }[];
  sheetName: string;
  newViolations: ViolationRecordSummary[];
}> {
  // ── Read Excel ──
  const wb = XLSX.read(buffer, { type: 'buffer', raw: false });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: '',
  });

  const dataRows = rows.slice(1); // skip header
  const totalRows = dataRows.length;

  // ── Load transporter master from DB ──
  const transporterMap = await loadTransporterMaster();

  const toInsert: Record<string, unknown>[] = [];
  const skippedDetails: SkippedRow[]        = [];
  const unmappedMap = new Map<string, number>(); // track unmapped transporters

  for (let i = 0; i < dataRows.length; i++) {
    const row    = dataRows[i] as string[];
    const rowNum = i + 2;

    // ── Extract all 18 columns by position ──
    const documentNumber  = String(row[0]  ?? '').trim();
    const warehouseNumber = String(row[1]  ?? '').trim();
    const endCustName     = String(row[2]  ?? '').trim();
    const containerNo     = String(row[3]  ?? '').trim().toUpperCase();
    const vehicleNo       = String(row[4]  ?? '').trim().toUpperCase();
    const gateInRaw       = String(row[5]  ?? '').trim();
    const exciseOutRaw    = String(row[6]  ?? '').trim();
    const gateExciseDiff  = String(row[7]  ?? '').trim();
    const loadingStartRaw = String(row[8]  ?? '').trim();
    const loadingEndRaw   = String(row[9]  ?? '').trim();
    const loadingTimeDiff = String(row[10] ?? '').trim();
    const transporterRaw  = String(row[11] ?? '').trim().toUpperCase();
    const detentionReason = String(row[12] ?? '').trim();
    const otherReason     = String(row[13] ?? '').trim();
    const customerName    = String(row[14] ?? '').trim();
    const wllWeighInRaw   = String(row[15] ?? '').trim();
    const wllWeighOutRaw  = String(row[16] ?? '').trim();
    const weighDiffRaw    = String(row[17] ?? '').trim();

    // ── Filter 1: TARGET GLOBAL ──
    if (endCustName.toUpperCase().includes('TARGET GLOBAL SOURCING LIMITED')) {
      skippedDetails.push({ row: rowNum, reason: 'TARGET GLOBAL SOURCING LIMITED filtered out' });
      continue;
    }

    // ── Filter 2: LCL containers ──
    if (containerNo.includes('LCL')) {
      skippedDetails.push({ row: rowNum, reason: `LCL container filtered: ${containerNo}` });
      continue;
    }

    // ── Filter 3: Missing container or vehicle ──
    if (!containerNo || !vehicleNo) {
      skippedDetails.push({ row: rowNum, reason: 'Missing container or vehicle number', data: row });
      continue;
    }

    // ── Map division ──
    const division = mapDivision(warehouseNumber);

    // ── Filter 4: Invalid division ──
    if (!VALID_DIVISIONS.includes(division)) {
      skippedDetails.push({
        row: rowNum,
        reason: `Invalid division: "${warehouseNumber}" → "${division}" (must be AT/TT/BS)`,
        data: { containerNo, vehicleNo },
      });
      continue;
    }

    // ── Parse dates ──
    const gateInDate       = parseSAPDate(gateInRaw);
    const exciseOutDate    = parseSAPDate(exciseOutRaw);
    const loadingStartTime = parseSAPDate(loadingStartRaw);
    const loadingEndTime   = parseSAPDate(loadingEndRaw);
    const wllWeighIn       = parseSAPDate(wllWeighInRaw);
    const wllWeighOut      = parseSAPDate(wllWeighOutRaw);

    // ── Missing WLL dates — do NOT skip, insert with incomplete flag ──
    // The shipment data is still valuable even if weighment hasn't happened yet
    const hasIncompleteData = !wllWeighIn || !wllWeighOut;

    // ── Calculate diff (0 if dates missing) ──
    const diffHours = hasIncompleteData ? 0 : calcDiffHours(wllWeighIn, wllWeighOut);
    const diffStr   = hasIncompleteData ? '—' : fmtDiff(diffHours);
    const isOver25h = hasIncompleteData ? false : diffHours >= ALERT_HOURS;

    // ── Lookup transporter from DB master ──
    const masterRecord = transporterMap.get(transporterRaw);
    const isMapped     = !!masterRecord;
    const transporter  = masterRecord ? masterRecord.standardName : transporterRaw;
    const isFix        = masterRecord ? masterRecord.isFix : false;

    // ── Track unmapped transporters ──
    if (!isMapped && transporterRaw) {
      unmappedMap.set(transporterRaw, (unmappedMap.get(transporterRaw) ?? 0) + 1);
    }

    // ── Build unique ID — falls back to gateInDate or documentNumber if WLL missing ──
    const uniqueId = makeUniqueId(containerNo, vehicleNo, documentNumber, wllWeighIn, gateInDate);

    // ── Date parts — use whichever date is available for year/month/day analytics ──
    const referenceDate = wllWeighIn ?? gateInDate ?? new Date();
    const year      = referenceDate.getFullYear();
    const month     = referenceDate.getMonth() + 1;
    const dayOfWeek = referenceDate.getDay();

    toInsert.push({
      uniqueId,
      documentNumber,
      warehouseNumber,
      endCustName,
      containerNo,
      vehicleNo,
      gateInDate,
      exciseOutDate,
      gateExciseDiff,
      loadingStartTime,
      loadingEndTime,
      loadingTimeDiff,
      transporterRaw,       // always save original SAP name
      detentionReason,
      otherReason,
      customerName,
      wllWeighIn,
      wllWeighOut,
      weighDiffRaw,
      division,
      transporter,          // mapped or raw
      isFix,                // from master or false
      isMapped,             // false if not in master
      diffHours: Math.round(diffHours * 100) / 100,
      diffStr,
      isOver25h,
      hasIncompleteData,
      year,
      month,
      dayOfWeek,
      sourceRow: rowNum,
      uploadId,
      createdBy: userId,
    });
  }

  // ── Bulk upsert ──
  let inserted   = 0;
  let duplicates = 0;
  const newViolations: ViolationRecordSummary[] = [];

  if (toInsert.length > 0) {
    const ops = toInsert.map((record) => ({
      updateOne: {
        filter: { uniqueId: record.uniqueId },
        update: { $setOnInsert: record },
        upsert: true,
      },
    }));

    const result = await VehicleRecord.bulkWrite(ops, { ordered: false });
    inserted   = result.upsertedCount ?? 0;
    duplicates = toInsert.length - inserted;

    // Only notify for records that were actually newly inserted this run —
    // result.upsertedIds maps the ops array index → the new _id, so we can
    // trace each brand-new document back to its source row without a
    // second DB round trip. Duplicates (already in the DB) never re-fire
    // a notification, since they were already notified on their first upload.
    for (const [indexStr, id] of Object.entries(result.upsertedIds ?? {})) {
      const record = toInsert[Number(indexStr)];
      if (record?.isOver25h) {
        newViolations.push({
          _id: id as mongoose.Types.ObjectId,
          vehicleNo: String(record.vehicleNo),
          containerNo: String(record.containerNo),
          transporter: String(record.transporter),
          division: String(record.division),
          diffHours: Number(record.diffHours),
          diffStr: String(record.diffStr),
        });
      }
    }
  }

  // ── Build unmapped list ──
  const unmappedTransporters = Array.from(unmappedMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ── Auto-create master entries for unmapped transporters ──
  // So admin/manager can see and edit them directly on the Transporters page
  if (unmappedTransporters.length > 0) {
    const ops = unmappedTransporters.map(({ name }) => ({
      updateOne: {
        filter: { originalName: name },
        update: {
          $setOnInsert: {
            originalName: name,
            standardName: name,   // placeholder — same as raw until admin edits
            isFix:        false,  // default — admin sets correct value
            isActive:     true,
            needsReview:  true,   // flag so it's easy to find on the page
            createdBy:    userId,
          },
        },
        upsert: true,
      },
    }));
    await TransporterMaster.bulkWrite(ops, { ordered: false });
  }

  // ── Count records inserted with incomplete WLL data ──
  const incompleteCount = toInsert.filter((r) => r.hasIncompleteData === true).length;

  return {
    inserted,
    duplicates,
    skipped:   skippedDetails.length,
    unmapped:  unmappedMap.size,
    incompleteCount,
    totalRows,
    skippedDetails,
    unmappedTransporters,
    sheetName,
    newViolations,
  };
}

// ── Process upload ────────────────────────────────────────────────────────────
export async function processUpload(
  uploadDoc: IUpload,
  buffer: Buffer,
  userId: mongoose.Types.ObjectId
): Promise<IUpload> {
  await connectDB();

  uploadDoc.status = 'processing';
  await uploadDoc.save();

  try {
    const result = await parseAndProcessExcel(
      buffer,
      uploadDoc._id as mongoose.Types.ObjectId,
      userId
    );

    uploadDoc.status        = 'completed';
    uploadDoc.totalRows     = result.totalRows;
    uploadDoc.validRows     = result.inserted;
    uploadDoc.duplicateRows = result.duplicates;
    uploadDoc.skippedRows   = result.skipped;
    uploadDoc.errorRows     = result.unmapped;  // reuse errorRows for unmapped count
    uploadDoc.sheetName     = result.sheetName;
    uploadDoc.processedAt   = new Date();

    // Store skipped details + unmapped in processingErrors
    uploadDoc.processingErrors = [
      ...result.skippedDetails.slice(0, 50).map((s) => ({
        row:     s.row,
        message: s.reason,
        data:    s.data,
      })),
      ...result.unmappedTransporters.slice(0, 50).map((u) => ({
        row:     0,
        message: `UNMAPPED TRANSPORTER: ${u.name} (${u.count} records)`,
        data:    u,
      })),
    ];

    // Note incomplete records (missing WLL dates) as a warning — they were still inserted
    if (result.incompleteCount > 0) {
      uploadDoc.processingWarnings = [{
        row:     0,
        message: `${result.incompleteCount} records inserted with missing WLL Weighment dates — duration shows as "—" until updated`,
      }];
    }

    // Notify admin/manager (in-app + email) about any brand-new SLA violations
    // from this upload. Failures here must never fail the upload itself —
    // the upload already succeeded from the user's point of view.
    if (result.newViolations.length > 0) {
      notifySlaViolations(uploadDoc._id as mongoose.Types.ObjectId, result.newViolations)
        .catch((err) => console.error('[Upload] SLA violation notification failed:', err));
    }
  } catch (err) {
    uploadDoc.status       = 'failed';
    uploadDoc.errorMessage = err instanceof Error ? err.message : 'Processing failed';
    console.error('[Upload] Processing error:', err);

    notifyUploadFailed(uploadDoc._id as mongoose.Types.ObjectId, uploadDoc.errorMessage)
      .catch((notifyErr) => console.error('[Upload] Failure notification failed:', notifyErr));
  }

  await uploadDoc.save();
  return uploadDoc;
}

// ── Re-map transporter across all records ─────────────────────────────────────
// Called when admin adds or edits a transporter mapping
export async function remapTransporter(
  originalName: string,
  standardName: string,
  isFix: boolean
): Promise<number> {
  await connectDB();

  const result = await VehicleRecord.updateMany(
    {
      transporterRaw: originalName.trim().toUpperCase(),
      isDeleted: { $ne: true },
    },
    {
      $set: {
        transporter: standardName.trim().toUpperCase(),
        isFix,
        isMapped: true,
      },
    }
  );

  return result.modifiedCount;
}