import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PhoneVerification from "@/models/phoneVerification";
import crypto from "crypto";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";
import { PHONE_REGEX, OTP_LENGTH, OTP_MAX_ATTEMPTS, LOCKOUT_DURATION_MS } from "@/config/constants";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limit OTP verification — max 10 per IP per 15 minutes
    const ip = getServerIp(req);
    const { allowed } = checkRateLimit("verify-otp", ip, 10, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { message: "Забагато спроб. Спробуйте пізніше." },
        { status: 429 }
      );
    }

    const { phoneNumber, otp } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { message: "Номер телефону обов'язковий" },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { message: "Код підтвердження обов'язковий" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, "");
    const sanitizedOtp = otp.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!PHONE_REGEX.test(sanitizedPhone)) {
      return NextResponse.json(
        { message: "Невірний формат номера телефону" },
        { status: 400 }
      );
    }

    if (sanitizedOtp.length !== OTP_LENGTH) {
      return NextResponse.json(
        { message: "Код підтвердження повинен містити 6 цифр" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the latest OTP record for this phone number
    const verification = await PhoneVerification.findOne({
      phoneNumber: sanitizedPhone,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!verification) {
      return NextResponse.json(
        { message: "Код підтвердження не знайдено. Запросіть новий код." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (verification.expiresAt < new Date()) {
      await PhoneVerification.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { message: "Код підтвердження закінчився. Запросіть новий код." },
        { status: 400 }
      );
    }

    // Check if too many failed attempts
    if (verification.attempts >= OTP_MAX_ATTEMPTS) {
      await PhoneVerification.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { message: "Забагато невдалих спроб. Запросіть новий код." },
        { status: 400 }
      );
    }

    // Hash the submitted OTP and compare
    const otpHash = crypto.createHash("sha256").update(sanitizedOtp).digest("hex");

    if (verification.otpHash !== otpHash) {
      // Increment attempt counter
      verification.attempts += 1;
      await verification.save();

      const remaining = OTP_MAX_ATTEMPTS - verification.attempts;
      return NextResponse.json(
        {
          message:
            remaining > 0
              ? `Невірний код. Залишилось спроб: ${remaining}`
              : "Забагато невдалих спроб. Запросіть новий код.",
        },
        { status: 400 }
      );
    }

    // OTP is valid — mark as verified
    verification.verified = true;
    await verification.save();

    return NextResponse.json({
      message: "Номер телефону підтверджено!",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { message: "Внутрішня помилка сервера" },
      { status: 500 }
    );
  }
}
