import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";
import { sendSMS } from "@/lib/sms";
import crypto, { randomInt } from "crypto";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";
import { OTP_EXPIRY_MS, PHONE_REGEX } from "@/config/constants";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limit forgot-password — max 3 attempts per IP per 15 minutes
    // Prevents SMS bombing and Twilio billing abuse
    const ip = getServerIp(req);
    const { allowed } = checkRateLimit("forgot-password", ip, 3, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { message: "Забагато запитів. Спробуйте пізніше." },
        { status: 429 }
      );
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ message: "Номер телефону обов'язковий" }, { status: 400 });
    }

    // Sanitize phone number - only allow digits and optional leading +
    const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, '');

    if (!PHONE_REGEX.test(sanitizedPhone)) {
      return NextResponse.json(
        { message: "Невірний формат номера телефону" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ phoneNumber: sanitizedPhone });

    if (!user) {
      // Safe fail - don't reveal if number exists or not
      return NextResponse.json({ message: "Якщо акаунт з цим номером існує, ми надіслали код підтвердження." }, { status: 200 });
    }

    // Generate 6 digit OTP using cryptographically secure random number
    const otp = randomInt(100000, 999999).toString();

    // Hash it for storage (using simple sha256 like tokens)
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // Expires in 10 minutes
    const otpExpires = Date.now() + OTP_EXPIRY_MS;

    user.resetPasswordToken = otpHash;
    user.resetPasswordExpires = otpExpires;

    await user.save();

    // Send SMS via Twilio
    try {
        const message = `Ваш код відновлення пароля RestAL: ${otp}. Не повідомляйте цей код нікому.`;
        await sendSMS(sanitizedPhone, message);
    } catch (smsError) {
        console.error("Error sending SMS:", smsError);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { message: "Не вдалося надіслати SMS. Перевірте правильність номера або спробуйте пізніше." },
            { status: 500 }
          );
        }
    }

    // For development/debugging purposes, we still log it.
    if (process.env.NODE_ENV === "development") {
        console.log("----------------------------------------------------------------");
        console.log(`[DEV ONLY] To: ${sanitizedPhone}`);
        console.log(`Code: ${otp}`);
        console.log("----------------------------------------------------------------");
    }

    return NextResponse.json({ message: "Якщо акаунт з цим номером існує, ми надіслали код підтвердження." });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Внутрішня помилка сервера" }, { status: 500 });
  }
}
