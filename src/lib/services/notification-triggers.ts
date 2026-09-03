import { connectDB } from "@/lib/db/connection";
import { Student, Driver, Trip, Route } from "@/lib/db/models";
import { sendNotification, notificationService } from "./notification.service";
import {
  pickupWhatsApp,
  pickupInApp,
  dropoffWhatsApp,
  dropoffInApp,
  delayWhatsApp,
  delayInApp,
  paymentReminderWhatsApp,
  paymentReminderInApp,
  routeActivatedWhatsApp,
  routeActivatedWebPush,
  routeActivatedInApp,
  driverApprovedInApp,
} from "./notification-templates";
import type {
  PickupData,
  DropoffData,
  DelayData,
  PaymentReminderData,
  RouteActivatedData,
} from "./notification-templates";

// ── Helper: get student with parent phone ──────────────────────────────────

interface StudentWithParent {
  _id: string;
  userId: string;
  name: string;
  parentPhone?: string;
  institute: string;
}

async function getStudentInfo(studentId: string): Promise<StudentWithParent | null> {
  await connectDB();
  const student = await Student.findById(studentId).lean();
  if (!student) return null;
  return {
    _id: String(student._id),
    userId: String(student.userId),
    name: student.name,
    parentPhone: student.parentPhone || undefined,
    institute: student.institute,
  };
}

// ── Helper: get driver name ────────────────────────────────────────────────

async function getDriverName(driverId: string): Promise<string> {
  await connectDB();
  const driver = await Driver.findById(driverId).lean();
  return driver?.name || "Driver";
}

// ── onStudentPickedUp ──────────────────────────────────────────────────────

export async function onStudentPickedUp(
  tripId: string,
  studentId: string,
): Promise<void> {
  try {
    const student = await getStudentInfo(studentId);
    if (!student) return;

    const trip = await Trip.findById(tripId).lean();
    const driverName = trip ? await getDriverName(String(trip.driverId)) : "Driver";
    const time = new Date().toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const data: PickupData = {
      studentName: student.name,
      driverName,
      time,
    };

    // WhatsApp to parent
    if (student.parentPhone) {
      const whatsappContent = pickupWhatsApp(data);
      await sendNotification({
        recipientId: student.userId,
        recipientPhone: student.parentPhone,
        channel: "whatsapp",
        type: "pickup",
        title: whatsappContent.title,
        body: whatsappContent.body,
        metadata: { tripId, studentId },
        whatsappData: {
          studentName: data.studentName,
          time: data.time,
          routeName: "",
        },
      });
    }

    // In-app to student
    const inAppContent = pickupInApp(data);
    await notificationService.sendInApp(
      student.userId,
      "pickup",
      inAppContent.title,
      inAppContent.body,
      { tripId, studentId },
    );
  } catch (err) {
    console.error("[triggers] onStudentPickedUp failed:", (err as Error).message);
  }
}

// ── onStudentDroppedOff ────────────────────────────────────────────────────

export async function onStudentDroppedOff(
  tripId: string,
  studentId: string,
): Promise<void> {
  try {
    const student = await getStudentInfo(studentId);
    if (!student) return;

    const trip = await Trip.findById(tripId).lean();
    const driverName = trip ? await getDriverName(String(trip.driverId)) : "Driver";
    const time = new Date().toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const data: DropoffData = {
      studentName: student.name,
      institute: student.institute,
      time,
    };

    // WhatsApp to parent
    if (student.parentPhone) {
      const whatsappContent = dropoffWhatsApp(data);
      await sendNotification({
        recipientId: student.userId,
        recipientPhone: student.parentPhone,
        channel: "whatsapp",
        type: "dropoff",
        title: whatsappContent.title,
        body: whatsappContent.body,
        metadata: { tripId, studentId },
        whatsappData: {
          studentName: data.studentName,
          institute: data.institute,
          time: data.time,
          routeName: "",
        },
      });
    }

    // In-app to student
    const inAppContent = dropoffInApp(data);
    await notificationService.sendInApp(
      student.userId,
      "dropoff",
      inAppContent.title,
      inAppContent.body,
      { tripId, studentId },
    );
  } catch (err) {
    console.error("[triggers] onStudentDroppedOff failed:", (err as Error).message);
  }
}

// ── onTripDelayed ──────────────────────────────────────────────────────────

