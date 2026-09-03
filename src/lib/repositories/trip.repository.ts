import { BaseRepository } from "./base.repository";
import { Trip } from "@/lib/db/models";
import type { ITrip } from "@/types";

export class TripRepository extends BaseRepository<ITrip> {
  constructor() {
    super(Trip);
  }

  async findTodayByDriver(driverId: string): Promise<ITrip[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.model
      .find({
        driverId,
        date: { $gte: today, $lt: tomorrow },
      })
      .sort({ date: 1 })
      .lean()
      .exec() as unknown as ITrip[];
  }

  async findByRoute(routeId: string, limit = 10): Promise<ITrip[]> {
    return this.model
      .find({ routeId })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as ITrip[];
  }

  async findActive(): Promise<ITrip[]> {
    return this.model
      .find({ status: "in_progress" })
      .lean()
      .exec() as unknown as ITrip[];
  }

  async findByDateRange(start: Date, end: Date): Promise<ITrip[]> {
    return this.model
      .find({ date: { $gte: start, $lte: end } })
      .sort({ date: -1 })
      .lean()
      .exec() as unknown as ITrip[];
  }
}
