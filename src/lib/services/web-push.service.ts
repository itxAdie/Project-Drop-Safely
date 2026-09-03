import webpush from "web-push";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import type { IPushSubscription } from "@/types";

const logger = {
  info: (...args: unknown[]) => console.log("[web-push]", ...args),
  warn: (...args: unknown[]) => console.warn("[web-push]", ...args),
  error: (...args: unknown[]) => console.error("[web-push]", ...args),
};

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@dropsafely.com";

  if (!publicKey || !privateKey) {
    logger.warn("VAPID keys not configured — web push disabled");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

// ── Subscribe ──────────────────────────────────────────────────────────────

export async function subscribeWebPush(
  userId: string,
  subscription: IPushSubscription,
): Promise<void> {
  await connectDB();

  // Check if this endpoint already exists for user
  const existing = await User.findOne({
    _id: userId,
    "pushSubscriptions.endpoint": subscription.endpoint,
  }).lean();

  if (existing) {
    logger.info("Push subscription already exists for user", userId);
    return;
  }

  await User.findByIdAndUpdate(userId, {
    $push: { pushSubscriptions: subscription },
  });

  logger.info("Push subscription added for user", userId);
}

// ── Unsubscribe ────────────────────────────────────────────────────────────

export async function unsubscribeWebPush(
  userId: string,
  endpoint: string,
): Promise<void> {
  await connectDB();

  await User.findByIdAndUpdate(userId, {
    $pull: { pushSubscriptions: { endpoint } },
  });

  logger.info("Push subscription removed for user", userId);
}

// ── Send Push ──────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendWebPush(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  ensureConfigured();

  if (!configured) {
    logger.warn("Web push not configured — skipping push for user", userId);
    return;
  }

  await connectDB();
  const user = await User.findById(userId).lean();

  if (!user?.pushSubscriptions?.length) {
    logger.info("No push subscriptions for user", userId);
    return;
  }

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    url: payload.url || "/",
  });

  const expiredEndpoints: string[] = [];

  const sendPromises = user.pushSubscriptions.map(async (sub: IPushSubscription) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        data,
        { TTL: 86400 }, // 24h TTL
      );
    } catch (err) {
      const error = err as { statusCode?: number; message?: string };

      // 410 Gone — subscription expired or unsubscribed
      if (error.statusCode === 410 || error.statusCode === 404) {
        logger.info("Removing expired push subscription", sub.endpoint);
        expiredEndpoints.push(sub.endpoint);
        return;
      }

      logger.error("Failed to send web push:", error.message || err);
    }
  });

  await Promise.allSettled(sendPromises);

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } },
    });
    logger.info(
      `Cleaned up ${expiredEndpoints.length} expired push subscription(s) for user`,
      userId,
    );
  }
}

export interface IWebPushService {
  subscribe(userId: string, subscription: IPushSubscription): Promise<void>;
  sendPush(userId: string, payload: PushPayload): Promise<void>;
}

export const webPushService: IWebPushService = {
  subscribe: subscribeWebPush,
  sendPush: sendWebPush,
};
