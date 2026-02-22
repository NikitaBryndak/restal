import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";
import { sendSMS } from "@/lib/sms";
import crypto, { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limit forgot-password — max 3 attempts per IP per 15 minutes
    // Prevents SMS bombing and Twilio billing abuse
    const ip = getServerIp(req);
    const { allowed } = checkRateLimit("forgot-password", ip, 3, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ message: "Phone number is required" }, { status: 400 });
    }

    // Sanitize phone number - only allow digits and optional leading +
    const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, '');

    await connectToDatabase();

    const user = await User.findOne({ phoneNumber: sanitizedPhone });

    if (!user) {
        // Safe fail - don't reveal if number exists or not
      return NextResponse.json({ message: "If an account with that number exists, we have sent a verification code." }, { status: 200 });
    }

    // Generate 6 digit OTP using cryptographically secure random number
    const otp = randomInt(100000, 999999).toString();

    // Hash it for storage (using simple sha256 like tokens)
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // Expires in 10 minutes
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = otpHash;
    user.resetPasswordExpires = otpExpires;

    await user.save();

    // Send SMS via Twilio
    try {
        const message = `Your Restal password reset code is: ${otp}. Do not share this code.`;
        await sendSMS(phoneNumber, message);
    } catch (smsError) {
        console.error("Error sending SMS:", smsError);
    }

    // For development/debugging purposes, we still log it.
    if (process.env.NODE_ENV === "development") {
        console.log("----------------------------------------------------------------");
        console.log(`[DEV ONLY] To: ${phoneNumber}`);
        console.log(`Code: ${otp}`);
        console.log("----------------------------------------------------------------");
    }

    return NextResponse.json({ message: "If an account with that number exists, we have sent a verification code." });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
