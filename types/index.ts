// ─── Roles & Permissions ──────────────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'associate' | 'user';

export const ROLES = {
  ADMIN:     'admin',
  MANAGER:   'manager',
  ASSOCIATE: 'associate',
  USER:      'user',
} as const;

export const PERMISSIONS = {
  MANAGE_USERS:     ['admin'] as UserRole[],
  VIEW_USERS:       ['admin', 'manager'] as UserRole[],
  UPLOAD_FILES:     ['admin', 'manager', 'associate'] as UserRole[],
  VIEW_UPLOADS:     ['admin', 'manager', 'associate', 'user'] as UserRole[],
  DELETE_UPLOADS:   ['admin'] as UserRole[],
  VIEW_VEHICLES:    ['admin', 'manager', 'associate', 'user'] as UserRole[],
  EDIT_VEHICLES:    ['admin', 'manager'] as UserRole[],
  DELETE_VEHICLES:  ['admin'] as UserRole[],
  VIEW_REPORTS:     ['admin', 'manager', 'associate', 'user'] as UserRole[],
  EXPORT_REPORTS:   ['admin', 'manager', 'associate'] as UserRole[],
  MANAGE_SETTINGS:  ['admin'] as UserRole[],
  VIEW_AUDIT_LOGS:  ['admin'] as UserRole[],
} as const;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadRecord {
  _id: string;
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
  sheetName?: string;
  processedAt?: string;
  errorMessage?: string;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export interface VehicleRecord {
  _id: string;
  uniqueId: string;
  // Raw columns from Excel (all 18)
  documentNumber: string;
  warehouseNumber: string;
  endCustName: string;
  containerNo: string;
  vehicleNo: string;
  gateInDate?: string;
  exciseOutDate?: string;
  gateExciseDiff?: string;
  loadingStartTime?: string;
  loadingEndTime?: string;
  loadingTimeDiff?: string;
  transporterRaw: string;
  detentionReason?: string;
  otherReason?: string;
  customerName: string;
  wllWeighIn?: string;
  wllWeighOut?: string;
  weighDiffRaw?: string;
  // Cleaned / calculated fields
  division: string;
  transporter: string;
  isFix: boolean;
  isMapped: boolean;
  diffHours: number;
  diffStr?: string;
  isOver25h: boolean;
  hasIncompleteData: boolean;
  year: number;
  month: number;
  dayOfWeek: number;
  // Meta
  uploadId: string;
  sourceRow?: number;
  createdAt: string;
  updatedAt?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  total: number;
  over25: number;
  fixLoads: number;
  nonFixLoads: number;
  avgHours: number;
  maxHours: number;
  uniqueVehicles: number;
  uniqueTransporters: number;
  uniqueDivisions: number;
  violationRate: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  count: number;
  over25: number;
}

export interface DailyTrend {
  date: string;
  count: number;
  over25: number;
}

export interface DivisionStats {
  division: string;
  total: number;
  fix: number;
  nonFix: number;
  over25: number;
  avgHours: number;
  violationRate: number;
}

export interface TransporterStats {
  transporter: string;
  total: number;
  fix: number;
  over25: number;
  avgHours: number;
  maxHours: number;
  violationRate: number;
}

export interface DashboardOverview {
  kpis: DashboardKPIs;
  monthly: MonthlyTrend[];
  daily: DailyTrend[];
  byDivision: DivisionStats[];
  byTransporter: TransporterStats[];
  byDayOfWeek: { dayOfWeek: number; count: number }[];
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface DashboardFilters {
  year?: string;
  month?: string;
  division?: string;
  transporter?: string;
  isFix?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ─── User Management ──────────────────────────────────────────────────────────
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}
