import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { User, Student, Driver } from "@/lib/db/models";
import { connectDB } from "@/lib/db/connection";
import {
  UnauthorizedError,
  NotFoundError,
  AppError,
} from "@/lib/errors";
import type { AuthTokens, AuthUser } from "@/types/api";
import type { IAuthService } from "./interfaces";
import type { UserRole } from "@/types/enums";
import { otpService } from "./otp.service";

// ── Helpers ────────────────────────────────────────────────────────────────

function getAccessSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

function getRefreshSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
}

const ACCESS_EXPIRY = process.env.JWT_EXPIRY || "1h";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+92")) {
    cleaned = "0" + cleaned.slice(3);
  }
  return cleaned;
}

// ── Token generation ───────────────────────────────────────────────────────

async function generateAccessToken(user: {
  _id: string;
  role: string;
  phone?: string;
  email?: string;
}): Promise<string> {
  return new SignJWT({
    sub: user._id,
    role: user.role,
    phone: user.phone,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(getAccessSecret());
}

async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getRefreshSecret());
}

async function buildTokenPair(user: {
  _id: string;
  role: string;
  phone?: string;
  email?: string;
}): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user._id),
  ]);
  return { accessToken, refreshToken };
}

// ── Service ────────────────────────────────────────────────────────────────

class AuthService implements IAuthService {
  /**
   * Verify an OTP and return tokens + user info.
   * Creates the user on first login (isNewUser = true).
   */
  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<AuthTokens & { user: AuthUser; isNewUser: boolean }> {
    await connectDB();

    // Step 1: verify OTP code
    await otpService.verifyOtp(phone, code);

    // Step 2: find or create user
    const normalized = normalizePhone(phone);
    let user = await User.findOne({ phone: normalized });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        phone: normalized,
        role: "student" as UserRole, // provisional — user picks role on /register
        isVerified: true,
        isActive: true,
      });
    } else {
      user.isVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Step 3: generate JWT pair
    const tokens = await buildTokenPair({
      _id: (user._id as unknown as string).toString(),
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    return {
      ...tokens,
      isNewUser,
      user: {
        id: (user._id as unknown as string).toString(),
        role: user.role as AuthUser["role"],
        phone: user.phone,
        email: user.email,
      },
    };
  }

  /**
   * Interface-compliant alias — used by route handlers that need
   * the isNewUser flag as well.
   */
  async loginWithOtp(
    phone: string,
    code: string,
  ): Promise<AuthTokens & { user: AuthUser }> {
    const result = await this.verifyOtp(phone, code);
    // Strip isNewUser to satisfy IAuthService interface
    const { isNewUser: _, ...rest } = result;
    return rest;
  }

  /**
   * Register a phone number and trigger OTP delivery.
   * Does NOT create the user — that happens in verifyOtp.
   */
  async registerWithPhone(phone: string): Promise<void> {
    await otpService.sendOtp(phone, "login");
  }

  /**
   * Admin email/password login.
   */
  async adminLogin(
    email: string,
    password: string,
  ): Promise<AuthTokens & { user: AuthUser }> {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase(), role: "admin" });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (!user.passwordHash) {
      throw new UnauthorizedError("Account has no password set");
    }
    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = await buildTokenPair({
      _id: (user._id as unknown as string).toString(),
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    user.lastLoginAt = new Date();
    await user.save();

    return {
      ...tokens,
      user: {
        id: (user._id as unknown as string).toString(),
        role: user.role as AuthUser["role"],
        email: user.email,
        phone: user.phone,
      },
    };
  }

  /**
   * Validate a refresh token and issue a new token pair.
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      const result = await jwtVerify(refreshToken, getRefreshSecret());
      payload = result.payload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const userId = payload.sub as string;
    if (!userId) {
      throw new UnauthorizedError("Invalid refresh token payload");
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or deactivated");
    }

    return buildTokenPair({
      _id: (user._id as unknown as string).toString(),
      role: user.role,
      phone: user.phone,
      email: user.email,
    });
  }

  /**
   * Return full user profile including role-specific sub-document.
   */
  async getProfile(
    userId: string,
  ): Promise<{ user: AuthUser; student?: unknown; driver?: unknown }> {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    const baseUser: AuthUser = {
      id: (user._id as unknown as string).toString(),
      role: user.role as AuthUser["role"],
      phone: user.phone,
      email: user.email,
    };

    let student: unknown = null;
    let driver: unknown = null;

    if (user.role === "student") {
      student = await Student.findOne({ userId: user._id }).lean();
    } else if (user.role === "driver") {
      driver = await Driver.findOne({ userId: user._id }).lean();
    }

    return { user: baseUser, student, driver };
  }

  async logout(_userId: string): Promise<void> {
    // Stateless JWT — nothing to invalidate server-side.
    // Client simply discards the tokens.
  }
}

export const authService = new AuthService();
