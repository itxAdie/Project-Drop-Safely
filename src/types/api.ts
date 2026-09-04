import type { UserRole } from "./enums";

// ===== Generic API =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ===== Auth =====
export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  role: UserRole;
}

// ===== Student =====
export interface CreateStudentRequest {
  name: string;
  phone: string;
  parentPhone?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  institute: string;
  city: string;
  classStartTime: string;
  classEndTime: string;
  permanentOffDays?: string[];
}

export interface UpdateStudentRequest {
  name?: string;
  parentPhone?: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  institute?: string;
  classStartTime?: string;
  classEndTime?: string;
  permanentOffDays?: string[];
}

// ===== Driver =====
export interface CreateDriverRequest {
  name: string;
  phone: string;
  cnic: string;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleRegNumber: string;
  city: string;
}

export interface UpdateDriverRequest {
  name?: string;
  vehicleType?: string;
  vehicleCapacity?: number;
  vehicleRegNumber?: string;
  licenseUrl?: string;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
}

// ===== Route =====
export interface ActivateRouteRequest {
  candidateId: string;
  name: string;
  driverId?: string;
}

export interface AssignDriverRequest {
  driverId: string;
  vanIndex?: number;
}

// ===== Payment =====
export interface UploadReceiptRequest {
  receiptUrl: string;
}

export interface VerifyPaymentRequest {
  approved: boolean;
  rejectionReason?: string;
}

// ===== KPI / Analytics =====
export interface DashboardKpi {
  totalStudents: number;
  activeRoutes: number;
  todayTrips: number;
  pendingPayments: number;
  revenue: number;
}
