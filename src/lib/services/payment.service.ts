import { connectDB } from "@/lib/db/connection";
import { Payment } from "@/lib/db/models";
import { PaymentRepository } from "@/lib/repositories/payment.repository";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { IPayment } from "@/types";
import type { IPaymentService } from "./interfaces";

const paymentRepo = new PaymentRepository();

export class PaymentService implements IPaymentService {
  async createBillingCycle(
    studentId: string,
    routeId: string,
    amount: number,
    platformFee: number,
    start: Date,
    end: Date,
  ): Promise<IPayment> {
    await connectDB();
    return paymentRepo.create({
      studentId,
      routeId,
      amount,
      platformFee,
      billingPeriodStart: start,
      billingPeriodEnd: end,
      status: "pending",
      remindersSent: 0,
    } as unknown as Partial<IPayment>);
  }

  async uploadReceipt(paymentId: string, receiptUrl: string): Promise<void> {
    await connectDB();
    const payment = await paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment");

    await paymentRepo.update(paymentId, {
      receiptUrl,
      status: "submitted",
    } as Partial<IPayment>);
  }

  async verifyPayment(
    paymentId: string,
    adminId: string,
    approved: boolean,
    reason?: string,
  ): Promise<void> {
    await connectDB();
    const payment = await paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment");

    await paymentRepo.update(paymentId, {
      status: approved ? "verified" : "rejected",
      verifiedBy: adminId as unknown as IPayment["verifiedBy"],
      verifiedAt: new Date(),
      rejectionReason: reason,
    } as Partial<IPayment>);
  }

  async sendReminder(paymentId: string): Promise<void> {
    await connectDB();
    const payment = await paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment");
    // Increment remindersSent — actual sending handled by WhatsApp service
    await paymentRepo.update(paymentId, {
      remindersSent: (payment.remindersSent || 0) + 1,
    } as Partial<IPayment>);
  }

  async getPaymentHistory(studentId: string): Promise<IPayment[]> {
    await connectDB();
    return paymentRepo.findByStudent(studentId);
  }

  async uploadReceiptForStudent(
    studentId: string,
    receiptUrl: string,
  ): Promise<IPayment> {
    await connectDB();
    // Find most recent pending/overdue payment for this student
    const payments = await Payment.find({
      studentId,
      status: { $in: ["pending", "submitted", "overdue"] },
    })
      .sort({ billingPeriodStart: -1 })
      .limit(1)
      .lean()
      .exec();

    if (payments.length === 0) {
      throw new ValidationError("No pending payment found. Please contact support.");
    }

    const payment = payments[0] as unknown as IPayment;
    await paymentRepo.update(payment._id.toString(), {
      receiptUrl,
      status: "submitted",
    } as Partial<IPayment>);

    return { ...payment, receiptUrl, status: "submitted" } as IPayment;
  }

  async getCurrentPaymentStatus(studentId: string): Promise<{
    current: IPayment | null;
    status: string;
    dueDate: Date | null;
    amount: number;
  }> {
    await connectDB();
    const now = new Date();

    // Find current billing cycle payment
    const current = await Payment.findOne({
      studentId,
      billingPeriodStart: { $lte: now },
      billingPeriodEnd: { $gte: now },
    })
      .sort({ billingPeriodStart: -1 })
      .lean()
      .exec() as unknown as IPayment | null;

    if (!current) {
      // Check for most recent payment
      const latest = await Payment.findOne({ studentId })
        .sort({ billingPeriodStart: -1 })
        .lean()
        .exec() as unknown as IPayment | null;

      return {
        current: latest,
        status: latest ? (latest.status as string) : "no_billing",
        dueDate: latest ? (latest.billingPeriodEnd as Date) : null,
        amount: latest ? (latest.amount as number) : 0,
      };
    }

    return {
      current,
      status: current.status as string,
      dueDate: current.billingPeriodEnd as Date,
      amount: current.amount as number,
    };
  }
}
