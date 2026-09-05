/**
 * @jest-environment node
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockStudentFindById: jest.Mock;
let mockStudentUpdate: jest.Mock;
let mockRouteFindById: jest.Mock;
let mockRouteUpdateOne: jest.Mock;
let mockFillFreeSeats: jest.Mock;

jest.mock("@/lib/db/connection", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/db/models", () => ({
  Student: {},
  Route: {
    findById: jest.fn(() => ({
      lean: jest.fn(() => ({
        exec: jest.fn(() => mockRouteFindById()),
      })),
    })),
    updateOne: jest.fn(() => ({
      exec: jest.fn(() => mockRouteUpdateOne()),
    })),
  },
  User: {},
}));

jest.mock("@/lib/repositories/student.repository", () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({
    findById: (...args: unknown[]) => mockStudentFindById(...args),
    update: (...args: unknown[]) => mockStudentUpdate(...args),
  })),
}));

jest.mock("@/lib/services/auto-fill.service", () => ({
  AutoFillService: jest.fn(),
  autoFillService: {
    fillFreeSeats: (...args: unknown[]) => mockFillFreeSeats(...args),
  },
}));

import { StudentService } from "@/lib/services/student.service";
import { Route } from "@/lib/db/models";

function student(overrides = {}) {
  return {
    _id: "s1",
    city: "Lahore",
    status: "active",
    assignedRouteId: null,
    ...overrides,
  };
}

describe("StudentService route-behavior", () => {
  let service: StudentService;

  beforeEach(() => {
    mockStudentFindById = jest.fn();
    mockStudentUpdate = jest.fn();
    mockRouteFindById = jest.fn().mockResolvedValue(null);
    mockRouteUpdateOne = jest.fn().mockResolvedValue({});
    mockFillFreeSeats = jest.fn().mockResolvedValue({ routesConsidered: 0, assigned: 0 });

    (Route.findById as jest.Mock).mockClear();
    (Route.updateOne as jest.Mock).mockClear();

    service = new StudentService();
  });

  it("seats a newly activated student via auto-fill for their city", async () => {
    mockStudentFindById.mockResolvedValue(student());
    mockStudentUpdate.mockResolvedValue(student({ status: "active" }));

    await service.updateStudent("s1", { status: "active" } as never);

    expect(mockFillFreeSeats).toHaveBeenCalledWith({ city: "Lahore" });
  });

  it("releases the van seat, clears assignment, and refills when deactivated via PATCH", async () => {
    mockStudentFindById.mockResolvedValue(
      student({ assignedRouteId: "r1", vanIndex: 0 }),
    );
    mockStudentUpdate.mockResolvedValue(student({ status: "inactive" }));
    mockRouteFindById.mockResolvedValue({
      _id: "r1",
      vans: [{ studentIds: ["s1"] }],
    });

    const updated = await service.updateStudent("s1", { status: "inactive" } as never);

    expect(Route.updateOne).toHaveBeenCalledWith(
      { _id: "r1" },
      {
        $pull: { "vans.0.studentIds": "s1" },
        $inc: { totalStudents: -1 },
      },
    );
    expect(mockStudentUpdate).toHaveBeenCalledWith(
      expect.stringMatching("s1"),
      expect.objectContaining({ status: "inactive", assignedRouteId: null, vanIndex: null }),
    );
    expect(mockFillFreeSeats).toHaveBeenCalledWith({ routeId: "r1" });
  });

  it("searches for the van by membership when vanIndex is missing", async () => {
    mockStudentFindById.mockResolvedValue(student({ assignedRouteId: "r1" }));
    mockStudentUpdate.mockResolvedValue(student({ status: "inactive" }));
    mockRouteFindById.mockResolvedValue({
      _id: "r1",
      vans: [
        { studentIds: ["other"] },
        { studentIds: ["s1", "another"] },
      ],
    });

    await service.deactivateStudent("s1");

    expect(Route.updateOne).toHaveBeenCalledWith(
      { _id: "r1" },
      {
        $pull: { "vans.1.studentIds": "s1" },
        $inc: { totalStudents: -1 },
      },
    );
  });
});