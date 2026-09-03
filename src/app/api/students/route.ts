import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { createStudentSchema } from "@/lib/validators/student.validator";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const studentService = new StudentService();

// GET — admin: list all students
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get("page") || "1");
      const pageSize = Number(searchParams.get("pageSize") || "20");

      // For admin listing, use repository directly
      const { StudentRepository } = await import("@/lib/repositories/student.repository");
      const repo = new StudentRepository();
      const result = await repo.findMany({ page, pageSize });

      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch students");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// POST — register student (self-registration)
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validated = createStudentSchema.parse(body);

      const student = await studentService.register({
        phone: request.user.phone || validated.phone,
        name: validated.name,
        parentPhone: validated.parentPhone,
        pickupAddress: validated.pickupAddress,
        pickupLat: validated.pickupLat,
        pickupLng: validated.pickupLng,
        institute: validated.institute,
        city: validated.city,
        classStartTime: validated.classStartTime,
        classEndTime: validated.classEndTime,
        permanentOffDays: validated.permanentOffDays,
      });

      return NextResponse.json(
        { success: true, data: student, message: "Student registered successfully" },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode },
        );
      }
      // Zod validation errors
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        return NextResponse.json(
          { success: false, error: "Validation failed", details: zodError.issues },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.STUDENT],
);
