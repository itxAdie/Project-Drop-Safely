import { connectDB } from "@/lib/db/connection";
import { Student, Payment } from "@/lib/db/models";
import { NotFoundError } from "@/lib/errors";
import type { IPayment } from "@/types";
import type { IBillingService } from "./interfaces";

export class BillingService implements IBillingService {
  async generateMonthlyBills(city: string): Promise<number> {
    await connectDB();
    const students = await Student.find({ city, status: "active", assignedRouteId: { $ne: null } })
      .lean()
      .exec();

    let count = 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    for (const student of students) {
      const existing = await Payment.findOne({
        studentId: student._id,
        billingPeriodStart: start,
        billingPeriodEnd: end,
      }).lean().exec();

      if (!existing && student.assignedRouteId) {
        await Payment.create({
          studentId: student._id,
          routeId: student.assignedRouteId,
          amount: 2500,
          platformFee: 100,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          status: "pending",
          remindersSent: 0,
        });
        count++;
      }
    }
    return count;
  }

  async getStudentBilling(studentId: string): Promise<IPayment[]> {
    await connectDB();
    return Payment.find({ studentId })
      .sort({ billingPeriodStart: -1 })
      .lean()
      .exec() as unknown as IPayment[];
  }

  async checkOverduePayments(): Promise<void> {
    await connectDB();
    const now = new Date();
    await Payment.updateMany(
      {
        status: { $in: ["pending", "submitted"] },
        billingPeriodEnd: { $lt: now },
      },
      { $set: { status: "overdue" } },
    ).exec();
  }

  // ── Extended billing methods ────────────────────────────────────────────

  async getCurrentBillingCycle(studentId: string): Promise<{
    start: Date;
    end: Date;
    payment: IPayment | null;
  }> {
    await connectDB();
    const student = await Student.findById(studentId).lean().exec();
    if (!student) throw new NotFoundError("Student");

    const now = new Date();
    const cycleStart = student.billingCycleStart
      ? new Date(student.billingCycleStart)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const start = new Date(cycleStart);
    while (start <= now) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      if (end > now) {
        const payment = await Payment.findOne({
          studentId,
          billingPeriodStart: start,
          billingPeriodEnd: end,
        }).lean().exec() as unknown as IPayment | null;

        return { start, end, payment };
      }
      start.setMonth(start.getMonth() + 1);
    }

    return { start: cycleStart, end: new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1), payment: null };
  }

  async checkPaymentStatus(studentId: string): Promise<{
    status: "current" | "pending" | "overdue" | "no_billing";
    payment: IPayment | null;
  }> {
    await connectDB();
    const now = new Date();
    const payment = await Payment.findOne({
      studentId,
      billingPeriodStart: { $lte: now },
      billingPeriodEnd: { $gte: now },
    }).sort({ billingPeriodStart: -1 }).lean().exec() as unknown as IPayment | null;

    if (!payment) {
      const latest = await Payment.findOne({ studentId })
        .sort({ billingPeriodStart: -1 })
        .lean()
        .exec() as unknown as IPayment | null;
      if (!latest) return { status: "no_billing", payment: null };
      if (latest.billingPeriodEnd < now && latest.status !== "verified") {
        return { status: "overdue", payment: latest };
      }
      return { status: "current", payment: latest };
    }

    if (payment.status === "verified") return { status: "current", payment };
    if (payment.billingPeriodEnd < now) {
      return { status: "overdue", payment };
    }
    return { status: "pending", payment };
  }

  async getUpcomingRenewals(daysAhead: number): Promise<Array<{
    studentId: string;
    studentName: string;
    phone: string;
    renewalDate: Date;
  }>> {
    await connectDB();
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const students = await Student.find({ status: "active" })
      .select("name phone billingCycleStart")
      .lean()
      .exec();

    const renewals: Array<{
      studentId: string;
      studentName: string;
      phone: string;
      renewalDate: Date;
    }> = [];

    for (const student of students) {
      const cycleStart = student.billingCycleStart
        ? new Date(student.billingCycleStart)
        : new Date(student.createdAt || now);

      const nextRenewal = new Date(cycleStart);
      while (nextRenewal <= now) {
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      }

      if (nextRenewal <= futureDate) {
        renewals.push({
          studentId: String(student._id),
          studentName: student.name,
          phone: student.phone,
          renewalDate: nextRenewal,
        });
      }
    }

    return renewals;
  }
}

export const billingService = new BillingService();
