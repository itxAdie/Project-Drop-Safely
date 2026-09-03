import { haversineDistance, calculateCentroid } from "@/lib/utils/haversine";

interface PickupStop {
  studentId: string;
  location: { lat: number; lng: number };
  order: number;
  estimatedPickupTime: string;
}

interface PickupSequenceInput {
  studentId: string;
  lat: number;
  lng: number;
}

/**
 * Average city driving speed in km/h — used for ETA estimation.
 */
const AVERAGE_CITY_SPEED_KMH = 30;

/**
 * Time added per stop to account for student boarding (minutes).
 */
const BOARDING_TIME_MINUTES = 2;

/**
 * PickupSequencerService
 *
 * Determines optimal pickup order using a nearest-neighbor heuristic:
 *  1. Start from the centroid of all pickup locations.
 *  2. At each step, pick the nearest unvisited student.
 *  3. Calculate estimated pickup times based on distance / avg speed.
 */
export class PickupSequencerService {
  /**
   * Build the ordered pickup sequence for a set of students.
   *
   * @param students  Array of { studentId, lat, lng }
   * @param departureTime  ISO time string (HH:MM) representing when the van departs
   * @returns Ordered array of PickupStop
   */
  sequence(students: PickupSequenceInput[], departureTime: string): PickupStop[] {
    if (students.length === 0) return [];
    if (students.length === 1) {
      return [
        {
          studentId: students[0].studentId,
          location: { lat: students[0].lat, lng: students[0].lng },
          order: 1,
          estimatedPickupTime: departureTime,
        },
      ];
    }

    // Calculate centroid as starting point
    const points = students.map((s) => ({ lat: s.lat, lng: s.lng }));
    const centroid = calculateCentroid(points);

    const visited = new Set<number>();
    const sequence: PickupStop[] = [];

    // Start from centroid, find nearest neighbor iteratively
    let currentLat = centroid.lat;
    let currentLng = centroid.lng;
    let cumulativeMinutes = 0;

    for (let step = 0; step < students.length; step++) {
      let nearestIdx = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < students.length; i++) {
        if (visited.has(i)) continue;
        const dist = haversineDistance(
          currentLat,
          currentLng,
          students[i].lat,
          students[i].lng,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx === -1) break;

      visited.add(nearestIdx);

      // Travel time in minutes = (distance_km / speed_kmh) * 60
      const travelMinutes = (nearestDist / AVERAGE_CITY_SPEED_KMH) * 60;
      cumulativeMinutes += travelMinutes;

      // Add boarding time for all stops except possibly the first
      if (step > 0) {
        cumulativeMinutes += BOARDING_TIME_MINUTES;
      }

      const pickupTime = addMinutesToTime(departureTime, cumulativeMinutes);

      sequence.push({
        studentId: students[nearestIdx].studentId,
        location: {
          lat: students[nearestIdx].lat,
          lng: students[nearestIdx].lng,
        },
        order: step + 1,
        estimatedPickupTime: pickupTime,
      });

      currentLat = students[nearestIdx].lat;
      currentLng = students[nearestIdx].lng;
    }

    return sequence;
  }

  /**
   * Calculate total route duration in minutes for a given sequence.
   */
  totalDurationMinutes(students: PickupSequenceInput[]): number {
    if (students.length <= 1) return 0;

    const points = students.map((s) => ({ lat: s.lat, lng: s.lng }));
    const centroid = calculateCentroid(points);

    const visited = new Set<number>();
    let currentLat = centroid.lat;
    let currentLng = centroid.lng;
    let totalMinutes = 0;

    for (let step = 0; step < students.length; step++) {
      let nearestIdx = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < students.length; i++) {
        if (visited.has(i)) continue;
        const dist = haversineDistance(
          currentLat,
          currentLng,
          students[i].lat,
          students[i].lng,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx === -1) break;

      visited.add(nearestIdx);
      totalMinutes += (nearestDist / AVERAGE_CITY_SPEED_KMH) * 60;
      if (step > 0) totalMinutes += BOARDING_TIME_MINUTES;

      currentLat = students[nearestIdx].lat;
      currentLng = students[nearestIdx].lng;
    }

    return Math.ceil(totalMinutes);
  }
}

/**
 * Add minutes to a HH:MM time string and return the new time.
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + Math.round(minutes);
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export const pickupSequencerService = new PickupSequencerService();
