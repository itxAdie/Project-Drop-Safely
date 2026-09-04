import { connectDB } from "@/lib/db/connection";
import { Student, Route, User } from "@/lib/db/models";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from "@/lib/errors";
import { CLUSTER_RADIUS_KM, MIN_STUDENTS_PER_ROUTE, DEPOSIT_AMOUNT } from "@/lib/constants";
import type { IStudent, IRoute } from "@/types";
import type { IStudentService } from "./interfaces";
import { normalizePhone } from "@/lib/utils/phone";
import type { UserRole } from "@/types/enums";

const studentRepo = new StudentRepository();

export class StudentService implements IStudentService {
  async register(data: {
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
  }): Promise<IStudent> {
    await connectDB();

    const normalizedPhone = normalizePhone(data.phone);

    // Find or create user
    const user = await User.findOne({ phone: normalizedPhone }).lean().exec();
    if (!user) {
      // User should already exist from auth flow — but handle gracefully
      throw new NotFoundError("User not found. Please login first.");
    }

    // Check if student profile already exists
    const existing = await Student.findOne({ userId: user._id }).lean().exec();
    if (existing) {
      throw new ConflictError("Student profile already exists for this user");
    }

const student = await Student.create({
      userId: user._id,
      name: data.name,
      phone: normalizedPhone,
      parentPhone: data.parentPhone,
      pickupLocation: {
        type: "Point",
        coordinates: [data.pickupLng, data.pickupLat],
      },
      pickupAddress: data.pickupAddress,
      institute: data.institute,
      city: data.city,
      classStartTime: data.classStartTime,
      classEndTime: data.classEndTime,
      permanentOffDays: data.permanentOffDays ?? [],
      suddenOffDays: [],
      status: "pending",
      paymentStatus: "pending",
    });

    // One phone = one account. Claim the student role.
    await User.updateOne(
      { _id: user._id },
      { $set: { role: "student" as UserRole, isVerified: true, isActive: true } },
    );

    return student.toObject() as unknown as IStudent;
  }

  async getStudentByUserId(userId: string): Promise<IStudent | null> {
    await connectDB();
    return studentRepo.findOne({ userId });
  }

  async getProfile(studentId: string): Promise<IStudent & { route?: IRoute }> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    let route: IRoute | undefined;
    if (student.assignedRouteId) {
      const routeDoc = await Route.findById(student.assignedRouteId).lean().exec();
      if (routeDoc) route = routeDoc as unknown as IRoute;
    }

