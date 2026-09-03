import type { AuthTokens, AuthUser } from "@/types/api";
import type { IStudent, IDriver, IRoute, ITrip, IPayment, INotification } from "@/types";

// ===== OTP Service =====
export interface IOtpService {
  sendOtp(phone: string, purpose: string): Promise<void>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
}

// ===== Auth Service =====
export interface IAuthService {
  loginWithOtp(phone: string, code: string): Promise<AuthTokens & { user: AuthUser }>;
  adminLogin(email: string, password: string): Promise<AuthTokens & { user: AuthUser }>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
}

// ===== Student Service =====
export interface IStudentService {
  register(data: {
    phone: string;
    name: string;
    parentPhone?: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    institute: string;
    city: string;
    classStartTime: string;
    classEndTime: string;
    permanentOffDays?: string[];
  }): Promise<IStudent>;
  updateStudent(id: string, data: Partial<IStudent>): Promise<IStudent>;
  getStudentByUserId(userId: string): Promise<IStudent | null>;
  deactivateStudent(id: string): Promise<void>;
  markDayOff(studentId: string, date: string): Promise<void>;
}

// ===== Driver Service =====
export interface IDriverService {
  register(data: {
    phone: string;
    name: string;
    cnic: string;
    vehicleType: string;
    vehicleCapacity: number;
    vehicleRegNumber: string;
    city: string;
  }): Promise<IDriver>;
  createDriverByAdmin(data: {
    phone: string;
    name: string;
    cnic: string;
    vehicleType: string;
    vehicleCapacity: number;
    vehicleRegNumber: string;
    city: string;
    licenseUrl?: string;
    policeVerificationUrl?: string;
  }): Promise<IDriver>;
  approveDriver(id: string): Promise<void>;
  rejectDriver(id: string, reason: string): Promise<void>;
  updateLocation(driverId: string, lng: number, lat: number, speed?: number): Promise<void>;
  getDriverByUserId(userId: string): Promise<IDriver | null>;
}

// ===== Clustering Service =====
export interface IClusteringService {
  clusterStudents(city: string): Promise<Array<{
    centroid: { lat: number; lng: number };
    studentIds: string[];
    institutes: string[];
    matchCount: number;
  }>>;
}

// ===== Route Engine Service =====
export interface IRouteEngineService {
  generateCandidates(city: string): Promise<void>;
  calculateOptimalSequence(studentIds: string[]): Promise<Array<{ lat: number; lng: number }>>;
  estimateDepartureTime(classStartTime: string, sequenceLength: number): string;
}

// ===== Route Lifecycle Service =====
export interface IRouteLifecycleService {
  activateRoute(candidateId: string, name: string, driverId?: string): Promise<IRoute>;
  assignDriverToRoute(routeId: string, driverId: string, vanIndex?: number): Promise<void>;
  deactivateRoute(routeId: string): Promise<void>;
  archiveRoute(routeId: string): Promise<void>;
}

// ===== Payment Service =====
export interface IPaymentService {
  createBillingCycle(studentId: string, routeId: string, amount: number, platformFee: number, start: Date, end: Date): Promise<IPayment>;
  uploadReceipt(paymentId: string, receiptUrl: string): Promise<void>;
  verifyPayment(paymentId: string, adminId: string, approved: boolean, reason?: string): Promise<void>;
  sendReminder(paymentId: string): Promise<void>;
}

// ===== Billing Service =====
export interface IBillingService {
  generateMonthlyBills(city: string): Promise<number>;
  getStudentBilling(studentId: string): Promise<IPayment[]>;
  checkOverduePayments(): Promise<void>;
}

// ===== Upload Service =====
export interface IUploadService {
  uploadImage(file: Buffer | File, folder: string): Promise<{ url: string; publicId: string }>;
  deleteImage(publicId: string): Promise<void>;
}

// ===== Notification Service =====
export interface INotificationService {
  sendInApp(userId: string, type: string, title: string, body: string, metadata?: Record<string, unknown>): Promise<INotification>;
  sendWhatsApp(phone: string, type: string, body: string): Promise<void>;
  getUnread(userId: string): Promise<INotification[]>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}

// ===== KPI Service =====
export interface IKpiService {
  getDashboardKpi(city?: string): Promise<{
    totalStudents: number;
    activeRoutes: number;
    todayTrips: number;
    pendingPayments: number;
    revenue: number;
  }>;
  getRevenueReport(start: Date, end: Date, city?: string): Promise<{
    total: number;
    byRoute: Array<{ routeId: string; routeName: string; amount: number }>;
  }>;
}
