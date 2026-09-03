/**
 * @jest-environment node
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

// Use `let` so assignments in beforeEach are visible inside the hoisted factory.
let mockFindUnmatchedByCity: jest.Mock;
let mockFindNearby: jest.Mock;

jest.mock("@/lib/db/connection", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/db/models", () => ({
  City: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    }),
  },
  Settings: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    }),
  },
}));

jest.mock("@/lib/repositories/student.repository", () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({
    findUnmatchedByCity: (...args: unknown[]) => mockFindUnmatchedByCity(...args),
    findNearby: (...args: unknown[]) => mockFindNearby(...args),
  })),
}));

import { ClusteringService } from "@/lib/services/clustering.service";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStudent(
  id: string,
  lat: number,
  lng: number,
  institute = "LUMS",
  classStartTime = "08:00",
  city = "Lahore",
) {
  return {
    _id: { toString: () => id },
    pickupLocation: { type: "Point" as const, coordinates: [lng, lat] as [number, number] },
    institute,
    classStartTime,
    city,
    assignedRouteId: null,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ClusteringService", () => {
  let service: ClusteringService;

  beforeEach(() => {
    mockFindUnmatchedByCity = jest.fn();
    mockFindNearby = jest.fn();
    service = new ClusteringService();
  });

  it("returns empty array when no unmatched students exist", async () => {
    mockFindUnmatchedByCity.mockResolvedValue([]);
    const result = await service.clusterStudents("Lahore");
    expect(result).toEqual([]);
  });

  it("skips a seed when not enough nearby students meet the minimum threshold", async () => {
    const students = [
      makeStudent("s1", 31.5204, 74.3587),
      makeStudent("s2", 31.5210, 74.3590),
    ];
    mockFindUnmatchedByCity.mockResolvedValue(students);
    mockFindNearby.mockResolvedValue(students);

    const result = await service.clusterStudents("Lahore");
    expect(result).toEqual([]);
  });

  it("creates a cluster when enough students are within radius", async () => {
    const students = Array.from({ length: 7 }, (_, i) =>
      makeStudent(`s${i}`, 31.5204 + i * 0.001, 74.3587 + i * 0.001),
    );
    mockFindUnmatchedByCity.mockResolvedValue(students);
    mockFindNearby.mockResolvedValue(students);

    const result = await service.clusterStudents("Lahore");
    expect(result.length).toBe(1);
    expect(result[0].studentIds.length).toBe(7);
    expect(result[0].matchCount).toBe(7);
    expect(result[0].centroid).toBeDefined();
    expect(result[0].centroid.lat).toBeCloseTo(31.523, 1);
  });

  it("groups students by time slot — morning students stay together", async () => {
    const morningStudents = Array.from({ length: 7 }, (_, i) =>
      makeStudent(`m${i}`, 31.5204 + i * 0.001, 74.3587, "LUMS", "08:00"),
    );
    const eveningStudent = makeStudent("e1", 31.5204, 74.3587, "LUMS", "18:00");

    const allStudents = [...morningStudents, eveningStudent];
    mockFindUnmatchedByCity.mockResolvedValue(allStudents);
    mockFindNearby.mockResolvedValue(allStudents);

    const result = await service.clusterStudents("Lahore");
    expect(result.length).toBe(1);
    expect(result[0].studentIds.length).toBe(7);
  });

  it("creates separate clusters for students from different time slots", async () => {
    const morning = Array.from({ length: 7 }, (_, i) =>
      makeStudent(`m${i}`, 31.5204 + i * 0.001, 74.3587, "LUMS", "08:00"),
    );
    const evening = Array.from({ length: 7 }, (_, i) =>
      makeStudent(`e${i}`, 31.5204 + i * 0.001, 74.3587, "LUMS", "18:00"),
    );

    const allStudents = [...morning, ...evening];
    mockFindUnmatchedByCity.mockResolvedValue(allStudents);
    mockFindNearby.mockResolvedValue(allStudents);

    const result = await service.clusterStudents("Lahore");
    expect(result.length).toBe(2);
  });

  it("excludes students already assigned to a route", async () => {
    const students = Array.from({ length: 7 }, (_, i) =>
      makeStudent(`s${i}`, 31.5204 + i * 0.001, 74.3587),
    );
    students[0].assignedRouteId = "route1" as never;
    students[1].assignedRouteId = "route2" as never;

    mockFindUnmatchedByCity.mockResolvedValue(students);
    mockFindNearby.mockResolvedValue(students);

    const result = await service.clusterStudents("Lahore");
    expect(result).toEqual([]);
  });

  it("collects unique institute names in cluster output", async () => {
    const students = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeStudent(`a${i}`, 31.5204 + i * 0.001, 74.3587, "LUMS", "08:00"),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeStudent(`b${i}`, 31.5204 + i * 0.001, 74.3587, "FAST", "08:00"),
      ),
    ];
    mockFindUnmatchedByCity.mockResolvedValue(students);
    mockFindNearby.mockResolvedValue(students);

    const result = await service.clusterStudents("Lahore");
    expect(result.length).toBe(1);
    expect(result[0].institutes).toContain("LUMS");
    expect(result[0].institutes).toContain("FAST");
    expect(result[0].institutes.length).toBe(2);
  });

  it("handles all students in one giant cluster", async () => {
    const students = Array.from({ length: 20 }, (_, i) =>
      makeStudent(`s${i}`, 31.5204 + i * 0.0001, 74.3587 + i * 0.0001),
    );
    mockFindUnmatchedByCity.mockResolvedValue(students);
    mockFindNearby.mockResolvedValue(students);

    const result = await service.clusterStudents("Lahore");
    expect(result.length).toBe(1);
    expect(result[0].studentIds.length).toBe(20);
  });
});
