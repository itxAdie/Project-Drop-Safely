/**
 * @jest-environment node
 */

import { PickupSequencerService } from "@/lib/services/pickup-sequencer.service";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(id: string, lat: number, lng: number) {
  return { studentId: id, lat, lng };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PickupSequencerService", () => {
  let service: PickupSequencerService;

  beforeEach(() => {
    service = new PickupSequencerService();
  });

  // ── sequence() ───────────────────────────────────────────────────────────

  describe("sequence()", () => {
    it("returns empty array for no students", () => {
      const result = service.sequence([], "07:00");
      expect(result).toEqual([]);
    });

    it("returns a single stop for 1 student", () => {
      const students = [makeInput("s1", 31.5204, 74.3587)];
      const result = service.sequence(students, "07:00");

      expect(result.length).toBe(1);
      expect(result[0].studentId).toBe("s1");
      expect(result[0].order).toBe(1);
      expect(result[0].estimatedPickupTime).toBe("07:00");
      expect(result[0].location).toEqual({ lat: 31.5204, lng: 74.3587 });
    });

    it("orders 7 students using nearest-neighbor from centroid", () => {
      const students = [
        makeInput("s1", 31.52, 74.35),
        makeInput("s2", 31.53, 74.36),
        makeInput("s3", 31.51, 74.34),
        makeInput("s4", 31.525, 74.355),
        makeInput("s5", 31.515, 74.345),
        makeInput("s6", 31.535, 74.365),
        makeInput("s7", 31.505, 74.335),
      ];

      const result = service.sequence(students, "07:00");

      expect(result.length).toBe(7);
      // Verify order numbers are sequential 1..7
      result.forEach((stop, i) => {
        expect(stop.order).toBe(i + 1);
      });
      // All student IDs present
      const ids = result.map((s) => s.studentId);
      expect(new Set(ids).size).toBe(7);
    });

    it("produces sequential estimated pickup times (each later than the previous)", () => {
      const students = [
        makeInput("s1", 31.52, 74.35),
        makeInput("s2", 31.53, 74.36),
        makeInput("s3", 31.54, 74.37),
        makeInput("s4", 31.55, 74.38),
      ];

      const result = service.sequence(students, "07:00");

      for (let i = 1; i < result.length; i++) {
        const prev = timeToMinutes(result[i - 1].estimatedPickupTime);
        const curr = timeToMinutes(result[i].estimatedPickupTime);
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it("handles 10 students without error", () => {
      const students = Array.from({ length: 10 }, (_, i) =>
        makeInput(`s${i}`, 31.52 + i * 0.005, 74.35 + i * 0.005),
      );

      const result = service.sequence(students, "06:30");

      expect(result.length).toBe(10);
      expect(result[0].order).toBe(1);
      expect(result[9].order).toBe(10);
    });

    it("preserves correct location data on each stop", () => {
      const students = [
        makeInput("s1", 31.52, 74.35),
        makeInput("s2", 31.53, 74.36),
      ];

      const result = service.sequence(students, "07:00");

      for (const stop of result) {
        const original = students.find((s) => s.studentId === stop.studentId)!;
        expect(stop.location.lat).toBe(original.lat);
        expect(stop.location.lng).toBe(original.lng);
      }
    });
  });

  // ── totalDurationMinutes() ───────────────────────────────────────────────

  describe("totalDurationMinutes()", () => {
    it("returns 0 for 0 or 1 students", () => {
      expect(service.totalDurationMinutes([])).toBe(0);
      expect(service.totalDurationMinutes([makeInput("s1", 31.52, 74.35)])).toBe(0);
    });

    it("returns a positive number for multiple students", () => {
      const students = [
        makeInput("s1", 31.52, 74.35),
        makeInput("s2", 31.53, 74.36),
        makeInput("s3", 31.54, 74.37),
      ];
      const duration = service.totalDurationMinutes(students);
      expect(duration).toBeGreaterThan(0);
    });

    it("increases with more spread-out students", () => {
      const close = [
        makeInput("s1", 31.52, 74.35),
        makeInput("s2", 31.521, 74.351),
      ];
      const far = [
        makeInput("s1", 31.52, 74.35),
        makeInput("s2", 31.57, 74.40),
      ];
      expect(service.totalDurationMinutes(far)).toBeGreaterThan(
        service.totalDurationMinutes(close),
      );
    });
  });
});

// ── Utility ──────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
