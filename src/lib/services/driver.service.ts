import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { Driver, Trip, Route, GpsLocation, Student, User } from "@/lib/db/models";
import { NotFoundError, AppError, ConflictError } from "@/lib/errors";
import type { IDriverService } from "./interfaces";
import type { IDriver, ITrip } from "@/types";
import type { UserRole } from "@/types/enums";
import mongoose from "mongoose";
import { normalizePhone } from "@/lib/utils/phone";

// ── Helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d = new Date()): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function endOfDay(d = new Date()): Date {
  const t = startOfDay(d);
  t.setDate(t.getDate() + 1);
  return t;
}

async function sendWhatsAppNotification(
  phone: string,
  type: "pickup" | "dropoff",
  data: Record<string, unknown>
): Promise<void> {
  const url = process.env.WHATSAPP_SERVICE_URL;
  const secret = process.env.WHATSAPP_SERVICE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(`${url}/api/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": secret,
      },
      body: JSON.stringify({ phone, type, data }),
    });
  } catch (err) {
    console.error("[driver.service] WhatsApp notification failed:", err);
  }
}

// ── Service ─────────────────────────────────────────────────────────────────

export class DriverService implements IDriverService {
  // ── register ────────────────────────────────────────────────────────────────

  async register(data: {
    phone: string;
    name: string;
    cnic: string;
    vehicleType: string;
    vehicleCapacity: number;
    vehicleRegNumber: string;
    city: string;
    userId: string;
    licenseUrl?: string;
    licenseFrontUrl?: string;
    licenseBackUrl?: string;
    cnicFrontUrl?: string;
    cnicBackUrl?: string;
  }): Promise<IDriver> {
    await connectDB();

    const existing = await Driver.findOne({ userId: data.userId }).lean();
    if (existing) throw new ConflictError("Driver profile already exists");

    const cnicExists = await Driver.findOne({ cnic: data.cnic }).lean();
    if (cnicExists) throw new ConflictError("CNIC already registered");

    const driver = await Driver.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      name: data.name,
      phone: data.phone,
      cnic: data.cnic,
      vehicleType: data.vehicleType,
      vehicleCapacity: data.vehicleCapacity,
      vehicleRegNumber: data.vehicleRegNumber,
      city: data.city,
      licenseUrl: data.licenseUrl || undefined,
      licenseFrontUrl: data.licenseFrontUrl || undefined,
      licenseBackUrl: data.licenseBackUrl || undefined,
      cnicFrontUrl: data.cnicFrontUrl || undefined,
      cnicBackUrl: data.cnicBackUrl || undefined,
      isApproved: false,
      status: "pending",
      assignedRouteIds: [],
    });

    // One phone = one account. Claim the driver role so this number can't
    // double as a student account.
    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(data.userId) },
      { $set: { role: "driver" as UserRole, isVerified: true, isActive: true } },
    );

    return driver.toObject() as IDriver;
  }

  // ── createDriverByAdmin ─────────────────────────────────────────────────────

  /**
   * Admin-created driver: provisions a driver user account (if none exists for
   * the phone) and registers the driver profile with immediate approval.
   */
  async createDriverByAdmin(data: {
    phone: string;
    name: string;
    cnic: string;
    vehicleType: string;
    vehicleCapacity: number;
    vehicleRegNumber: string;
    city: string;
    licenseUrl?: string;
    licenseFrontUrl?: string;
    licenseBackUrl?: string;
    cnicFrontUrl?: string;
    cnicBackUrl?: string;
  }): Promise<IDriver> {
    await connectDB();

    const phone = normalizePhone(data.phone);

    const cnicExists = await Driver.findOne({ cnic: data.cnic }).lean();
    if (cnicExists) throw new ConflictError("CNIC already registered");

    let user = await User.findOne({ phone });
    if (user) {
      if (user.role === "admin") {
        throw new ConflictError("A user with this phone already exists as an admin");
      }
      const existingDriver = await Driver.findOne({ userId: user._id }).lean();
      if (existingDriver) {
        throw new ConflictError("Driver profile already exists for this phone");
      }
      user.role = "driver" as UserRole;
      user.isVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      const tempPassword = randomBytes(12).toString("base64url");
      const passwordHash = await hash(tempPassword, 12);
      user = await User.create({
        phone,
        role: "driver" as UserRole,
        isVerified: true,
        isActive: true,
        passwordHash,
      });
    }

    const driver = await Driver.create({
      userId: user._id,
      name: data.name,
      phone,
      cnic: data.cnic,
      vehicleType: data.vehicleType,
      vehicleCapacity: data.vehicleCapacity,
      vehicleRegNumber: data.vehicleRegNumber,
      city: data.city,
      licenseUrl: data.licenseUrl || undefined,
      licenseFrontUrl: data.licenseFrontUrl || undefined,
      licenseBackUrl: data.licenseBackUrl || undefined,
      cnicFrontUrl: data.cnicFrontUrl || undefined,
      cnicBackUrl: data.cnicBackUrl || undefined,
      isApproved: true,
      status: "approved",
      assignedRouteIds: [],
    });

    return driver.toObject() as IDriver;
  }

  // ── approveDriver ───────────────────────────────────────────────────────────

  async approveDriver(id: string): Promise<void> {
    await connectDB();
    const driver = await Driver.findByIdAndUpdate(id, {
      isApproved: true,
      status: "approved",
    });
    if (!driver) throw new NotFoundError("Driver");
  }

  // ── rejectDriver ────────────────────────────────────────────────────────────

  async rejectDriver(id: string, _reason: string): Promise<void> {
    await connectDB();
    const driver = await Driver.findByIdAndUpdate(id, {
      isApproved: false,
      status: "rejected",
    });
    if (!driver) throw new NotFoundError("Driver");
  }

  // ── getDriverByUserId ────────────────────────────────────────────────────────

  async getDriverByUserId(userId: string): Promise<IDriver | null> {
    await connectDB();
    return Driver.findOne({ userId }).lean() as Promise<IDriver | null>;
  }

  // ── getProfile ──────────────────────────────────────────────────────────────

  async getProfile(driverId: string): Promise<{
    driver: IDriver;
    routes: Array<{ _id: string; name: string; city: string; timeSlots: string[] }>;
  }> {
    await connectDB();
    const driver = await Driver.findById(driverId).lean() as IDriver | null;
    if (!driver) throw new NotFoundError("Driver");

    let routes: Array<{ _id: string; name: string; city: string; timeSlots: string[] }> = [];
    if (driver.assignedRouteIds?.length) {
      routes = await Route.find({ _id: { $in: driver.assignedRouteIds } })
        .select("name city timeSlots")
        .lean()
        .then((docs) =>
          docs.map((d) => ({
            _id: String(d._id),
            name: d.name,
            city: d.city,
            timeSlots: d.timeSlots,
          }))
        );
    }

    return { driver, routes };
  }

  // ── updateProfile ───────────────────────────────────────────────────────────

  async updateProfile(driverId: string, data: Partial<IDriver>): Promise<IDriver> {
    await connectDB();
    const allowed: (keyof IDriver)[] = [
      "name", "vehicleType", "vehicleCapacity", "vehicleRegNumber",
      "licenseUrl", "licenseFrontUrl", "licenseBackUrl",
      "cnicFrontUrl", "cnicBackUrl",
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    const driver = await Driver.findByIdAndUpdate(driverId, update, { new: true }).lean();
    if (!driver) throw new NotFoundError("Driver");
    return driver as IDriver;
  }

  // ── getTodayTrips ───────────────────────────────────────────────────────────

  async getTodayTrips(driverId: string): Promise<ITrip[]> {
    await connectDB();
    const today = startOfDay();
    const tomorrow = endOfDay();

    const trips = await Trip.find({
      driverId: new mongoose.Types.ObjectId(driverId),
      date: { $gte: today, $lt: tomorrow },
    })
      .populate("students.studentId", "name phone parentPhone pickupAddress")
      .sort({ timeSlot: 1 })
      .lean() as ITrip[];

    return trips;
  }

  // ── markPickup ──────────────────────────────────────────────────────────────

  async markPickup(tripId: string, studentId: string, driverId: string): Promise<ITrip> {
    await connectDB();

    const trip = await Trip.findOne({
      _id: new mongoose.Types.ObjectId(tripId),
      driverId: new mongoose.Types.ObjectId(driverId),
    });

    if (!trip) throw new NotFoundError("Trip");
    if (trip.status === "completed" || trip.status === "cancelled") {
      throw new AppError("Trip is already completed or cancelled", 400);
    }

    // If trip is scheduled, mark it in-progress
    if (trip.status === "scheduled") {
      trip.status = "in_progress";
      trip.startedAt = new Date();
    }

    const studentEntry = trip.students.find(
      (s: { studentId: unknown; status: string }) => String(s.studentId) === studentId
    );
    if (!studentEntry) throw new NotFoundError("Student in trip");
    if (studentEntry.status === "picked_up") {
      throw new AppError("Student already picked up", 400);
    }

    studentEntry.status = "picked_up";
    studentEntry.pickedUpAt = new Date();
    await trip.save();

    // WhatsApp notification
    const student = await Student.findById(studentId).lean();
    if (student?.parentPhone) {
      const route = await Route.findById(trip.routeId).lean();
      await sendWhatsAppNotification(student.parentPhone, "pickup", {
        studentName: student.name,
        time: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
        routeName: route?.name || "",
        institute: student.institute,
      });
    }

    return trip.toObject() as ITrip;
  }

  // ── markDropoff ─────────────────────────────────────────────────────────────

  async markDropoff(tripId: string, studentId: string, driverId: string): Promise<ITrip> {
    await connectDB();

    const trip = await Trip.findOne({
      _id: new mongoose.Types.ObjectId(tripId),
      driverId: new mongoose.Types.ObjectId(driverId),
    });

    if (!trip) throw new NotFoundError("Trip");

    const studentEntry = trip.students.find(
      (s: { studentId: unknown; status: string }) => String(s.studentId) === studentId
    );
    if (!studentEntry) throw new NotFoundError("Student in trip");
    if (studentEntry.status !== "picked_up") {
      throw new AppError("Student must be picked up before dropoff", 400);
    }

    studentEntry.status = "dropped_off";
    studentEntry.droppedOffAt = new Date();
    await trip.save();

    // WhatsApp notification
    const student = await Student.findById(studentId).lean();
    if (student?.parentPhone) {
      const route = await Route.findById(trip.routeId).lean();
      await sendWhatsAppNotification(student.parentPhone, "dropoff", {
        studentName: student.name,
        time: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
        routeName: route?.name || "",
        institute: student.institute,
      });
    }

    return trip.toObject() as ITrip;
  }

  // ── completeTrip ────────────────────────────────────────────────────────────

  async completeTrip(tripId: string, driverId: string): Promise<ITrip> {
    await connectDB();
    const trip = await Trip.findOne({
      _id: new mongoose.Types.ObjectId(tripId),
      driverId: new mongoose.Types.ObjectId(driverId),
    });
    if (!trip) throw new NotFoundError("Trip");

    trip.status = "completed";
    trip.completedAt = new Date();
    await trip.save();
    return trip.toObject() as ITrip;
  }

  // ── updateLocation ──────────────────────────────────────────────────────────

  async updateLocation(
    driverId: string,
    lng: number,
    lat: number,
    speed?: number
  ): Promise<void> {
    await connectDB();

    const now = new Date();

    // Update driver's currentLocation
    await Driver.findByIdAndUpdate(driverId, {
      currentLocation: { type: "Point", coordinates: [lng, lat] },
      lastLocationUpdate: now,
    });

    // Store in GPS log
    await GpsLocation.create({
      driverId: new mongoose.Types.ObjectId(driverId),
      location: { type: "Point", coordinates: [lng, lat] },
      speed: speed ?? 0,
      timestamp: now,
    });
  }

  // ── getEarnings ─────────────────────────────────────────────────────────────

  async getEarnings(
    driverId: string,
    month?: number,
    year?: number
  ): Promise<{
    totalEarnings: number;
    tripCount: number;
    monthlyHistory: Array<{
      month: string;
      year: number;
      monthNum: number;
      tripCount: number;
      totalEarnings: number;
    }>;
  }> {
    await connectDB();

    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 1);

    // Find routes assigned to this driver
    const driver = await Driver.findById(driverId).lean();
    if (!driver) throw new NotFoundError("Driver");

    const routeIds = (driver.assignedRouteIds || []).map(String);

    // Completed trips for current month
    const monthTrips = await Trip.find({
      driverId: new mongoose.Types.ObjectId(driverId),
      status: "completed",
      completedAt: { $gte: start, $lt: end },
    }).lean();

    // Each completed trip = base earning per student picked up
    // For now we count trips × students × a fixed per-student fare
    // In real MVP the amount comes from zone/route pricing.
    // We'll aggregate trip count and use a placeholder calculation.
    const studentsThisMonth = monthTrips.reduce((acc: number, t: { students: Array<{ status: string }> }) => {
      return acc + t.students.filter((s: { status: string }) => s.status === "dropped_off").length;
    }, 0);

    // Fetch route pricing to compute earnings
    let totalEarnings = 0;
    if (routeIds.length > 0) {
      const routes = await Route.find({ _id: { $in: routeIds } }).lean();
      // Use first route's zone pricing as proxy
      const routeMap = new Map(routes.map((r) => [String(r._id), r]));

      for (const trip of monthTrips) {
        const route = routeMap.get(String(trip.routeId));
        if (!route) continue;
        // Count dropped-off students × a base fare (non-ac default: ~2500 PKR/month per student)
        const droppedCount = trip.students.filter((s: { status: string }) => s.status === "dropped_off").length;
        // Approximate daily fare = monthly / 22 working days
        totalEarnings += droppedCount * 120; // ~PKR 120 per trip per student as rough driver earning
      }
    }

    // Build 6-month history
    const monthlyHistory: Array<{
      month: string;
      year: number;
      monthNum: number;
      tripCount: number;
      totalEarnings: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const histTrips = await Trip.find({
        driverId: new mongoose.Types.ObjectId(driverId),
        status: "completed",
        completedAt: { $gte: mStart, $lt: mEnd },
      }).lean();

      const hDroppedCount = histTrips.reduce(
        (acc: number, t: { students: Array<{ status: string }> }) => acc + t.students.filter((s: { status: string }) => s.status === "dropped_off").length,
        0
      );

      monthlyHistory.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        tripCount: histTrips.length,
        totalEarnings: hDroppedCount * 120,
      });
    }

    return {
      totalEarnings,
      tripCount: monthTrips.length,
      monthlyHistory,
    };
  }

  // ── createDailyTrips ────────────────────────────────────────────────────────

  async createDailyTrips(data: {
    routeId: string;
    driverId: string;
    timeSlot: string;
    direction: string;
    studentIds: string[];
  }): Promise<ITrip> {
    await connectDB();

    const today = startOfDay();

    // Prevent duplicate
    const existing = await Trip.findOne({
      routeId: new mongoose.Types.ObjectId(data.routeId),
      driverId: new mongoose.Types.ObjectId(data.driverId),
      date: today,
      timeSlot: data.timeSlot,
      direction: data.direction,
    }).lean();

    if (existing) throw new ConflictError("Trip already exists for this route/slot/direction today");

    const students = data.studentIds.map((sid) => ({
      studentId: new mongoose.Types.ObjectId(sid),
      status: "pending" as const,
    }));

    const trip = await Trip.create({
      routeId: new mongoose.Types.ObjectId(data.routeId),
      driverId: new mongoose.Types.ObjectId(data.driverId),
      date: today,
      timeSlot: data.timeSlot,
      direction: data.direction,
      status: "scheduled",
      students,
      gpsTrail: [],
      delayMinutes: 0,
    });

    return trip.toObject() as ITrip;
  }

  // ── getTripDetails ──────────────────────────────────────────────────────────

  async getTripDetails(tripId: string): Promise<ITrip & { route?: { name: string }; students?: unknown[] }> {
    await connectDB();
    const trip = await Trip.findById(tripId)
      .populate("students.studentId", "name phone parentPhone pickupAddress")
      .populate("routeId", "name city")
      .lean() as ITrip | null;
    if (!trip) throw new NotFoundError("Trip");
    return trip;
  }

  // ── list drivers (admin) ────────────────────────────────────────────────────

  async listDrivers(page = 1, pageSize = 20) {
    await connectDB();
    const skip = (page - 1) * pageSize;
    const [data, totalItems] = await Promise.all([
      Driver.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Driver.countDocuments().exec(),
    ]);
    return {
      data: data as IDriver[],
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems,
      },
    };
  }
}

export const driverService = new DriverService();
