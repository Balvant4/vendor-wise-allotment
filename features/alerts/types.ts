import type { VehicleRecord } from '@/types';

export type LoadTypeFilter = '' | 'fix' | 'nonfix';

export interface CountHours {
  count: number;
  hours: number;
}

export interface RepeatVehicle extends CountHours {
  transporter: string;
}

export interface AlertsSummary {
  total: number;
  avg: number;
  max: number;
  totalHours: number;
}

export interface AlertsInsights {
  byTransporter: [string, CountHours][];
  byWarehouse: [string, CountHours][];
  repeatVehicles: [string, RepeatVehicle][];
  reasons: [string, number][];
  severityCounts: { low: number; medium: number; high: number };
  weekdayCounts: number[];
}

export interface UseAlertsInsightsResult {
  divisions: string[];
  transporters: string[];
  divisionFilter: string;
  setDivisionFilter: (v: string) => void;
  transporterFilter: string;
  setTransporterFilter: (v: string) => void;
  loadTypeFilter: LoadTypeFilter;
  setLoadTypeFilter: (v: LoadTypeFilter) => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (v: 'asc' | 'desc') => void;
  /** Filtered rows (division/transporter/loadType), NOT sorted — feeds all summary/insight panels. */
  baseFiltered: VehicleRecord[];
  /** baseFiltered sorted by duration, for the table only. */
  sortedRows: VehicleRecord[];
  summary: AlertsSummary;
  insights: AlertsInsights;
}