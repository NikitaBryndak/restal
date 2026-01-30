import { NextResponse } from "next/server";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { phoneNumber, otp, password } = await req.json();

    if (!phoneNumber || !otp || !password) {
      return NextResponse.json({ message: "Phone Number, Code, and Password are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Hash the otp to compare with stored hash
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      phoneNumber: phoneNumber,
      resetPasswordToken: otpHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return NextResponse.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
