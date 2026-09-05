/**
 * @jest-environment node
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockRouteFind: jest.Mock;
let mockRouteFindByIdAndUpdate: jest.Mock;
let mockStudentFind: jest.Mock;
let mockStudentUpdateMany: jest.Mock;
let mockFindNearbyUnassigned: jest.Mock;
let mockSequence: jest.Mock;

jest.mock("@/lib/db/connection", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/db/models", () => ({
  Route: {
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        lean: jest.fn(() => ({
          exec: jest.fn(() => mockRouteFind()),
        })),
      })),
    })),
    findByIdAndUpdate: jest.fn(() => ({
      exec: jest.fn(() => mockRouteFindByIdAndUpdate()),
    })),
  },
  Student: {
    find: jest.fn(() => ({
      lean: jest.fn(() => ({
        exec: jest.fn(() => mockStudentFind()),
      })),
    })),
    updateMany: jest.fn(() => ({
      exec: jest.fn(() => mockStudentUpdateMany()),
    })),
  },
}));

jest.mock("@/lib/repositories/student.repository", () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({
    findNearbyUnassigned: (...args: unknown[]) => mockFindNearbyUnassigned(...args),
  })),
}));

jest.mock("@/lib/services/pickup-sequencer.service", () => ({
  pickupSequencerService: {
    sequence: (...args: unknown[]) => mockSequence(...args),
  },
}));

import { AutoFillService } from "@/lib/services/auto-fill.service";
import { Route, Student } from "@/lib/db/models";

// ── Helpers ──────────────────────────────────────────────────────────────────

function waitingStudent(id: string, overrides = {}) {
  return {
    _id: id,
    name: `Student ${id}`,
    institute: "Fast",
    city: "Lahore",
    classStartTime: "08:00",
    classEndTime: "16:00",
    pickupLocation: { type: "Point", coordinates: [74.35, 31.52] },
    status: "active",
    assignedRouteId: null,
    createdAt: new Date(2026, 0, Number(String(id).replace(/\D/g, "")) || 1),
    ...overrides,
  };
}

function activeRoute(overrides = {}) {
  return {
    _id: "r1",
    name: "Test Route",
    city: "Lahore",
    status: "active",
    institutes: ["Fast"],
    centroid: { type: "Point", coordinates: [74.35, 31.52] },
    radiusKm: 3,
    timeSlots: ["morning"],
    totalStudents: 2,
    minStudents: 7,
    createdAt: new Date(2026, 0, 1),
    vans: [
      {
        driverId: "d1",
        capacity: 3,
        studentIds: ["seated-a"],
        pickupSequence: [],
      },
    ],
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AutoFillService.fillFreeSeats()", () => {
  let service: AutoFillService;

  beforeEach(() => {
    mockRouteFind = jest.fn();
    mockRouteFindByIdAndUpdate = jest.fn().mockResolvedValue({});
    mockStudentFind = jest.fn().mockResolvedValue([]);
    mockStudentUpdateMany = jest.fn().mockResolvedValue({});
    mockFindNearbyUnassigned = jest.fn().mockResolvedValue([]);
    mockSequence = jest.fn((inputs: Array<{ studentId: string; lat: number; lng: number }>) =>
      inputs.map((s, i) => ({
        studentId: s.studentId,
        location: { lat: s.lat, lng: s.lng },
        order: i + 1,
        estimatedPickupTime: "07:00",
      })),
    );

    (Route.find as jest.Mock).mockClear();
    (Route.findByIdAndUpdate as jest.Mock).mockClear();
    (Student.find as jest.Mock).mockClear();
    (Student.updateMany as jest.Mock).mockClear();

    service = new AutoFillService();
  });

  it("fills free seats oldest-first from the waiting pool", async () => {
    mockRouteFind.mockResolvedValue([activeRoute()]);
    // w1 registered before w2 before w3 — only 2 seats free on the route.
    mockFindNearbyUnassigned.mockResolvedValue([
      waitingStudent("w3", { createdAt: new Date(2026, 0, 3) }),
      waitingStudent("w1", { createdAt: new Date(2026, 0, 1) }),
      waitingStudent("w2", { createdAt: new Date(2026, 0, 2) }),
    ]);

    const result = await service.fillFreeSeats();

    expect(result).toEqual({ routesConsidered: 1, assigned: 2 });
    expect(Route.findByIdAndUpdate).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({
        $push: { "vans.0.studentIds": { $each: ["w1", "w2"] } },
        $inc: { totalStudents: 2 },
      }),
    );
    expect(Student.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ["w1", "w2"] } },
      { $set: { assignedRouteId: "r1", vanIndex: 0 } },
    );
  });

  it("skips waiting students whose institute or time slot does not match the route", async () => {
    mockRouteFind.mockResolvedValue([activeRoute()]);
    mockFindNearbyUnassigned.mockResolvedValue([
      waitingStudent("w1"),
      waitingStudent("w2", { institute: "Punjab University" }),
      // classStartTime 14:00 → afternoon slot; route only runs morning.
      waitingStudent("w3", { classStartTime: "14:00" }),
    ]);

    await service.fillFreeSeats();

    expect(Student.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ["w1"] } },
      expect.objectContaining({ $set: { assignedRouteId: "r1", vanIndex: 0 } }),
    );
  });

  it("fills lower-indexed vans first and never exceeds per-van capacity", async () => {
    mockRouteFind.mockResolvedValue([
      activeRoute({
        vans: [
          { driverId: "d1", capacity: 2, studentIds: ["seated-a"], pickupSequence: [] },
          { driverId: "d2", capacity: 2, studentIds: [], pickupSequence: [] },
        ],
      }),
    ]);
    mockFindNearbyUnassigned.mockResolvedValue([
      waitingStudent("w1"),
      waitingStudent("w2"),
      waitingStudent("w3"),
    ]);

    await service.fillFreeSeats();

    expect(Route.findByIdAndUpdate).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({
        $push: { "vans.0.studentIds": { $each: ["w1"] } },
        $inc: { totalStudents: 1 },
      }),
    );
    expect(Route.findByIdAndUpdate).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({
        $push: { "vans.1.studentIds": { $each: ["w2", "w3"] } },
        $inc: { totalStudents: 2 },
      }),
    );
  });

  it("does nothing when a route has no free seats", async () => {
    mockRouteFind.mockResolvedValue([
      activeRoute({
        vans: [{ driverId: "d1", capacity: 1, studentIds: ["seated-a"], pickupSequence: [] }],
      }),
    ]);

    const result = await service.fillFreeSeats();

    expect(result).toEqual({ routesConsidered: 1, assigned: 0 });
    expect(mockFindNearbyUnassigned).not.toHaveBeenCalled();
    expect(Route.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("gives the waiting pool to the earliest-activated route first", async () => {
    mockRouteFind.mockResolvedValue([
      activeRoute({ _id: "r-old", createdAt: new Date(2026, 0, 1) }),
      activeRoute({ _id: "r-new", createdAt: new Date(2026, 0, 2) }),
    ]);
    // Only one waiting student total; r-old is processed first and takes it.
    mockFindNearbyUnassigned.mockResolvedValueOnce([waitingStudent("w1")]);
    mockFindNearbyUnassigned.mockResolvedValueOnce([]);

    const result = await service.fillFreeSeats();

    expect(result.assigned).toBe(1);
    expect(Route.findByIdAndUpdate).toHaveBeenCalledWith(
      "r-old",
      expect.objectContaining({ $push: { "vans.0.studentIds": { $each: ["w1"] } } }),
    );
    expect(Route.findByIdAndUpdate).not.toHaveBeenCalledWith(
      "r-new",
      expect.anything(),
    );
    // Requests routes from oldest to newest.
    expect(Route.find).toHaveBeenCalledWith({ status: "active" });
  });

  it("queries the waiting pool by the route's centroid, radius, city, and unassigned-only", async () => {
    mockRouteFind.mockResolvedValue([activeRoute()]);
    mockFindNearbyUnassigned.mockResolvedValue([waitingStudent("w1")]);

    await service.fillFreeSeats({ city: "Lahore" });

    expect(Route.find).toHaveBeenCalledWith({ status: "active", city: "Lahore" });
    expect(mockFindNearbyUnassigned).toHaveBeenCalledWith(74.35, 31.52, 3, "Lahore");
  });

  it("rebuilds the van pickup sequence to include newly seated students", async () => {
    mockRouteFind.mockResolvedValue([activeRoute()]);
    mockFindNearbyUnassigned.mockResolvedValue([waitingStudent("w1")]);
    mockStudentFind.mockResolvedValue([
      waitingStudent("seated-a", { pickupLocation: { type: "Point", coordinates: [74.34, 31.51] } }),
    ]);

    await service.fillFreeSeats();

    const updateArgs = (Route.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
    const sequence = updateArgs.$set["vans.0.pickupSequence"];
    expect(sequence).toHaveLength(2);
    expect(sequence.map((p: { coordinates: number[] }) => p.coordinates)).toEqual(
      expect.arrayContaining([
        [74.34, 31.51],
        [74.35, 31.52],
      ]),
    );
  });
});