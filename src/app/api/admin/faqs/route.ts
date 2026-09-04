import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Faq } from "@/lib/db/models";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — admin: list all FAQs (including inactive)
export const GET = withAuth(
  async () => {
    try {
      await connectDB();
      const faqs = await Faq.find().sort({ order: 1 }).lean().exec();
      return NextResponse.json({ success: true, data: faqs });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch FAQs");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
