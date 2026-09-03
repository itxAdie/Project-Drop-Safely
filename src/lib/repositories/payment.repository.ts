import { BaseRepository } from "./base.repository";
import { Payment } from "@/lib/db/models";
import type { IPayment } from "@/types";

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(Payment);
  }

  async findPendingVerification(): Promise<IPayment[]> {
    return this.model
      .find({ status: "submitted" })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as IPayment[];
  }

  async findByStudent(studentId: string): Promise<IPayment[]> {
    return this.model
      .find({ studentId })
      .sort({ billingPeriodStart: -1 })
      .lean()
      .exec() as unknown as IPayment[];
  }

  async findOverdue(): Promise<IPayment[]> {
    return this.model
      .find({
        status: { $in: ["pending", "overdue"] },
        billingPeriodEnd: { $lt: new Date() },
      })
      .lean()
      .exec() as unknown as IPayment[];
  }

  async getRevenueByDateRange(start: Date, end: Date): Promise<number> {
    const result = await this.model
      .aggregate([
        {
          $match: {
            status: "verified",
            verifiedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .exec();

    return result[0]?.total || 0;
  }
}
