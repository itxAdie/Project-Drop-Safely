/**
 * @jest-environment node
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/db/connection", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockPaymentFind = jest.fn();
const mockPaymentFindOne = jest.fn();
const mockPaymentCreate = jest.fn();
const mockPaymentUpdateMany = jest.fn();

jest.mock("@/lib/db/models", () => ({
  Student: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    }),
  },
  Payment: {
    find: jest.fn(() => mockPaymentFind()),
    findOne: jest.fn(() => mockPaymentFindOne()),
    create: jest.fn(() => mockPaymentCreate()),
    updateMany: jest.fn(() => mockPaymentUpdateMany()),
  },
}));

import { BillingService } from "@/lib/services/billing.service";
import { NotFoundError } from "@/lib/errors";
import { Student, Payment } from "@/lib/db/models";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("BillingService", () => {
  let service: BillingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BillingService();
  });

  // ── generateMonthlyBills ─────────────────────────────────────────────────

  describe("generateMonthlyBills()", () => {
    it("returns 0 when no active students exist", async () => {
      (Student.find as jest.Mock).mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve([]) }),
      });
      const count = await service.generateMonthlyBills("Lahore");
      expect(count).toBe(0);
    });

    it("creates a bill for each student without an existing payment", async () => {
      const students = [
        { _id: "s1", assignedRouteId: "r1" },
        { _id: "s2", assignedRouteId: "r2" },
      ];
      (Student.find as jest.Mock).mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(students) }),
      });
      // No existing payment
      mockPaymentFindOne.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) }),
      });
      mockPaymentCreate.mockResolvedValue({});

      const count = await service.generateMonthlyBills("Lahore");
      expect(count).toBe(2);
      expect(mockPaymentCreate).toHaveBeenCalledTimes(2);
    });

    it("skips students who already have a bill for this period", async () => {
      const students = [{ _id: "s1", assignedRouteId: "r1" }];
      (Student.find as jest.Mock).mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(students) }),
      });
      // Existing payment found
      mockPaymentFindOne.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: "p1" }) }),
      });

      const count = await service.generateMonthlyBills("Lahore");
      expect(count).toBe(0);
      expect(mockPaymentCreate).not.toHaveBeenCalled();
    });
  });

  // ── checkPaymentStatus ──────────────────────────────────────────────────

  describe("checkPaymentStatus()", () => {
    it('returns "no_billing" when no payments exist at all', async () => {
      // Current period: null
      mockPaymentFindOne
        .mockReturnValueOnce({
          sort: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }),
        })
        // Latest payment: also null
        .mockReturnValueOnce({
          sort: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }),
        });

      const result = await service.checkPaymentStatus("s1");
      expect(result.status).toBe("no_billing");
      expect(result.payment).toBeNull();
    });

    it('returns "current" when a verified payment covers the current period', async () => {
      const now = new Date();
      const payment = {
        status: "verified",
        billingPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };

      mockPaymentFindOne.mockReturnValueOnce({
        sort: () => ({ lean: () => ({ exec: () => Promise.resolve(payment) }) }),
      });

      const result = await service.checkPaymentStatus("s1");
      expect(result.status).toBe("current");
    });

    it('returns "pending" when a non-verified payment covers the current period', async () => {
      const now = new Date();
      const payment = {
        status: "submitted",
        billingPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };

      mockPaymentFindOne.mockReturnValueOnce({
        sort: () => ({ lean: () => ({ exec: () => Promise.resolve(payment) }) }),
      });

      const result = await service.checkPaymentStatus("s1");
      expect(result.status).toBe("pending");
    });

    it('returns "overdue" when the latest payment period has ended and is not verified', async () => {
      const pastEnd = new Date();
      pastEnd.setMonth(pastEnd.getMonth() - 1);

      const latestPayment = {
        status: "pending",
        billingPeriodStart: new Date(pastEnd.getFullYear(), pastEnd.getMonth() - 1, 1),
        billingPeriodEnd: pastEnd,
      };

      // Current period: null
      mockPaymentFindOne.mockReturnValueOnce({
        sort: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }),
      });
      // Latest payment
      mockPaymentFindOne.mockReturnValueOnce({
        sort: () => ({ lean: () => ({ exec: () => Promise.resolve(latestPayment) }) }),
      });

      const result = await service.checkPaymentStatus("s1");
      expect(result.status).toBe("overdue");
    });
  });

  // ── checkOverduePayments ────────────────────────────────────────────────

  describe("checkOverduePayments()", () => {
    it("updates pending/submitted payments past their period end to overdue", async () => {
      mockPaymentUpdateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      await service.checkOverduePayments();
      expect(mockPaymentUpdateMany).toHaveBeenCalledTimes(1);
      // Verify the filter includes pending and submitted
      const call = (Payment.updateMany as jest.Mock).mock.calls[0];
      expect(call[0].status.$in).toContain("pending");
      expect(call[0].status.$in).toContain("submitted");
    });
  });

  // ── getCurrentBillingCycle ──────────────────────────────────────────────

  describe("getCurrentBillingCycle()", () => {
    it("throws NotFoundError when student does not exist", async () => {
      (Student.findById as jest.Mock).mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) }),
      });

      await expect(service.getCurrentBillingCycle("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("returns a billing cycle for a student with billingCycleStart", async () => {
      const now = new Date();
      const cycleStart = new Date(now.getFullYear(), now.getMonth() - 2, 15);
      (Student.findById as jest.Mock).mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ billingCycleStart: cycleStart }) }),
      });

      mockPaymentFindOne.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) }),
      });

      const result = await service.getCurrentBillingCycle("s1");
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    });
  });
});
