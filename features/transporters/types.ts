export interface TransporterMapping {
  _id: string;
  originalName: string;
  standardName: string;
  isFix: boolean;
  isActive: boolean;
  needsReview: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface TransporterFormInput {
  originalName: string;
  standardName: string;
  isFix: boolean;
}

export interface TransportersListFilters {
  search: string;
  fixFilter: string;
  reviewOnly: boolean;
  showDeleted: boolean;
  page: number;
}

export const TRANSPORTERS_PAGE_SIZE = 20;
