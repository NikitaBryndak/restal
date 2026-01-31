import { NextResponse } from "next/server";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  try {
    const { phoneNumber, otp, password } = await req.json();

    if (!phoneNumber || !otp || !password) {
      return NextResponse.json({ message: "Phone Number, Code, and Password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectToDatabase();

    // Find user by phone number first to check lockout
    const userByPhone = await User.findOne({ phoneNumber });

    if (!userByPhone) {
      // Don't reveal if user exists
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // Check if account is locked
    if (userByPhone.resetPasswordLockUntil && userByPhone.resetPasswordLockUntil > new Date()) {
      const remainingMinutes = Math.ceil((userByPhone.resetPasswordLockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({
        message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`
      }, { status: 429 });
    }

    // Hash the otp to compare with stored hash
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // Verify OTP matches and hasn't expired
    const isValidOtp = userByPhone.resetPasswordToken === otpHash &&
                       userByPhone.resetPasswordExpires &&
                       userByPhone.resetPasswordExpires > new Date();

    if (!isValidOtp) {
      // Increment failed attempts
      userByPhone.resetPasswordAttempts = (userByPhone.resetPasswordAttempts || 0) + 1;

      if (userByPhone.resetPasswordAttempts >= MAX_ATTEMPTS) {
        userByPhone.resetPasswordLockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        userByPhone.resetPasswordAttempts = 0;
        userByPhone.resetPasswordToken = undefined;
        userByPhone.resetPasswordExpires = undefined;
      }

      await userByPhone.save();
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(password, 10);
    userByPhone.password = hashedPassword;

    // Clear reset token fields and attempts
    userByPhone.resetPasswordToken = undefined;
    userByPhone.resetPasswordExpires = undefined;
    userByPhone.resetPasswordAttempts = 0;
    userByPhone.resetPasswordLockUntil = undefined;

    await userByPhone.save();

    return NextResponse.json({ message: "Password reset successful" });

  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
