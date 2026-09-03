import { BaseRepository } from "./base.repository";
import { Driver } from "@/lib/db/models";
import type { IDriver } from "@/types";

export class DriverRepository extends BaseRepository<IDriver> {
  constructor() {
    super(Driver);
  }

  async findApprovedByCity(city: string): Promise<IDriver[]> {
    return this.model
      .find({ city, isApproved: true, status: "approved" })
      .lean()
      .exec() as unknown as IDriver[];
  }

  async findByRoute(routeId: string): Promise<IDriver[]> {
    return this.model
      .find({ assignedRouteIds: routeId })
      .lean()
      .exec() as unknown as IDriver[];
  }

  async findPending(): Promise<IDriver[]> {
    return this.model
      .find({ isApproved: false, status: "pending" })
      .lean()
      .exec() as unknown as IDriver[];
  }
}
