import { BaseRepository } from "./base.repository";
import { RouteCandidate } from "@/lib/db/models";
import type { IRouteCandidate } from "@/types";

export class RouteCandidateRepository extends BaseRepository<IRouteCandidate> {
  constructor() {
    super(RouteCandidate);
  }

  async findByCity(city: string): Promise<IRouteCandidate[]> {
    return this.model
      .find({ city, status: "pending" })
      .lean()
      .exec() as unknown as IRouteCandidate[];
  }

  async findByCityAndStatus(city: string, status: string): Promise<IRouteCandidate[]> {
    return this.model
      .find({ city, status })
      .lean()
      .exec() as unknown as IRouteCandidate[];
  }

  async findByStatus(status: string): Promise<IRouteCandidate[]> {
    return this.model
      .find({ status })
      .lean()
      .exec() as unknown as IRouteCandidate[];
  }

  async findAllCandidates(): Promise<IRouteCandidate[]> {
    return this.model
      .find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as IRouteCandidate[];
  }
}
