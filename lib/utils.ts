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

// Escapes regex special characters so user-typed search text (which may
// contain parentheses, dots, etc. — e.g. a container number) can be safely
// passed to `new RegExp()` without throwing on invalid patterns or opening
// up ReDoS-style crafted input on public, unauthenticated search endpoints.
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
