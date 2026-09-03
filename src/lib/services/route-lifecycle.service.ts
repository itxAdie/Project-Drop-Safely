import { connectDB } from "@/lib/db/connection";
import { Route, RouteCandidate, Student, Driver } from "@/lib/db/models";
import { RouteRepository } from "@/lib/repositories/route.repository";
import { RouteCandidateRepository } from "@/lib/repositories/route-candidate.repository";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { DriverRepository } from "@/lib/repositories/driver.repository";
import { NotFoundError, AppError, ValidationError } from "@/lib/errors";
import type { IRoute, IRouteCandidate, GeoPoint } from "@/types";
import type { IRouteLifecycleService } from "./interfaces";

const routeRepo = new RouteRepository();
const candidateRepo = new RouteCandidateRepository();
const studentRepo = new StudentRepository();
const driverRepo = new DriverRepository();

export class RouteLifecycleService implements IRouteLifecycleService {
  /**
   * Activate a route from a pending candidate.
   *
   * 1. Find the candidate document
   * 2. Create a new Route from the candidate data
   * 3. Update all candidate students: status → active, assignedRouteId → route._id
   * 4. Mark candidate as approved
   * 5. Optionally assign a driver
   */
  async activateRoute(
    candidateId: string,
    name: string,
    driverId?: string,
  ): Promise<IRoute> {
    await connectDB();

    const candidate = await candidateRepo.findById(candidateId);
    if (!candidate) {
      throw new NotFoundError("Route candidate");
    }

    if (candidate.status !== "pending") {
      throw new ValidationError(
        `Candidate is already ${candidate.status}. Only pending candidates can be activated.`,
      );
    }

    // Build van assignment if driver is provided
    const vans: Array<{
      driverId: unknown;
      studentIds: unknown[];
      capacity: number;
      pickupSequence: GeoPoint[];
    }> = [];

    if (driverId) {
      const driver = await driverRepo.findById(driverId);
      if (!driver) {
        throw new NotFoundError("Driver");
      }
      vans.push({
        driverId: driver._id,
        studentIds: candidate.studentIds,
        capacity: driver.vehicleCapacity,
        pickupSequence: candidate.suggestedSequence,
      });
    }

    // Create the route document
    const route = await Route.create({
      name,
      city: candidate.city,
      institutes: candidate.institutes,
      centroid: candidate.centroid,
      radiusKm: 3,
      timeSlots: [candidate.timeSlot],
      vans,
      totalStudents: candidate.studentIds.length,
      minStudents: 7,
      status: driverId ? "active" : "candidate",
    });

    const routeObj = route.toObject() as unknown as IRoute;

    // Update all students: assign route, set status to active
    await Student.updateMany(
      { _id: { $in: candidate.studentIds } },
      {
        $set: {
          assignedRouteId: routeObj._id,
          status: "active",
        },
      },
    ).exec();

    // Mark candidate as approved
    await candidateRepo.update(candidateId, { status: "approved" } as Partial<IRouteCandidate>);

    return routeObj;
  }

  /**
   * Assign or reassign a driver to a route's van.
   */
  async assignDriverToRoute(
    routeId: string,
    driverId: string,
    vanIndex?: number,
  ): Promise<void> {
    await connectDB();

    const route = await routeRepo.findById(routeId);
    if (!route) {
      throw new NotFoundError("Route");
    }

    const driver = await driverRepo.findById(driverId);
    if (!driver) {
      throw new NotFoundError("Driver");
    }

    const idx = vanIndex ?? 0;

    if (idx >= route.vans.length) {
      // Create a new van assignment
      const newVan = {
        driverId: driver._id,
        studentIds: [] as unknown[],
        capacity: driver.vehicleCapacity,
        pickupSequence: [] as GeoPoint[],
      };
      await Route.findByIdAndUpdate(routeId, {
        $push: { vans: newVan },
      }).exec();
    } else {
      // Update existing van assignment
      await Route.findByIdAndUpdate(routeId, {
        $set: {
          [`vans.${idx}.driverId`]: driver._id,
          [`vans.${idx}.capacity`]: driver.vehicleCapacity,
        },
      }).exec();
    }

    // Add route to driver's assigned routes
    await Driver.findByIdAndUpdate(driverId, {
      $addToSet: { assignedRouteIds: route._id },
    }).exec();
  }

  /**
   * Deactivate a route (active → inactive).
   * Clears student route assignments.
   */
  async deactivateRoute(routeId: string): Promise<void> {
    await connectDB();

    const route = await routeRepo.findById(routeId);
    if (!route) {
      throw new NotFoundError("Route");
    }

    if (route.status !== "active") {
      throw new ValidationError(
        `Route is currently "${route.status}". Only active routes can be deactivated.`,
      );
    }

    // Clear student assignments
    await Student.updateMany(
      { assignedRouteId: route._id },
      { $set: { assignedRouteId: null } },
    ).exec();

    await routeRepo.update(routeId, { status: "inactive" } as Partial<IRoute>);
  }

  /**
   * Archive a route (inactive/candidate → archived).
   */
  async archiveRoute(routeId: string): Promise<void> {
    await connectDB();

    const route = await routeRepo.findById(routeId);
    if (!route) {
      throw new NotFoundError("Route");
    }

    if (route.status === "active") {
      throw new ValidationError(
        "Cannot archive an active route. Deactivate it first.",
      );
    }

    // Clear any remaining student assignments
    await Student.updateMany(
      { assignedRouteId: route._id },
      { $set: { assignedRouteId: null } },
    ).exec();

    await routeRepo.update(routeId, { status: "archived" } as Partial<IRoute>);
  }

  /**
   * Reject a candidate — delete the candidate document.
   */
  async rejectCandidate(candidateId: string): Promise<void> {
    await connectDB();

    const candidate = await candidateRepo.findById(candidateId);
    if (!candidate) {
      throw new NotFoundError("Route candidate");
    }

    if (candidate.status !== "pending") {
      throw new ValidationError(
        `Candidate is already ${candidate.status}. Only pending candidates can be rejected.`,
      );
    }

    await candidateRepo.update(candidateId, { status: "rejected" } as Partial<IRouteCandidate>);
  }
}

export const routeLifecycleService = new RouteLifecycleService();
