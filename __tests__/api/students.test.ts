/**
 * @jest-environment node
 */

import { createStudentSchema, createDayOffSchema, updateStudentSchema } from "@/lib/validators/student.validator";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Student API — Validators", () => {
  // ── createStudentSchema ──────────────────────────────────────────────────

  describe("createStudentSchema", () => {
    const validStudent = {
      name: "Ali Khan",
      phone: "03001234567",
      parentPhone: "03009876543",
      pickupAddress: "123 Main Boulevard, Gulberg, Lahore",
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      institute: "LUMS",
      city: "Lahore",
      classStartTime: "08:00",
      classEndTime: "14:00",
      permanentOffDays: ["saturday", "sunday"],
    };

    it("accepts valid student data", () => {
      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it("rejects when name is too short", () => {
      const result = createStudentSchema.safeParse({ ...validStudent, name: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid phone format", () => {
      const result = createStudentSchema.safeParse({ ...validStudent, phone: "12345" });
      expect(result.success).toBe(false);
    });

    it("accepts phone with +92 prefix", () => {
      const result = createStudentSchema.safeParse({ ...validStudent, phone: "+923001234567" });
      expect(result.success).toBe(true);
    });

    it("rejects when pickupLat is out of range", () => {
      const result = createStudentSchema.safeParse({ ...validStudent, pickupLat: 999 });
      expect(result.success).toBe(false);
    });

    it("rejects invalid classStartTime format", () => {
      const result = createStudentSchema.safeParse({ ...validStudent, classStartTime: "8am" });
      expect(result.success).toBe(false);
    });

    it("rejects when required fields are missing", () => {
      const result = createStudentSchema.safeParse({ name: "Ali" });
      expect(result.success).toBe(false);
    });

    it("accepts without optional permanentOffDays", () => {
      const { permanentOffDays, ...rest } = validStudent;
      const result = createStudentSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });
  });

  // ── updateStudentSchema ──────────────────────────────────────────────────

  describe("updateStudentSchema", () => {
    it("accepts partial updates", () => {
      const result = updateStudentSchema.safeParse({ name: "Updated Name" });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (no changes)", () => {
      const result = updateStudentSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid phone in update", () => {
      const result = updateStudentSchema.safeParse({ parentPhone: "abc" });
      expect(result.success).toBe(false);
    });
  });

  // ── createDayOffSchema ───────────────────────────────────────────────────

  describe("createDayOffSchema", () => {
    it("accepts a valid day-off request", () => {
      const result = createDayOffSchema.safeParse({
        date: "2026-09-15",
        reason: "Sick leave",
      });
      expect(result.success).toBe(true);
    });

    it("accepts without optional reason", () => {
      const result = createDayOffSchema.safeParse({ date: "2026-09-15" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const result = createDayOffSchema.safeParse({ date: "15-09-2026" });
      expect(result.success).toBe(false);
    });

    it("rejects when date is missing", () => {
      const result = createDayOffSchema.safeParse({ reason: "No date" });
      expect(result.success).toBe(false);
    });
  });
});
