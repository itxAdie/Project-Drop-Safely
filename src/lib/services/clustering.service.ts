import { connectDB } from "@/lib/db/connection";
import { Settings, City } from "@/lib/db/models";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { CLUSTER_RADIUS_KM, MIN_STUDENTS_PER_ROUTE } from "@/lib/constants";
import { calculateCentroid } from "@/lib/utils/haversine";
import { escapeRegex } from "@/lib/utils/formatters";
import type { GeoPoint } from "@/types";
import type { IClusteringService } from "./interfaces";

const studentRepo = new StudentRepository();

interface ClusterResult {
  centroid: { lat: number; lng: number };
  studentIds: string[];
  institutes: string[];
  matchCount: number;
}

type TimeSlotType = "morning" | "afternoon" | "evening";

/**
 * Determine time slot from a class start time string (HH:MM).
 */
function getTimeSlot(classStartTime: string): TimeSlotType {
  const minutes = timeToMinutes(classStartTime);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 16 * 60) return "afternoon";
  return "evening";
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getCoords(loc: GeoPoint): { lat: number; lng: number } {
  return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
}

export class ClusteringService implements IClusteringService {
  /**
   * Cluster unmatched students in a city by GPS proximity, institute, and time slot.
   *
   * Algorithm:
   *  1. Fetch all "active" students without a route assignment in the city.
   *  2. Pick the first unassigned student as the seed.
   *  3. Find all students within `radiusKm` using $geoNear / findNearby.
   *  4. Filter by institute compatibility and time-slot match.
   *  5. If cluster has ≥ minStudents, emit a candidate cluster.
   *  6. Mark those students as processed; repeat from step 2.
   */
  async clusterStudents(city: string): Promise<ClusterResult[]> {
    await connectDB();

    // Load settings for this city (fallback to constants)
    const { radiusKm, minStudents } = await this.loadSettings(city);

    // Fetch all active, unassigned students
    const allStudents = await studentRepo.findUnmatchedByCity(city);
    if (allStudents.length === 0) return [];

    const processedIds = new Set<string>();
    const clusters: ClusterResult[] = [];

    for (const seed of allStudents) {
      const seedId = seed._id.toString();
      if (processedIds.has(seedId)) continue;

      const { lng, lat } = getCoords(seed.pickupLocation);

      // Find nearby students via 2dsphere query
      const nearby = await studentRepo.findNearby(lng, lat, radiusKm);

      // Filter: only unmatched, same city, compatible time slot
      const seedSlot = getTimeSlot(seed.classStartTime);
      const compatible = nearby.filter((s) => {
        const sid = s._id.toString();
        if (processedIds.has(sid)) return false;
        if (s.city !== city) return false;
        if (s.assignedRouteId) return false;
        // Same or compatible time slot (within same slot bucket)
        const slot = getTimeSlot(s.classStartTime);
        return slot === seedSlot;
      });

      // Always include the seed itself
      if (!compatible.find((s) => s._id.toString() === seedId)) {
        compatible.unshift(seed);
      }

      if (compatible.length < minStudents) {
        // Not enough students — skip this seed, try next
        continue;
      }

      // Build the cluster
      const studentIds = compatible.map((s) => s._id.toString());
      const institutes = [...new Set(compatible.map((s) => s.institute))];
      const points = compatible.map((s) => getCoords(s.pickupLocation));
      const centroid = calculateCentroid(points);

      clusters.push({
        centroid,
        studentIds,
        institutes,
        matchCount: compatible.length,
      });

      // Mark all in this cluster as processed
      for (const id of studentIds) {
        processedIds.add(id);
      }
    }

    return clusters;
  }

  /**
   * Load clustering settings from the Settings collection, falling back to constants.
   */
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
      // Settings not available — use defaults
    }
    return {
      radiusKm: CLUSTER_RADIUS_KM,
      minStudents: MIN_STUDENTS_PER_ROUTE,
    };
  }
}

export const clusteringService = new ClusteringService();
