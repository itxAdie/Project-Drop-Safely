import { BaseRepository } from "./base.repository";
import { Route } from "@/lib/db/models";
import type { IRoute } from "@/types";

export class RouteRepository extends BaseRepository<IRoute> {
  constructor() {
    super(Route);
  }

  async findActiveByCity(city: string): Promise<IRoute[]> {
    return this.model
      .find({ city, status: "active" })
      .lean()
      .exec() as unknown as IRoute[];
  }

  async findCandidates(city: string): Promise<IRoute[]> {
    return this.model
      .find({ city, status: "candidate" })
      .lean()
      .exec() as unknown as IRoute[];
  }

  async findByStatus(status: string): Promise<IRoute[]> {
    return this.model
      .find({ status })
      .lean()
      .exec() as unknown as IRoute[];
  }
}
