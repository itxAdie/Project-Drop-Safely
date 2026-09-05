import { connectDB } from "@/lib/db/connection";
import { Route, Student } from "@/lib/db/models";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { pickupSequencerService } from "./pickup-sequencer.service";
import type { IStudent, IRoute, GeoPoint } from "@/types";

const studentRepo = new StudentRepository();

type TimeSlotType = "morning" | "afternoon" | "evening";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getTimeSlot(classStartTime: string): TimeSlotType {
  const minutes = timeToMinutes(classStartTime);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 16 * 60) return "afternoon";
  return "evening";
}

/**
 * Estimate how many minutes before the earliest class start the van departs.
 * Mirrors the route engine's `estimateTravelBuffer` (~4 min per stop + 15 min safety).
 */
function departureTimeFor(students: Array<{ classStartTime: string }>): string {
  const earliest = students.reduce(
    (min, s) => Math.min(min, timeToMinutes(s.classStartTime)),
    Infinity,
  );
  if (!Number.isFinite(earliest)) return "06:00";
  const departureMinutes = earliest - students.length * 4 - 15;
  const h = Math.floor(Math.max(0, departureMinutes) / 60);
  const m = Math.max(0, departureMinutes) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface AutoFillResult {
  routesConsidered: number;
  assigned: number;
}

interface FillableVan {
  idx: number;
  free: number;
}

/**
 * AutoFillService
 *
 * Top-up active routes from the waiting pool: students who are active but not
 * yet assigned to any route are matched against active routes that have free
 * van seats. A student is placed only when all three match:
 *   - pickup/home location within the route's radius of its centroid (3 km),
 *   - the same time slot (derived from class start time),
 *   - the same institute as one of the route's institutes.
 *
 * Seats are filled oldest-registered-first across routes activated earliest,
 * and within a route into the lowest-indexed van first. Seats are only ever
 * filled from the true waiting pool — students already seated on another van
 * are never moved here.
 */
export class AutoFillService {
  /**
   * Fill free seats on active routes.
   *
   * @param opts.city    Restrict to routes in this city (also filters the
   *                     waiting pool pool to the same city).
   * @param opts.routeId Fill only this single route.
   */
  async fillFreeSeats(opts?: {
    city?: string;
    routeId?: string;
  }): Promise<AutoFillResult> {
    await connectDB();

    const filter: Record<string, unknown> = { status: "active" };
    if (opts?.city) filter.city = opts.city;
    if (opts?.routeId) filter._id = opts.routeId;

    // Earliest-activated routes win the waiting pool first.
    const routes = (await Route.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .exec()) as unknown as IRoute[];

    let assigned = 0;

    for (const route of routes) {
      assigned += await this.#fillRoute(route);
    }

    return { routesConsidered: routes.length, assigned };
  }

  async #fillRoute(route: IRoute): Promise<number> {
    const fillableVans = route.vans
      .map((van, idx) => ({ idx, van }))
      .filter(({ van }) => van.driverId)
      .map(({ idx, van }) => ({ idx, free: van.capacity - van.studentIds.length }))
      .filter((van): van is FillableVan => van.free > 0);

    const totalFree = fillableVans.reduce((sum, v) => sum + v.free, 0);
    if (totalFree <= 0) return 0;

    const [lng, lat] = route.centroid.coordinates;
    const nearby = await studentRepo.findNearbyUnassigned(
      lng,
      lat,
      route.radiusKm || 3,
      route.city,
    );

    // Match on institute + time slot, then seat the longest-waiting first.
    const matches = nearby
      .filter((s) => {
        if (!route.institutes.includes(s.institute)) return false;
        return route.timeSlots.includes(getTimeSlot(s.classStartTime));
      })
      .sort((a, b) => {
        const t = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
        return t !== 0 ? t : String(a._id).localeCompare(String(b._id));
      })
      .slice(0, totalFree);

    if (matches.length === 0) return 0;

    // Distribute oldest-first into the lowest-indexed van that has a seat.
    const buckets = new Map<number, IStudent[]>();
    let cursor = 0;
    for (const student of matches) {
      while (cursor < fillableVans.length && buckets.get(cursor)?.length === fillableVans[cursor].free) {
        cursor++;
      }
      if (cursor >= fillableVans.length) break;
      const bucket = buckets.get(cursor) ?? [];
      bucket.push(student);
      buckets.set(cursor, bucket);
    }

    for (const [vanIdx, students] of buckets) {
      const studentIds = students.map((s) => s._id);
      const pickupSequence = await this.#computeVanSequence(
        route.vans[vanIdx].studentIds,
        students,
      );
      await Route.findByIdAndUpdate(route._id, {
        $push: { [`vans.${vanIdx}.studentIds`]: { $each: studentIds } },
        $set: { [`vans.${vanIdx}.pickupSequence`]: pickupSequence },
        $inc: { totalStudents: studentIds.length },
      }).exec();
      await Student.updateMany(
        { _id: { $in: studentIds } },
        {
          $set: {
            assignedRouteId: route._id,
            vanIndex: vanIdx,
          },
        },
      ).exec();
    }

    return matches.length;
  }

  /**
   * Rebuild a van's pickup sequence to include newly added students, ordered
   * with the same nearest-neighbour heuristic used at route activation.
   */
  async #computeVanSequence(
    existingStudentIds: Array<{ toString(): string }>,
    addedStudents: IStudent[],
  ): Promise<GeoPoint[]> {
    const existing = (await Student.find({
      _id: { $in: existingStudentIds },
    })
      .lean()
      .exec()) as unknown as IStudent[];

    const merged = new Map<string, IStudent>();
    for (const s of existing) merged.set(s._id.toString(), s);
    for (const s of addedStudents) merged.set(s._id.toString(), s);

    const all = [...merged.values()];
    const seqInputs = all.map((s) => ({
      studentId: s._id.toString(),
      lat: s.pickupLocation.coordinates[1],
      lng: s.pickupLocation.coordinates[0],
    }));

    if (seqInputs.length === 0) return [];

    const sequence = pickupSequencerService.sequence(
      seqInputs,
      departureTimeFor(all),
    );
    return sequence.map((stop) => ({
      type: "Point" as const,
      coordinates: [stop.location.lng, stop.location.lat],
    }));
  }
}

export const autoFillService = new AutoFillService();