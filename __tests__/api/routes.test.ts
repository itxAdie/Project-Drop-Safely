/**
 * @jest-environment node
 */

import {
  activateRouteSchema,
  assignDriverSchema,
  generateCandidatesSchema,
  routeListQuerySchema,
  candidateListQuerySchema,
  updateRouteSchema,
} from "@/lib/validators/route.validator";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Route API — Validators", () => {
  // ── activateRouteSchema ──────────────────────────────────────────────────

  describe("activateRouteSchema", () => {
    it("accepts valid activation payload", () => {
      const result = activateRouteSchema.safeParse({
        candidateId: "cand-123",
        name: "LUMS Morning Express",
        driverId: "drv-456",
      });
      expect(result.success).toBe(true);
    });

    it("accepts without optional driverId", () => {
      const result = activateRouteSchema.safeParse({
        candidateId: "cand-123",
        name: "Route Alpha",
      });
      expect(result.success).toBe(true);
    });

    it("rejects when candidateId is empty", () => {
      const result = activateRouteSchema.safeParse({
        candidateId: "",
        name: "Route",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when name is too short", () => {
      const result = activateRouteSchema.safeParse({
        candidateId: "cand-123",
        name: "AB",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── assignDriverSchema ──────────────────────────────────────────────────

  describe("assignDriverSchema", () => {
    it("accepts valid assignment", () => {
      const result = assignDriverSchema.safeParse({ driverId: "drv-1" });
      expect(result.success).toBe(true);
    });

    it("accepts with vanIndex", () => {
      const result = assignDriverSchema.safeParse({ driverId: "drv-1", vanIndex: 0 });
      expect(result.success).toBe(true);
    });

    it("rejects empty driverId", () => {
      const result = assignDriverSchema.safeParse({ driverId: "" });
      expect(result.success).toBe(false);
    });
  });

  // ── generateCandidatesSchema ────────────────────────────────────────────

  describe("generateCandidatesSchema", () => {
    it("accepts valid city", () => {
      const result = generateCandidatesSchema.safeParse({ city: "Lahore" });
      expect(result.success).toBe(true);
    });

    it("rejects empty city", () => {
      const result = generateCandidatesSchema.safeParse({ city: "" });
      expect(result.success).toBe(false);
    });
  });

  // ── routeListQuerySchema ────────────────────────────────────────────────

  describe("routeListQuerySchema", () => {
    it("accepts empty query (all defaults)", () => {
      const result = routeListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe("1");
        expect(result.data.pageSize).toBe("20");
      }
    });

    it("accepts valid status filter", () => {
      const result = routeListQuerySchema.safeParse({ status: "active" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status value", () => {
      const result = routeListQuerySchema.safeParse({ status: "deleted" });
      expect(result.success).toBe(false);
    });

    it("accepts city filter", () => {
      const result = routeListQuerySchema.safeParse({ city: "Lahore" });
      expect(result.success).toBe(true);
    });
  });

  // ── candidateListQuerySchema ───────────────────────────────────────────

  describe("candidateListQuerySchema", () => {
    it("accepts empty query", () => {
      const result = candidateListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts valid candidate status", () => {
      const result = candidateListQuerySchema.safeParse({ status: "pending" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid candidate status", () => {
      const result = candidateListQuerySchema.safeParse({ status: "active" });
      expect(result.success).toBe(false);
    });
  });

  // ── updateRouteSchema ──────────────────────────────────────────────────

  describe("updateRouteSchema", () => {
    it("accepts partial route update", () => {
      const result = updateRouteSchema.safeParse({ name: "Updated Route Name" });
      expect(result.success).toBe(true);
    });

    it("accepts status change", () => {
      const result = updateRouteSchema.safeParse({ status: "inactive" });
      expect(result.success).toBe(true);
    });

    it("rejects negative radiusKm", () => {
      const result = updateRouteSchema.safeParse({ radiusKm: -5 });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer minStudents", () => {
      const result = updateRouteSchema.safeParse({ minStudents: 3.5 });
      expect(result.success).toBe(false);
    });
  });
});
