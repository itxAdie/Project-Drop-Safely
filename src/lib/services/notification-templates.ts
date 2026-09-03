// ── Notification Templates ──────────────────────────────────────────────────
// Content generators for each notification event type.
// Each function accepts event data and returns { title, body } per channel.

export interface TemplateOutput {
  title: string;
  body: string;
}

export interface PickupData {
  studentName: string;
  driverName: string;
  time: string;
  routeName?: string;
}

export interface DropoffData {
  studentName: string;
  institute: string;
  time: string;
  routeName?: string;
}

export interface DelayData {
  driverName: string;
  delayMinutes: number;
  newEta: string;
  routeName?: string;
}

export interface EtaData {
  driverName: string;
  minutesAway: number;
  studentName?: string;
}

export interface PaymentReminderData {
  amount: number;
  daysUntil: number;
  studentName?: string;
  dueDate?: string;
}

export interface RouteActivatedData {
  routeName: string;
  driverName: string;
  pickupTime: string;
}

export interface RouteMatchedData {
  matchedCount: number;
  area?: string;
}

// ── Pickup ──────────────────────────────────────────────────────────────────

export function pickupWhatsApp(data: PickupData): TemplateOutput {
  return {
    title: "Pickup Confirmed",
    body: `Your child ${data.studentName} has been picked up by ${data.driverName} at ${data.time}.`,
  };
}

export function pickupInApp(data: PickupData): TemplateOutput {
  return {
    title: "Student Picked Up",
    body: `${data.studentName} was picked up at ${data.time}.`,
  };
}

// ── Dropoff ─────────────────────────────────────────────────────────────────

export function dropoffWhatsApp(data: DropoffData): TemplateOutput {
  return {
    title: "Drop-off Confirmed",
    body: `Your child ${data.studentName} has been safely dropped off at ${data.institute} at ${data.time}.`,
  };
}

export function dropoffInApp(data: DropoffData): TemplateOutput {
  return {
    title: "Student Dropped Off",
    body: `${data.studentName} arrived at ${data.institute} at ${data.time}.`,
  };
}

// ── Delay ───────────────────────────────────────────────────────────────────

export function delayWhatsApp(data: DelayData): TemplateOutput {
  return {
    title: "Van Running Late",
    body: `${data.driverName}'s van is running ${data.delayMinutes} minutes late. New ETA: ${data.newEta}.`,
  };
}

export function delayInApp(data: DelayData): TemplateOutput {
  return {
    title: "Trip Delayed",
    body: `Your van is running ${data.delayMinutes} minutes late. New ETA: ${data.newEta}.`,
  };
}

// ── ETA ─────────────────────────────────────────────────────────────────────

export function etaWhatsApp(data: EtaData): TemplateOutput {
  return {
    title: "Driver Approaching",
    body: `${data.driverName} is ${data.minutesAway} minutes away from pickup.`,
  };
}

// ── Payment Reminder ────────────────────────────────────────────────────────

export function paymentReminderWhatsApp(data: PaymentReminderData): TemplateOutput {
  const dueText = data.daysUntil <= 0
    ? "is due today"
    : `is due in ${data.daysUntil} day${data.daysUntil === 1 ? "" : "s"}`;

  return {
    title: "Payment Reminder",
    body: `Your payment of ${data.amount.toLocaleString()} PKR ${dueText}${data.studentName ? ` for ${data.studentName}` : ""}.`,
  };
}

export function paymentReminderInApp(data: PaymentReminderData): TemplateOutput {
  const dueText = data.daysUntil <= 0
    ? "is due today"
    : `is due in ${data.daysUntil} day${data.daysUntil === 1 ? "" : "s"}`;

  return {
    title: "Payment Reminder",
    body: `Payment of ${data.amount.toLocaleString()} PKR ${dueText}.`,
  };
}

// ── Route Activated ─────────────────────────────────────────────────────────

export function routeActivatedWhatsApp(data: RouteActivatedData): TemplateOutput {
  return {
    title: "Route Activated",
    body: `Your route "${data.routeName}" is now active! Driver: ${data.driverName}, Pickup time: ${data.pickupTime}.`,
  };
}

export function routeActivatedWebPush(data: RouteActivatedData): TemplateOutput {
  return {
    title: "Route Activated!",
    body: `Your route "${data.routeName}" is now active. Driver: ${data.driverName}, Pickup: ${data.pickupTime}.`,
  };
}

export function routeActivatedInApp(data: RouteActivatedData): TemplateOutput {
  return {
    title: "Route Activated",
    body: `Route "${data.routeName}" is active. Driver: ${data.driverName}, Pickup: ${data.pickupTime}.`,
  };
}

// ── Route Matched ───────────────────────────────────────────────────────────

export function routeMatchedInApp(data: RouteMatchedData): TemplateOutput {
  return {
    title: "Great News!",
    body: `${data.matchedCount} students have been matched in your area${data.area ? ` (${data.area})` : ""}.`,
  };
}

// ── Driver Approved ─────────────────────────────────────────────────────────

export function driverApprovedInApp(): TemplateOutput {
  return {
    title: "Driver Approved",
    body: "Congratulations! Your driver account has been approved. You can now start accepting trips.",
  };
}
