import { connectDB } from "@/lib/db/connection";
import { RouteCandidate, Settings, City } from "@/lib/db/models";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { CLUSTER_RADIUS_KM, MIN_STUDENTS_PER_ROUTE } from "@/lib/constants";
import { clusteringService } from "./clustering.service";
import { pickupSequencerService } from "./pickup-sequencer.service";
import { escapeRegex } from "@/lib/utils/formatters";
import type { IStudent, GeoPoint } from "@/types";
import type { IRouteEngineService } from "./interfaces";

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

function getCoords(loc: GeoPoint): { lat: number; lng: number } {
  return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
}

/**
 * Estimate how many minutes before the earliest class start the van must depart.
 * Based on number of stops × avg time per stop.
 */
function estimateTravelBuffer(sequenceLength: number): number {
  // ~4 minutes per stop (travel + boarding)
  return sequenceLength * 4;
}

export class RouteEngineService implements IRouteEngineService {
  /**
   * Generate route candidates for a city:
   *  1. Run clustering algorithm
   *  2. For each cluster, compute optimal pickup sequence
   *  3. Persist as RouteCandidate documents
   */
  async generateCandidates(city: string): Promise<void> {
    await connectDB();

    const clusters = await clusteringService.clusterStudents(city);

    for (const cluster of clusters) {
      // Fetch full student documents for sequencing
      const students = await Promise.all(
        cluster.studentIds.map((id) => studentRepo.findById(id)),
      );
      const validStudents = students.filter(
        (s): s is IStudent => s !== null,
      );

      if (validStudents.length === 0) continue;

      // Determine time slot from the first student (all in cluster share the same slot)
      const timeSlot = getTimeSlot(validStudents[0].classStartTime);

      // Build sequence inputs
      const seqInputs = validStudents.map((s) => ({
        studentId: s._id.toString(),
        lat: s.pickupLocation.coordinates[1],
        lng: s.pickupLocation.coordinates[0],
      }));

      // Estimate departure time: earliest class start minus travel buffer
      const earliestStart = validStudents.reduce((min, s) => {
        const m = timeToMinutes(s.classStartTime);
        return m < min ? m : min;
      }, Infinity);

      const bufferMinutes = estimateTravelBuffer(validStudents.length);
      const departureMinutes = earliestStart - bufferMinutes - 15; // 15 min safety margin
      const departureH = Math.floor(departureMinutes / 60);
      const departureM = departureMinutes % 60;
      const departureTime = `${String(Math.max(0, departureH)).padStart(2, "0")}:${String(Math.max(0, departureM)).padStart(2, "0")}`;

      // Run pickup sequencer
      const pickupSequence = pickupSequencerService.sequence(seqInputs, departureTime);

      // Build GeoJSON sequence
      const suggestedSequence: GeoPoint[] = pickupSequence.map((stop) => ({
        type: "Point" as const,
        coordinates: [stop.location.lng, stop.location.lat],
      }));

      // Build the GeoJSON centroid
      const centroid: GeoPoint = {
        type: "Point",
        coordinates: [cluster.centroid.lng, cluster.centroid.lat],
      };

      // Persist candidate
      await RouteCandidate.create({
        city,
        institutes: cluster.institutes,
        centroid,
        studentIds: cluster.studentIds,
        suggestedSequence,
        matchCount: cluster.matchCount,
        timeSlot,
        departureTime,
        status: "pending",
      });
    }
  }

  /**
   * Calculate an optimal pickup sequence for a set of student IDs.
   * Returns ordered GeoJSON points.
   */
  async calculateOptimalSequence(
    studentIds: string[],
  ): Promise<Array<{ lat: number; lng: number }>> {
    await connectDB();

    const students = await Promise.all(
      studentIds.map((id) => studentRepo.findById(id)),
    );

    const validStudents = students.filter(
      (s): s is IStudent => s !== null,
    );

    const seqInputs = validStudents.map((s) => ({
      studentId: s._id.toString(),
      lat: s.pickupLocation.coordinates[1],
      lng: s.pickupLocation.coordinates[0],
    }));

    const result = pickupSequencerService.sequence(seqInputs, "06:00");
    return result.map((stop) => stop.location);
  }

  /**
   * Estimate the departure time given a class start time and number of stops.
   */
  estimateDepartureTime(classStartTime: string, sequenceLength: number): string {
    const startMinutes = timeToMinutes(classStartTime);
    const buffer = estimateTravelBuffer(sequenceLength) + 15;
    const departureMinutes = startMinutes - buffer;
    const h = Math.floor(Math.max(0, departureMinutes) / 60);
    const m = Math.max(0, departureMinutes) % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  /**
   * Get matching progress for a student: how many compatible students are nearby.
   */
  async getMatchingProgress(studentId: string): Promise<{
    matched: number;
    required: number;
    percentage: number;
    nearbyStudents: Array<{ id: string; name: string; institute: string }>;
  }> {
    await connectDB();

    const student = await studentRepo.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const { radiusKm, minStudents } = await this.loadSettings(student.city);
    const [lng, lat] = student.pickupLocation.coordinates;

    const nearby = await studentRepo.findNearby(lng, lat, radiusKm);
    const seedSlot = getTimeSlot(student.classStartTime);

    // Filter by compatibility
    const compatible = nearby.filter((s) => {
      if (s.assignedRouteId) return false;
      const slot = getTimeSlot(s.classStartTime);
      return slot === seedSlot;
    });

    const nearbyStudents = compatible
      .filter((s) => s._id.toString() !== studentId)
      .slice(0, 10)
      .map((s) => ({
        id: s._id.toString(),
        name: s.name,
        institute: s.institute,
      }));

    const matched = compatible.length;
    const percentage = Math.min(100, Math.round((matched / minStudents) * 100));

    return {
      matched,
      required: minStudents,
      percentage,
      nearbyStudents,
    };
  }

  private async loadSettings(
    city: string,
  ): Promise<{ radiusKm: number; minStudents: number }> {
    try {
      const cityDoc = await City.findOne({ name: new RegExp(`^${escapeRegex(city)}$`, "i") })
        .lean()
        .exec();
      if (cityDoc) {
        const settings = await Settings.findOne({ cityId: cityDoc._id })
          .lean()
          .exec();
        if (settings) {
          return {
            radiusKm: settings.clusterRadiusKm,
            minStudents: settings.minStudentsPerRoute,
          };
        }
      }
    } catch {
      // Use defaults
    }
    return {
      radiusKm: CLUSTER_RADIUS_KM,
      minStudents: MIN_STUDENTS_PER_ROUTE,
    };
  }
}

export const routeEngineService = new RouteEngineService();