export async function onTripDelayed(
  tripId: string,
  delayMinutes: number,
): Promise<void> {
  try {
    await connectDB();
    const trip = await Trip.findById(tripId)
      .populate("students.studentId", "name userId parentPhone")
      .lean();

    if (!trip) return;

    const driverName = await getDriverName(String(trip.driverId));
    const newEta = new Date(Date.now() + delayMinutes * 60_000).toLocaleTimeString(
      "en-PK",
      { hour: "2-digit", minute: "2-digit" },
    );

    const data: DelayData = { driverName, delayMinutes, newEta };

    // WhatsApp to all parents on trip
    const students = trip.students as Array<{
      studentId: { name: string; userId: string; parentPhone?: string } | null;
      status: string;
    }>;

    for (const entry of students) {
      if (!entry.studentId) continue;
      const studentDoc = entry.studentId;

      if (studentDoc.parentPhone) {
        const whatsappContent = delayWhatsApp(data);
        await sendNotification({
          recipientId: studentDoc.userId,
          recipientPhone: studentDoc.parentPhone,
          channel: "whatsapp",
          type: "delay",
          title: whatsappContent.title,
          body: whatsappContent.body,
          metadata: { tripId, delayMinutes },
          whatsappData: {
            routeName: "",
            minutes: delayMinutes,
            reason: "Traffic delay",
            newEta,
          },
        });
      }

      // In-app to student
      const inAppContent = delayInApp(data);
      await notificationService.sendInApp(
        studentDoc.userId,
        "delay",
        inAppContent.title,
        inAppContent.body,
        { tripId, delayMinutes },
      );
    }
  } catch (err) {
    console.error("[triggers] onTripDelayed failed:", (err as Error).message);
  }
}

// ── onRouteActivated ───────────────────────────────────────────────────────

export async function onRouteActivated(routeId: string): Promise<void> {
  try {
    await connectDB();
    const route = await Route.findById(routeId).lean();
    if (!route) return;

    // Get assigned driver
    let driverName = "To be assigned";
    if (route.vans?.length > 0 && route.vans[0].driverId) {
      driverName = await getDriverName(String(route.vans[0].driverId));
    }

    const pickupTime = route.timeSlots?.[0] || "morning";

    const data: RouteActivatedData = {
      routeName: route.name,
      driverName,
      pickupTime,
    };

    // Get students on this route
    const students = await Student.find({ assignedRouteId: routeId }).lean();

    for (const student of students) {
      const userId = String(student.userId);

      // WhatsApp to parent
      if (student.parentPhone) {
        const whatsappContent = routeActivatedWhatsApp(data);
        await sendNotification({
          recipientId: userId,
          recipientPhone: student.parentPhone,
          channel: "whatsapp",
          type: "route_activated",
          title: whatsappContent.title,
          body: whatsappContent.body,
          metadata: { routeId },
          whatsappData: {
            studentName: student.name,
            time: pickupTime,
            routeName: route.name,
          },
        });
      }

      // Web push to student
      const webPushContent = routeActivatedWebPush(data);
      await sendNotification({
        recipientId: userId,
        channel: "web_push",
        type: "route_activated",
        title: webPushContent.title,
        body: webPushContent.body,
        metadata: { routeId },
        pushUrl: "/student/dashboard",
      });

      // In-app to student
      const inAppContent = routeActivatedInApp(data);
      await notificationService.sendInApp(
        userId,
        "route_activated",
        inAppContent.title,
        inAppContent.body,
        { routeId },
      );
    }
  } catch (err) {
    console.error("[triggers] onRouteActivated failed:", (err as Error).message);
  }
}

// ── onPaymentDue ───────────────────────────────────────────────────────────

export async function onPaymentDue(
  studentId: string,
  amount: number,
  daysUntil: number,
): Promise<void> {
  try {
    const student = await getStudentInfo(studentId);
    if (!student) return;

    const data: PaymentReminderData = {
      amount,
      daysUntil,
      studentName: student.name,
    };

    // WhatsApp to parent
    if (student.parentPhone) {
      const whatsappContent = paymentReminderWhatsApp(data);
      await sendNotification({
        recipientId: student.userId,
        recipientPhone: student.parentPhone,
        channel: "whatsapp",
        type: "payment_reminder",
        title: whatsappContent.title,
        body: whatsappContent.body,
        metadata: { studentId, amount, daysUntil },
        whatsappData: {
          studentName: student.name,
          days: daysUntil,
          amount,
          dueDate: "",
        },
      });
    }

    // In-app to student
    const inAppContent = paymentReminderInApp(data);
    await notificationService.sendInApp(
      student.userId,
      "payment_reminder",
      inAppContent.title,
      inAppContent.body,
      { studentId, amount, daysUntil },
    );
  } catch (err) {
    console.error("[triggers] onPaymentDue failed:", (err as Error).message);
  }
}

// ── onDriverApproved ───────────────────────────────────────────────────────

export async function onDriverApproved(driverId: string): Promise<void> {
  try {
    await connectDB();
    const driver = await Driver.findById(driverId).lean();
    if (!driver) return;

    const userId = String(driver.userId);
    const content = driverApprovedInApp();

    await notificationService.sendInApp(
      userId,
      "driver_approved",
      content.title,
      content.body,
      { driverId },
    );
  } catch (err) {
    console.error("[triggers] onDriverApproved failed:", (err as Error).message);
  }
}
