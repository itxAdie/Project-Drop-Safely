import { BaseRepository } from "./base.repository";
import { Student } from "@/lib/db/models";
import type { IStudent } from "@/types";

export class StudentRepository extends BaseRepository<IStudent> {
  constructor() {
    super(Student);
  }

  async findUnmatchedByCity(city: string): Promise<IStudent[]> {
    return this.model
      .find({ city, status: "active", assignedRouteId: null })
      .lean()
      .exec() as unknown as IStudent[];
  }

  async findByRoute(routeId: string): Promise<IStudent[]> {
    return this.model
      .find({ assignedRouteId: routeId, status: "active" })
      .lean()
      .exec() as unknown as IStudent[];
  }

  async findNearby(lng: number, lat: number, radiusKm: number): Promise<IStudent[]> {
    return this.model
      .find({
        pickupLocation: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
        status: "active",
      })
      .lean()
      .exec() as unknown as IStudent[];
  }

  async findNearbyUnassigned(
    lng: number,
    lat: number,
    radiusKm: number,
    city?: string,
  ): Promise<IStudent[]> {
    return this.model
      .find({
        pickupLocation: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
        status: "active",
        assignedRouteId: null,
        ...(city ? { city } : {}),
      })
      .lean()
      .exec() as unknown as IStudent[];
  }

  async findByStatusAndCity(city: string, status: string): Promise<IStudent[]> {
    return this.model
      .find({ city, status })
      .lean()
      .exec() as unknown as IStudent[];
  }
}
