export enum UserRole {
  STUDENT = "student",
  DRIVER = "driver",
  ADMIN = "admin",
}

export enum StudentStatus {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum DriverStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

export enum RouteStatus {
  CANDIDATE = "candidate",
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum RouteCandidateStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum TripStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TripDirection {
  PICKUP = "pickup",
  DROPOFF = "dropoff",
}

export enum PaymentStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  VERIFIED = "verified",
  REJECTED = "rejected",
  OVERDUE = "overdue",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  WHATSAPP = "whatsapp",
  WEB_PUSH = "web_push",
  SMS = "sms",
}

export enum NotificationType {
  TRIP_STARTED = "trip_started",
  TRIP_COMPLETED = "trip_completed",
  TRIP_DELAYED = "trip_delayed",
  PICKUP = "pickup",
  DROPOFF = "dropoff",
  DELAY = "delay",
  ETA = "eta",
  PAYMENT_REMINDER = "payment_reminder",
  PAYMENT_VERIFIED = "payment_verified",
  PAYMENT_REJECTED = "payment_rejected",
  ROUTE_ASSIGNED = "route_assigned",
  ROUTE_ACTIVATED = "route_activated",
  ROUTE_MATCHED = "route_matched",
  DRIVER_APPROVED = "driver_approved",
  OTP = "otp",
  SYSTEM = "system",
}

export enum VehicleType {
  VAN = "van",
  MINI_BUS = "mini_bus",
  BUS = "bus",
  CAR = "car",
}

export enum TimeSlot {
  MORNING = "morning",
  AFTERNOON = "afternoon",
  EVENING = "evening",
}

export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}
