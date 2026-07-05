import { withErrorHandler, apiPaginated } from '@/lib/api-response';
import { optionalAuth } from '@/lib/auth';
import { queryVehicles, queryVehiclesForExport, type VehicleQueryFilters } from '@/server/queries/vehicle.queries';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type { VehicleRecord } from '@/types';
import type { DashboardFilters } from '@/types';

type DashboardFiltersDateField = NonNullable<DashboardFilters['dateField']>;

// Columns that hold timestamps and should be exported with both date and
// time (not just the date) so operators can see exact in/out moments.
const DATETIME_COLUMNS = new Set<string>([
  'gateInDate', 'exciseOutDate', 'loadingStartTime', 'loadingEndTime',
  'wllWeighIn', 'wllWeighOut',
]);

function fmtExportDateTime(val: unknown): string {
  if (!val) return '';
  const dt = val instanceof Date ? val : new Date(val as string);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

const EXPORT_COLUMNS: { key: keyof VehicleRecord | 'srNo' | 'status'; label: string }[] = [
  { key: 'srNo',             label: 'Sr. No' },
  { key: 'documentNumber',   label: 'Document No' },
  { key: 'division',         label: 'Warehouse' },
  { key: 'endCustName',      label: 'End Customer' },
  { key: 'containerNo',      label: 'Container No' },
  { key: 'transporter',      label: 'Transporter' },
  { key: 'vehicleNo',        label: 'Vehicle No' },
  { key: 'gateInDate',       label: 'Gate In' },
  { key: 'exciseOutDate',    label: 'Excise Out' },
  { key: 'gateExciseDiff',   label: 'Gate-Excise Diff' },
  { key: 'loadingStartTime', label: 'Loading Start' },
  { key: 'loadingEndTime',   label: 'Loading End' },
  { key: 'loadingTimeDiff',  label: 'Loading Diff' },
  { key: 'wllWeighIn',       label: 'WLL Weigh IN' },
  { key: 'wllWeighOut',      label: 'WLL Weigh OUT' },
  { key: 'diffStr',          label: 'Weigh Diff' },
  { key: 'isFix',            label: 'Load Type' },
  { key: 'status',           label: 'Status' },
];

function buildExportRows(rows: VehicleRecord[]): Record<string, unknown>[] {
  return rows.map((r, i) => {
    const out: Record<string, unknown> = {};
    for (const col of EXPORT_COLUMNS) {
      if (col.key === 'srNo') { out[col.label] = i + 1; continue; }
      if (col.key === 'status') { out[col.label] = r.isOver25h ? 'Company Detention' : 'OK'; continue; }
      if (col.key === 'isFix') { out[col.label] = r.isFix ? 'Fix' : 'Non-Fix'; continue; }
      const val = (r as unknown as Record<string, unknown>)[col.key];
      if (DATETIME_COLUMNS.has(col.key)) { out[col.label] = fmtExportDateTime(val); continue; }
      out[col.label] = val instanceof Date ? val.toISOString() : (val ?? '');
    }
    return out;
  });
}

// Minimal RFC 4180-ish CSV encoder — good enough for our own generated
// values (dates, names, numbers); wraps any field containing a comma,
// quote, or newline in double quotes and escapes inner quotes.
function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escapeCell = (val: unknown): string => {
    const s = val === undefined || val === null ? '' : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(escapeCell).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c])).join(','));
  return [header, ...lines].join('\r\n');
}

// GET /api/vehicles — public read access, same reasoning as /api/dashboard
// Pass ?export=xlsx or ?export=csv to stream a file of every matching row
// instead of a paginated JSON page. Exports respect every filter below.
export const GET = withErrorHandler(async (req: Request) => {
  optionalAuth(req);

  const url = new URL(req.url);
  const p   = url.searchParams;

  const filters: VehicleQueryFilters = {
    year:         p.get('year')         ?? undefined,
    month:        p.get('month')        ?? undefined,
    division:     p.get('division')     ?? undefined,
    transporter:  p.get('transporter')  ?? undefined,
    isFix:        p.get('isFix')        ?? undefined,
    isOver25h:    p.get('isOver25h')    ?? undefined,
    customer:     p.get('customer')     ?? undefined,
    container:    p.get('container')    ?? undefined,
    completeness: (p.get('completeness') as VehicleQueryFilters['completeness']) ?? undefined,
    dateFrom:     p.get('dateFrom')     ?? undefined,
    dateTo:       p.get('dateTo')       ?? undefined,
    dateField:    (p.get('dateField') as DashboardFiltersDateField) ?? undefined,
    search:       p.get('search')       ?? undefined,
    page:         Number(p.get('page'))  || 1,
    limit:        Number(p.get('limit')) || 50,
    sortKey:      p.get('sortKey')      ?? undefined,
    sortDir:      (p.get('sortDir') as 'asc' | 'desc') ?? 'desc',
  };

  const exportFormat = p.get('export');

  if (exportFormat === 'xlsx' || exportFormat === 'csv') {
    const rows = await queryVehiclesForExport(filters) as unknown as VehicleRecord[];
    const sheetRows = buildExportRows(rows);

    if (exportFormat === 'csv') {
      const csv = toCsv(sheetRows, EXPORT_COLUMNS.map((c) => c.label));
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="vehicle-records-${Date.now()}.csv"`,
        },
      });
    }

    const worksheet  = XLSX.utils.json_to_sheet(sheetRows, { header: EXPORT_COLUMNS.map((c) => c.label) });
    worksheet['!cols'] = EXPORT_COLUMNS.map((c) => ({ wch: Math.max(12, c.label.length + 2) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Records');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vehicle-records-${Date.now()}.xlsx"`,
      },
    });
  }

  const { data, pagination } = await queryVehicles(filters);
  return apiPaginated(data, pagination);
});