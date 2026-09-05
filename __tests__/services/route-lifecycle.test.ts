/**
 * @jest-environment node
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockRouteFindById: jest.Mock;
let mockRouteUpdate: jest.Mock;
let mockCandidateFindById: jest.Mock;
let mockCandidateUpdate: jest.Mock;
let mockStudentFind: jest.Mock;
let mockStudentUpdateMany: jest.Mock;
let mockDriverFindById: jest.Mock;

jest.mock("@/lib/db/connection", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/repositories/route.repository", () => ({
  RouteRepository: jest.fn().mockImplementation(() => ({
    findById: (...args: unknown[]) => mockRouteFindById(...args),
    update: (...args: unknown[]) => mockRouteUpdate(...args),
  })),
}));

jest.mock("@/lib/repositories/route-candidate.repository", () => ({
  RouteCandidateRepository: jest.fn().mockImplementation(() => ({
    findById: (...args: unknown[]) => mockCandidateFindById(...args),
    update: (...args: unknown[]) => mockCandidateUpdate(...args),
  })),
}));

jest.mock("@/lib/db/models", () => ({
  Route: {
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        ...data,
        _id: "new-route-id",
        toObject() {
          return { _id: "new-route-id", ...data };
        },
      }),
    ),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    }),
  },
  RouteCandidate: {},
  Student: {
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        lean: jest.fn(() => ({
          exec: jest.fn(() => mockStudentFind()),
        })),
      })),
    })),
    updateMany: jest.fn(() => mockStudentUpdateMany()),
  },
  Driver: {
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    }),
  },
}));

jest.mock("@/lib/repositories/driver.repository", () => ({
  DriverRepository: jest.fn().mockImplementation(() => ({
    findById: (...args: unknown[]) => mockDriverFindById(...args),
  })),
}));

jest.mock("@/lib/repositories/student.repository", () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({})),
}));

import { RouteLifecycleService } from "@/lib/services/route-lifecycle.service";
import { Student, Route } from "@/lib/db/models";
import { NotFoundError, ValidationError } from "@/lib/errors";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCandidate(overrides = {}) {
  return {
    _id: "cand-1",
    status: "pending",
    city: "Lahore",
    institutes: ["LUMS"],
    centroid: { type: "Point", coordinates: [74.35, 31.52] },
    studentIds: ["s1", "s2", "s3"],
    suggestedSequence: [],
    timeSlot: "morning",
    ...overrides,
  };
}

function makeRoute(overrides = {}) {
  return {
    _id: "route-1",
    status: "active",
    vans: [{ driverId: "d1", studentIds: [], capacity: 14, pickupSequence: [] }],
    ...overrides,
  };
}

function studentDocs(ids: string[]) {
  return ids.map((id, i) => ({ _id: id, createdAt: new Date(2026, 0, i + 1) }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("RouteLifecycleService", () => {
  let service: RouteLifecycleService;

  beforeEach(() => {
    mockRouteFindById = jest.fn();
    mockRouteUpdate = jest.fn();
    mockCandidateFindById = jest.fn();
    mockCandidateUpdate = jest.fn();
    mockStudentFind = jest.fn();
    mockStudentUpdateMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });
    mockDriverFindById = jest.fn();
    mockStudentFind.mockResolvedValue(studentDocs(["s1", "s2", "s3"]));
    (Route.findByIdAndUpdate as jest.Mock).mockClear();

    service = new RouteLifecycleService();
  });

  // ── activateRoute ────────────────────────────────────────────────────────

  describe("activateRoute()", () => {
    it("activates a pending candidate and returns a route", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate());

      const route = await service.activateRoute("cand-1", "LUMS Morning Route");
      expect(route).toBeDefined();
      expect(route._id).toBe("new-route-id");
      expect(mockCandidateUpdate).toHaveBeenCalledWith("cand-1", { status: "approved" });
    });

    it("assigns a driver to the new route when driverId is provided", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate());
      mockDriverFindById.mockResolvedValue({
        _id: "d1",
        vehicleCapacity: 14,
      });

      const route = await service.activateRoute("cand-1", "Route A", "d1");
      expect(route.status).toBe("active");
      expect(route.vans).toHaveLength(1);
      expect(route.vans[0].driverId).toBe("d1");
    });

    it("creates route as candidate status when no driver is provided", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate());

      const route = await service.activateRoute("cand-1", "Route B");
      expect(route.status).toBe("candidate");
    });

    it("throws NotFoundError for non-existent candidate", async () => {
      mockCandidateFindById.mockResolvedValue(null);

      await expect(service.activateRoute("bad-id", "X")).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError if candidate is not pending", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate({ status: "approved" }));

      await expect(service.activateRoute("cand-1", "X")).rejects.toThrow(ValidationError);
    });

    it("updates students with route assignment on activation", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate());
      mockDriverFindById.mockResolvedValue({ _id: "d1", vehicleCapacity: 14 });
      mockStudentFind.mockResolvedValue(studentDocs(["s1", "s2", "s3"]));

      await service.activateRoute("cand-1", "Route C", "d1");
      expect(mockStudentUpdateMany).toHaveBeenCalled();
    });

    it("allocates the oldest students up to driver capacity and leaves overflow in the waiting pool", async () => {
      mockCandidateFindById.mockResolvedValue(
        makeCandidate({ studentIds: ["s1", "s2", "s3"] }),
      );
      mockDriverFindById.mockResolvedValue({ _id: "d1", vehicleCapacity: 10 });
      // s1 and s2 registered before s3 → s3 is the overflow student
      mockStudentFind.mockResolvedValue(studentDocs(["s1", "s2", "s3"]));

      const route = await service.activateRoute("cand-1", "Route Cap", "d1");

      expect(route.status).toBe("active");
      expect(route.vans[0].capacity).toBe(10);
      expect(route.vans[0].studentIds).toEqual(["s1", "s2", "s3"]);

      // Only the students who fit are assigned; no student is dropped.
      expect(Student.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ["s1", "s2", "s3"] } },
        expect.objectContaining({
          $set: { assignedRouteId: "new-route-id", status: "active" },
        }),
      );
    });

    it("caps the assigned students at driver capacity when there are more students than seats", async () => {
      mockCandidateFindById.mockResolvedValue(
        makeCandidate({ studentIds: ["s1", "s2", "s3"] }),
      );
      mockDriverFindById.mockResolvedValue({ _id: "d1", vehicleCapacity: 2 });
      mockStudentFind.mockResolvedValue(studentDocs(["s1", "s2", "s3"]));

      const route = await service.activateRoute("cand-1", "Route Caps", "d1");

      expect(route.vans[0].capacity).toBe(2);
      expect(route.vans[0].studentIds).toEqual(["s1", "s2"]);

      // The overflow student (s3) is NOT assigned → stays in the waiting pool.
      expect(Student.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ["s1", "s2"] } },
        expect.objectContaining({
          $set: { assignedRouteId: "new-route-id", status: "active" },
        }),
      );
    });
  });

  // ── assignDriverToRoute ─────────────────────────────────────────────────

  describe("assignDriverToRoute()", () => {
    it("throws ValidationError when the van already exceeds the driver's capacity", async () => {
      mockRouteFindById.mockResolvedValue(
        makeRoute({ vans: [{ driverId: "d-old", studentIds: ["a", "b", "c"], capacity: 14 }] }),
      );
      mockDriverFindById.mockResolvedValue({ _id: "d-small", vehicleCapacity: 2 });

      await expect(
        service.assignDriverToRoute("route-1", "d-small", 0),
      ).rejects.toThrow(ValidationError);
    });

    it("allows assigning a driver whose capacity covers the van population", async () => {
      mockRouteFindById.mockResolvedValue(
        makeRoute({ vans: [{ driverId: "d-old", studentIds: ["a", "b", "c"], capacity: 14 }] }),
      );
      mockDriverFindById.mockResolvedValue({ _id: "d-big", vehicleCapacity: 10 });

      await expect(
        service.assignDriverToRoute("route-1", "d-big", 0),
      ).resolves.toBeUndefined();
    });

    it("backfills a newly created van with the route's seat-holders, capped at capacity", async () => {
      mockRouteFindById.mockResolvedValue(
        makeRoute({ vans: [], totalStudents: 5 }),
      );
      mockDriverFindById.mockResolvedValue({ _id: "d1", vehicleCapacity: 3 });
      mockStudentFind.mockResolvedValue(studentDocs(["s1", "s2", "s3", "s4", "s5"]));

      await service.assignDriverToRoute("route-1", "d1", 0);

      const pushCall = (Route.findByIdAndUpdate as jest.Mock).mock.calls[0];
      expect(pushCall[0]).toBe("route-1");
      // New van holds only the (oldest) students that fit the capacity
      expect(pushCall[1].$push.vans.studentIds).toEqual(["s1", "s2", "s3"]);
      expect(pushCall[1].$push.vans.capacity).toBe(3);
    });
  });

  // ── deactivateRoute ──────────────────────────────────────────────────────

  describe("deactivateRoute()", () => {
    it("deactivates an active route", async () => {
      mockRouteFindById.mockResolvedValue(makeRoute({ status: "active" }));

      await service.deactivateRoute("route-1");
      expect(mockRouteUpdate).toHaveBeenCalledWith("route-1", { status: "inactive" });
    });

    it("clears student route assignments on deactivation", async () => {
      mockRouteFindById.mockResolvedValue(makeRoute({ status: "active" }));

      await service.deactivateRoute("route-1");
      expect(mockStudentUpdateMany).toHaveBeenCalled();
    });

    it("throws NotFoundError for non-existent route", async () => {
      mockRouteFindById.mockResolvedValue(null);

      await expect(service.deactivateRoute("bad-id")).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError if route is not active", async () => {
      mockRouteFindById.mockResolvedValue(makeRoute({ status: "inactive" }));

      await expect(service.deactivateRoute("route-1")).rejects.toThrow(ValidationError);
    });
  });

  // ── archiveRoute ─────────────────────────────────────────────────────────

  describe("archiveRoute()", () => {
    it("archives an inactive route", async () => {
      mockRouteFindById.mockResolvedValue(makeRoute({ status: "inactive" }));

      await service.archiveRoute("route-1");
      expect(mockRouteUpdate).toHaveBeenCalledWith("route-1", { status: "archived" });
    });

    it("throws ValidationError when trying to archive an active route", async () => {
      mockRouteFindById.mockResolvedValue(makeRoute({ status: "active" }));

      await expect(service.archiveRoute("route-1")).rejects.toThrow(ValidationError);
    });
  });

  // ── rejectCandidate ──────────────────────────────────────────────────────

  describe("rejectCandidate()", () => {
    it("rejects a pending candidate", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate({ status: "pending" }));

      await service.rejectCandidate("cand-1");
      expect(mockCandidateUpdate).toHaveBeenCalledWith("cand-1", { status: "rejected" });
    });

    it("throws ValidationError for already-approved candidate", async () => {
      mockCandidateFindById.mockResolvedValue(makeCandidate({ status: "approved" }));

      await expect(service.rejectCandidate("cand-1")).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError for non-existent candidate", async () => {
      mockCandidateFindById.mockResolvedValue(null);

      await expect(service.rejectCandidate("bad-id")).rejects.toThrow(NotFoundError);
    });
  });
});
