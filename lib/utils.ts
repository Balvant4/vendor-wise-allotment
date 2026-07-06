import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export const fmtDate = (d?: string | Date | null): string => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (d?: string | Date | null): string => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
};

export const fmtHours = (h?: number | null): string => {
  if (!h || h <= 0) return '—';
  const d    = Math.floor(h / 24);
  const hrs  = Math.floor(h % 24);
  const mins = Math.round((h % 1) * 60);
  const parts: string[] = [];
  if (d > 0)    parts.push(`${d}d`);
  if (hrs > 0)  parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ') || '0m';
};

export const fmtNum = (n?: number | null): string =>
  n === undefined || n === null ? '—' : Number(n).toLocaleString('en-IN');

export const pct = (n?: number | null): string =>
  n === undefined || n === null ? '—' : `${Number(n).toFixed(1)}%`;

export const buildQuery = (params: Record<string, unknown>): string => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
  });
  return sp.toString() ? `?${sp.toString()}` : '';
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (e.response && typeof e.response === 'object') {
      const r = e.response as Record<string, unknown>;
      if (r.data && typeof r.data === 'object') {
        const d = r.data as Record<string, unknown>;
        if (typeof d.message === 'string') return d.message;
      }
    }
    if (typeof e.message === 'string') return e.message;
  }
  return 'Something went wrong';
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Escapes HTML-significant characters before interpolating any value into
// an HTML email/template string. Several fields that end up in outbound
// emails (vehicle numbers, container numbers, transporter names, upload
// filenames) originate from user-uploaded spreadsheet cells or user input —
// without this, a crafted cell value like `<img src=x onerror=...>` would
// be injected verbatim into an HTML email opened by an admin/manager.
export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));

// Escapes regex special characters so user-typed search text (which may
// contain parentheses, dots, etc. — e.g. a container number) can be safely
// passed to `new RegExp()` without throwing on invalid patterns or opening
// up ReDoS-style crafted input on public, unauthenticated search endpoints.
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts dd-mm-yyyy, dd/mm/yyyy, or yyyy-mm-dd (with - or / as separator)
// and returns the matching calendar day, or null if the text isn't a date.
// Kept deliberately forgiving about separators since operators may type
// either style — this only needs to recognize a date, not validate a form.
export function parseSearchDate(raw: string): Date | null {
  const str = raw.trim();

  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  const yyyymmdd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

// Shared "search everything" match builder used by both vehicle.queries.ts
// (Vehicles page) and dashboard.service.ts (Dashboard/Alerts/Division/Vendors
// pages) so the header search box behaves identically everywhere it appears,
// instead of each call site reimplementing (and drifting from) its own logic.
// Returns a Mongo `$or` clause, or null if there's nothing to search for.
export function buildSearchMatch(
  search: string | undefined,
  textFields: string[],
  dateFields: string[]
): Record<string, unknown> | null {
  if (!search) return null;

  const safe = escapeRegex(search);
  const orConditions: Record<string, unknown>[] = textFields.map((field) => ({
    [field]: new RegExp(safe, 'i'),
  }));

  // If the typed text parses as a date, also match any record where one of
  // the given timestamp fields falls on that calendar day.
  const parsedDate = parseSearchDate(search);
  if (parsedDate) {
    const dayStart = new Date(parsedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(parsedDate);
    dayEnd.setHours(23, 59, 59, 999);

    for (const field of dateFields) {
      orConditions.push({ [field]: { $gte: dayStart, $lte: dayEnd } });
    }
  }

  return { $or: orConditions };
}