import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/db/models";
import type { INotification } from "@/types";
import type { INotificationService } from "./interfaces";
import { sendWebPush } from "./web-push.service";

// ── Notification Service ────────────────────────────────────────────────────
// Dispatch router: routes notifications to correct channel(s)

const WHATSAPP_TIMEOUT_MS = 5000;

// ── Send WhatsApp via WhatsApp service HTTP API ────────────────────────────

async function dispatchWhatsApp(
  phone: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  const url = process.env.WHATSAPP_SERVICE_URL;
  const secret = process.env.WHATSAPP_SERVICE_SECRET;

  if (!url || !secret) {
    console.warn("[notification] WhatsApp service not configured — skipping");
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WHATSAPP_TIMEOUT_MS);

    const response = await fetch(`${url}/api/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": secret,
      },
      body: JSON.stringify({ phone, type, data }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `[notification] WhatsApp API error: ${response.status} ${body}`,
      );
    }
  } catch (err) {
    // Fire-and-forget: log but don't throw
    console.error("[notification] WhatsApp dispatch failed:", (err as Error).message);
  }
}

// ── Dispatch to Web Push ───────────────────────────────────────────────────

async function dispatchWebPush(
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<void> {
  try {
    await sendWebPush(userId, { title, body, url });
  } catch (err) {
    console.error("[notification] Web push dispatch failed:", (err as Error).message);
  }
}

// ── Create in-app notification record ──────────────────────────────────────

async function createInAppNotification(
  recipientId: string,
  type: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>,
  recipientPhone?: string,
): Promise<INotification> {
  await connectDB();

  const doc = await Notification.create({
    recipientId,
    recipientPhone: recipientPhone || undefined,
    channel: "in_app",
    type,
    title,
    body,
    metadata: metadata || undefined,
    isRead: false,
    sentAt: new Date(),
  });

  return doc.toObject() as INotification;
}

// ── Main dispatch function ─────────────────────────────────────────────────

export interface SendNotificationInput {
  recipientId: string;
  recipientPhone?: string;
  channel: "in_app" | "whatsapp" | "web_push";
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  /** Data passed to WhatsApp template handler */
  whatsappData?: Record<string, unknown>;
  /** URL for web push notification click */
  pushUrl?: string;
}

export async function sendNotification(
  input: SendNotificationInput,
): Promise<INotification | null> {
  const { recipientId, recipientPhone, channel, type, title, body, metadata } = input;

  switch (channel) {
    case "whatsapp": {
      if (!recipientPhone) {
        console.warn("[notification] WhatsApp channel requires recipientPhone — skipping");
        return null;
      }
      // Also create an in-app record for the audit trail
      const inAppDoc = await createInAppNotification(
        recipientId, type, title, body, metadata, recipientPhone,
      ).catch((err: Error) => {
        console.error("[notification] Failed to create in-app record:", err.message);
        return null;
      });

      // Fire-and-forget WhatsApp dispatch
      const whatsappType = mapTypeToWhatsAppType(type);
      if (whatsappType && input.whatsappData) {
        dispatchWhatsApp(recipientPhone, whatsappType, input.whatsappData).catch(
          (err: Error) => {
            console.error("[notification] WhatsApp fire-and-forget error:", err.message);
          },
        );
      }

      return inAppDoc;
    }

    case "web_push": {
      // Create in-app record
      const inAppDoc = await createInAppNotification(
        recipientId, type, title, body, metadata, recipientPhone,
      ).catch((err: Error) => {
        console.error("[notification] Failed to create in-app record:", err.message);
        return null;
      });

      // Fire-and-forget web push
      dispatchWebPush(recipientId, title, body, input.pushUrl).catch(
        (err: Error) => {
          console.error("[notification] Web push fire-and-forget error:", err.message);
        },
      );

      return inAppDoc;
    }

    case "in_app":
    default: {
      return createInAppNotification(
        recipientId, type, title, body, metadata, recipientPhone,
      );
    }
  }
}

// ── Map internal types to WhatsApp template types ─────────────────────────

function mapTypeToWhatsAppType(type: string): string | null {
  const map: Record<string, string> = {
    pickup: "pickup",
    dropoff: "dropoff",
    delay: "delay",
    eta: "eta",
    payment_reminder: "payment_reminder",
    trip_started: "pickup",
    trip_completed: "dropoff",
    trip_delayed: "delay",
  };
  return map[type] || null;
}

// ── Query helpers ──────────────────────────────────────────────────────────

export async function getUserNotifications(
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
): Promise<{
  notifications: INotification[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await connectDB();
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 50);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { recipientId: userId };
  if (options.unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Notification.countDocuments(filter).exec(),
  ]);

  return {
    notifications: notifications as INotification[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  await connectDB();
  await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isRead: true },
  ).exec();
}

export async function markAllAsRead(userId: string): Promise<number> {
  await connectDB();
  const result = await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true },
  ).exec();
  return result.modifiedCount;
}

export async function getUnreadCount(userId: string): Promise<number> {
  await connectDB();
  return Notification.countDocuments({
    recipientId: userId,
    isRead: false,
  }).exec();
}

// ── INotificationService implementation ────────────────────────────────────

export class NotificationService implements INotificationService {
  async sendInApp(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ): Promise<INotification> {
    return createInAppNotification(userId, type, title, body, metadata);
  }

  async sendWhatsApp(phone: string, type: string, body: string): Promise<void> {
    // For the INotificationService interface compatibility,
    // we send a generic "system" type if mapping fails
    const whatsappType = mapTypeToWhatsAppType(type) || type;
    await dispatchWhatsApp(phone, whatsappType, { body });
  }

  async getUnread(userId: string): Promise<INotification[]> {
    const result = await getUserNotifications(userId, { unreadOnly: true });
    return result.notifications;
  }

  async markRead(notificationId: string): Promise<void> {
    await connectDB();
    await Notification.findByIdAndUpdate(notificationId, { isRead: true }).exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
