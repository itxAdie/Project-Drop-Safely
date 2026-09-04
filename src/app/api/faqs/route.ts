import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Faq } from "@/lib/db/models";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import type { IFaq } from "@/types";

// GET — public: list active FAQs for the landing page
export async function GET() {
  try {
    await connectDB();
    const faqs = await Faq.find({ isActive: true })
      .sort({ order: 1 })
      .lean()
      .exec();
    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("Failed to fetch FAQs");
    return NextResponse.json(
      { success: false, error: appError.message },
      { status: appError.statusCode },
    );
  }
}

// POST — admin: create a new FAQ
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const body = await request.json();
      const { question, answer, order, isActive } = body;

      if (!question || typeof question !== "string" || !question.trim()) {
        return NextResponse.json(
          { success: false, error: "Question is required" },
          { status: 400 },
        );
      }
      if (!answer || typeof answer !== "string" || !answer.trim()) {
        return NextResponse.json(
          { success: false, error: "Answer is required" },
          { status: 400 },
        );
      }

      const faq = await Faq.create({
        question: question.trim(),
        answer: answer.trim(),
        order: typeof order === "number" ? order : 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
      });

      return NextResponse.json(
        { success: true, data: faq.toObject() as IFaq },
        { status: 201 },
      );
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to create FAQ");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// PUT — admin: update an FAQ
export const PUT = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const body = await request.json();
      const { id, question, answer, order, isActive } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "id is required" },
          { status: 400 },
        );
      }

      const updates: Record<string, unknown> = {};
      if (typeof question === "string" && question.trim()) updates.question = question.trim();
      if (typeof answer === "string" && answer.trim()) updates.answer = answer.trim();
      if (typeof order === "number") updates.order = order;
      if (typeof isActive === "boolean") updates.isActive = isActive;

      const faq = await Faq.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .lean()
        .exec();
      if (!faq) {
        return NextResponse.json(
          { success: false, error: "FAQ not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: faq });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to update FAQ");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// DELETE — admin: delete an FAQ
export const DELETE = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json(
          { success: false, error: "id is required" },
          { status: 400 },
        );
      }

      const faq = await Faq.findByIdAndDelete(id).lean().exec();
      if (!faq) {
        return NextResponse.json(
          { success: false, error: "FAQ not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: null });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to delete FAQ");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
