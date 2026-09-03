/**
 * @jest-environment node
 */

import { createDriverSchema, updateDriverSchema } from "@/lib/validators/driver.validator";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Driver API — Validators", () => {
  // ── createDriverSchema ───────────────────────────────────────────────────

  describe("createDriverSchema", () => {
    const validDriver = {
      name: "Ahmed Driver",
      phone: "03001234567",
      cnic: "35202-1234567-1",
      vehicleType: "ac_van" as const,
      vehicleCapacity: 14,
      vehicleRegNumber: "LEA-2024-1234",
      city: "Lahore",
    };

    it("accepts valid driver data", () => {
      const result = createDriverSchema.safeParse(validDriver);
      expect(result.success).toBe(true);
    });

    it("rejects when name is too short", () => {
      const result = createDriverSchema.safeParse({ ...validDriver, name: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid CNIC format", () => {
      const result = createDriverSchema.safeParse({ ...validDriver, cnic: "12345" });
      expect(result.success).toBe(false);
    });

    it("accepts valid CNIC format XXXXX-XXXXXXX-X", () => {
      const result = createDriverSchema.safeParse({ ...validDriver, cnic: "35202-1234567-1" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid vehicle type", () => {
      const result = createDriverSchema.safeParse({ ...validDriver, vehicleType: "motorcycle" });
      expect(result.success).toBe(false);
    });

    it("rejects vehicle capacity exceeding max", () => {
      const result = createDriverSchema.safeParse({ ...validDriver, vehicleCapacity: 100 });
      expect(result.success).toBe(false);
    });

    it("rejects vehicle capacity below minimum", () => {
      const result = createDriverSchema.safeParse({ ...validDriver, vehicleCapacity: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects when city is missing", () => {
      const { city, ...rest } = validDriver;
      const result = createDriverSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  // ── updateDriverSchema ───────────────────────────────────────────────────

  describe("updateDriverSchema", () => {
    it("accepts partial updates", () => {
      const result = updateDriverSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateDriverSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid license URL", () => {
      const result = updateDriverSchema.safeParse({ licenseUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("accepts valid license URL", () => {
      const result = updateDriverSchema.safeParse({
        licenseUrl: "https://res.cloudinary.com/demo/image/upload/license.jpg",
      });
      expect(result.success).toBe(true);
    });
  });
});
