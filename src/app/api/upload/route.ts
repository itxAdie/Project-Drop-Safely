import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { UploadService } from "@/lib/services/upload.service";
import { AppError } from "@/lib/errors";
import { MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { UserRole } from "@/types/enums";

const uploadService = new UploadService();

// POST — upload image to Cloudinary
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "drop-safely";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 },
        );
      }

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
        return NextResponse.json(
          { success: false, error: "File type not allowed. Use JPEG, PNG, or WebP." },
          { status: 400 },
        );
      }

      // Validate file size
      const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      if (file.size > maxBytes) {
        return NextResponse.json(
          { success: false, error: `File size exceeds ${MAX_FILE_SIZE_MB} MB limit` },
          { status: 400 },
        );
      }

      const result = await uploadService.uploadImage(file, folder);
      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Upload failed");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT, UserRole.DRIVER, UserRole.ADMIN],
);
