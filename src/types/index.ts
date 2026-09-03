import type { Types } from "mongoose";
import type {
  UserRole,
  StudentStatus,
  DriverStatus,
  RouteStatus,
  RouteCandidateStatus,
  TripStatus,
  TripDirection,
  PaymentStatus,
  NotificationChannel,
  NotificationType,
  VehicleType,
  TimeSlot,
  DayOfWeek,
} from "./enums";

// Re-export for convenience
export type {
  UserRole,
  StudentStatus,
  DriverStatus,
  RouteStatus,
  RouteCandidateStatus,
  TripStatus,
  TripDirection,
  PaymentStatus,
  NotificationChannel,
  NotificationType,
  VehicleType,
  TimeSlot,
  DayOfWeek,
};

// String literal types for Mongoose schema compatibility
type RoleString = `${UserRole}`;
type StudentStatusString = `${StudentStatus}`;
type DriverStatusString = `${DriverStatus}`;
type RouteStatusString = `${RouteStatus}`;
type RouteCandidateStatusString = `${RouteCandidateStatus}`;
type TripStatusString = `${TripStatus}`;
type TripDirectionString = `${TripDirection}`;
type PaymentStatusString = `${PaymentStatus}`;
type NotificationChannelString = `${NotificationChannel}`;
type NotificationTypeString = `${NotificationType}`;
type VehicleTypeString = `${VehicleType}`;
type TimeSlotString = `${TimeSlot}`;
type DayOfWeekString = `${DayOfWeek}`;

// ===== GeoJSON =====
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

// ===== User =====
export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: RoleString;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  pushSubscriptions: IPushSubscription[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== Student =====
export interface IStudent {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  phone: string;
  parentPhone?: string;
  pickupLocation: GeoPoint;
  pickupAddress: string;
  institute: string;
  city: string;
  classStartTime: string;
  classEndTime: string;
  permanentOffDays: DayOfWeekString[];
  suddenOffDays: string[];
  assignedRouteId?: Types.ObjectId;
  status: StudentStatusString;
  paymentStatus: PaymentStatusString;
  billingCycleStart?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Driver =====
export interface IDriver {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  phone: string;
  cnic: string;
  vehicleType: VehicleTypeString;
  vehicleCapacity: number;
  vehicleRegNumber: string;
  licenseUrl?: string;
  policeVerificationUrl?: string;
  isApproved: boolean;
  assignedRouteIds: Types.ObjectId[];
  city: string;
  currentLocation?: GeoPoint;
  lastLocationUpdate?: Date;
  status: DriverStatusString;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Route =====
export interface IVanAssignment {
  driverId: Types.ObjectId;
  studentIds: Types.ObjectId[];
  capacity: number;
  pickupSequence: GeoPoint[];
}

export interface IRoute {
  _id: Types.ObjectId;
  name: string;
  city: string;
  zoneId?: Types.ObjectId;
  institutes: string[];
  centroid: GeoPoint;
  radiusKm: number;
  timeSlots: TimeSlotString[];
  vans: IVanAssignment[];
  totalStudents: number;
  minStudents: number;
  status: RouteStatusString;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Route Candidate =====
export interface IRouteCandidate {
  _id: Types.ObjectId;
  city: string;
  institutes: string[];
  centroid: GeoPoint;
  studentIds: Types.ObjectId[];
  suggestedSequence: GeoPoint[];
  matchCount: number;
  timeSlot: TimeSlotString;
  departureTime: string;
  status: RouteCandidateStatusString;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Trip =====
export interface ITripStudent {
  studentId: Types.ObjectId;
  status: "pending" | "picked_up" | "dropped_off" | "absent";
  pickedUpAt?: Date;
  droppedOffAt?: Date;
}

export interface IGpsPoint {
  location: GeoPoint;
  timestamp: Date;
}

export interface ITrip {
  _id: Types.ObjectId;
  routeId: Types.ObjectId;
  driverId: Types.ObjectId;
  date: Date;
  timeSlot: TimeSlotString;
  direction: TripDirectionString;
  status: TripStatusString;
  students: ITripStudent[];
  gpsTrail: IGpsPoint[];
  startedAt?: Date;
  completedAt?: Date;
  delayMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Payment =====
export interface IPayment {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  routeId: Types.ObjectId;
  amount: number;
  platformFee: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  receiptUrl?: string;
  status: PaymentStatusString;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  remindersSent: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== City =====
export interface ICity {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Zone =====
export interface IZone {
  _id: Types.ObjectId;
  cityId: Types.ObjectId;
  name: string;
  acPrice: number;
  nonAcPrice: number;
  commissionPercent: number;
  platformFee: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Notification =====
export interface INotification {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipientPhone?: string;
  channel: NotificationChannelString;
  type: NotificationTypeString;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  sentAt: Date;
  createdAt: Date;
}

// ===== OTP =====
export interface IOtp {
  _id: Types.ObjectId;
  phone: string;
  code: string;
  purpose: string;
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

// ===== GPS Location =====
export interface IGpsLocation {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  routeId?: Types.ObjectId;
  location: GeoPoint;
  speed?: number;
  timestamp: Date;
  createdAt: Date;
}

// ===== Settings =====
export interface ISettings {
  _id: Types.ObjectId;
  cityId: Types.ObjectId;
  clusterRadiusKm: number;
  minStudentsPerRoute: number;
  maxTimeSlots: number;
  defaultCommissionPercent: number;
  defaultPlatformFee: number;
  paymentReminderDaysBefore: number;
  createdAt: Date;
  updatedAt: Date;
}