    return { ...student, route } as IStudent & { route?: IRoute };
  }

  async updateStudent(id: string, data: Partial<IStudent>): Promise<IStudent> {
    await connectDB();
    const allowedFields = [
      "name", "parentPhone", "pickupAddress", "pickupLocation",
      "institute", "classStartTime", "classEndTime", "permanentOffDays",
    ];
    const filtered: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in data) filtered[key] = (data as Record<string, unknown>)[key];
    }
    const updated = await studentRepo.update(id, filtered as Partial<IStudent>);
    if (!updated) throw new NotFoundError("Student");
    return updated;
  }

  async deactivateStudent(id: string): Promise<void> {
    await connectDB();
    const updated = await studentRepo.update(id, { status: "inactive" } as Partial<IStudent>);
    if (!updated) throw new NotFoundError("Student");
  }

  async getMatchingProgress(studentId: string): Promise<{ matched: number; required: number }> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    const [lng, lat] = student.pickupLocation.coordinates;
    const nearby = await studentRepo.findNearby(lng, lat, CLUSTER_RADIUS_KM);

    // Filter by same institute and similar timing (within 1 hour)
    const matched = nearby.filter((s) => {
      if (s._id.toString() === studentId) return true; // include self
      const sameInstitute = s.institute === student.institute;
      const timeDiff = Math.abs(
        timeToMinutes(s.classStartTime) - timeToMinutes(student.classStartTime)
      );
      return sameInstitute && timeDiff <= 60;
    });

    return { matched: matched.length, required: MIN_STUDENTS_PER_ROUTE };
  }

  async getCoPassengers(studentId: string): Promise<{ name: string }[]> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");
    if (!student.assignedRouteId) return [];

    const route = await Route.findById(student.assignedRouteId).lean().exec() as unknown as IRoute | null;
    if (!route) return [];

    // Find all students assigned to this route
    const students = await studentRepo.findByRoute(student.assignedRouteId.toString());
    return students
      .filter((s) => s._id.toString() !== studentId)
      .map((s) => ({ name: s.name }));
  }

  async markDayOff(studentId: string, date: string): Promise<void> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    const offDate = new Date(date);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (offDate < tomorrow) {
      throw new ValidationError("Day off must be at least tomorrow");
    }

    // Must be at least night before (current time must be before 9pm day before)
    const nightBefore = new Date(offDate);
    nightBefore.setDate(nightBefore.getDate() - 1);
    nightBefore.setHours(21, 0, 0, 0);
    if (now > nightBefore) {
      throw new ValidationError("Day off must be requested before 9 PM the night before");
    }

    const dateStr = offDate.toISOString().split("T")[0];
    if (student.suddenOffDays.includes(dateStr)) {
      throw new ValidationError("Day off already exists for this date");
    }

    await Student.findByIdAndUpdate(studentId, {
      $push: { suddenOffDays: dateStr },
    }).exec();
  }

  async removeDayOff(studentId: string, dayOffId: string): Promise<void> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    // dayOffId here is the date string (YYYY-MM-DD)
    if (!student.suddenOffDays.includes(dayOffId)) {
      throw new NotFoundError("Day off");
    }

    await Student.findByIdAndUpdate(studentId, {
      $pull: { suddenOffDays: dayOffId },
    }).exec();
  }

  async getDayOffs(studentId: string): Promise<{
    permanent: string[];
    sudden: { date: string; isPast: boolean }[];
  }> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sudden = student.suddenOffDays
      .map((d) => ({
        date: d,
        isPast: new Date(d) < today,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      permanent: student.permanentOffDays as string[],
      sudden,
    };
  }

  async submitDeposit(studentId: string, receiptUrl: string): Promise<IStudent> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");
    if (student.depositStatus === "verified" || student.depositStatus === "refunded") {
      throw new ValidationError("Deposit has already been confirmed");
    }

    await studentRepo.update(studentId, {
      depositStatus: "submitted",
      depositAmount: DEPOSIT_AMOUNT,
      depositReceiptUrl: receiptUrl,
      depositSubmittedAt: new Date(),
      depositRejectionReason: undefined,
    } as Partial<IStudent>);

    const updated = await studentRepo.findById(studentId);
    if (!updated) throw new NotFoundError("Student");
    return updated;
  }

  async getDepositStatus(studentId: string): Promise<{
    status: string;
    amount: number;
    receiptUrl?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    rejectedAt?: Date;
    refundedAt?: Date;
    rejectionReason?: string;
    hasAssignedRoute: boolean;
    refundEligible: boolean;
  }> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    return {
      status: student.depositStatus as string,
      amount: student.depositAmount || DEPOSIT_AMOUNT,
      receiptUrl: student.depositReceiptUrl,
      submittedAt: student.depositSubmittedAt,
      verifiedAt: student.depositVerifiedAt,
      rejectedAt: student.depositStatus === "rejected" ? student.updatedAt : undefined,
      refundedAt: student.depositRefundedAt,
      rejectionReason: student.depositRejectionReason,
      hasAssignedRoute: !!student.assignedRouteId,
      refundEligible:
        student.depositStatus === "verified" && !student.assignedRouteId,
    };
  }

  async adminUpdateDeposit(
    studentId: string,
    action: "verify" | "reject" | "refund",
    reason?: string,
  ): Promise<IStudent> {
    await connectDB();
    const student = await studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");

    if (action === "verify") {
      if (student.depositStatus !== "submitted") {
        throw new ValidationError("Only submitted deposits can be verified");
      }
      await studentRepo.update(studentId, {
        depositStatus: "verified",
        depositVerifiedAt: new Date(),
        depositRejectionReason: undefined,
      } as Partial<IStudent>);
    } else if (action === "reject") {
      if (student.depositStatus !== "submitted") {
        throw new ValidationError("Only submitted deposits can be rejected");
      }
      await studentRepo.update(studentId, {
        depositStatus: "rejected",
        depositRejectionReason: reason,
      } as Partial<IStudent>);
    } else if (action === "refund") {
      if (student.depositStatus !== "verified") {
        throw new ValidationError("Only verified deposits can be refunded");
      }
      await studentRepo.update(studentId, {
        depositStatus: "refunded",
        depositRefundedAt: new Date(),
      } as Partial<IStudent>);
    }

    const updated = await studentRepo.findById(studentId);
    if (!updated) throw new NotFoundError("Student");
    return updated;
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
