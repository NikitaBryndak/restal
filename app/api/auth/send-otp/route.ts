import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PhoneVerification from "@/models/phoneVerification";
import { sendSMS } from "@/lib/sms";
import crypto, { randomInt } from "crypto";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";
import { PHONE_REGEX, OTP_EXPIRY_MS } from "@/config/constants";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limit OTP sending — max 3 per IP per 15 minutes
    // Prevents SMS bombing and Twilio billing abuse
    const ip = getServerIp(req);
    const { allowed } = checkRateLimit("send-otp", ip, 3, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { message: "Забагато запитів. Спробуйте пізніше." },
        { status: 429 }
      );
    }

    const { phoneNumber, purpose } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { message: "Номер телефону обов'язковий" },
        { status: 400 }
      );
    }

    // Sanitize phone number
    const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, "");

    if (!PHONE_REGEX.test(sanitizedPhone)) {
      return NextResponse.json(
        { message: "Невірний формат номера телефону" },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ["register", "forgot-password"];
    const otpPurpose = validPurposes.includes(purpose) ? purpose : "register";

    await connectToDatabase();

    // Delete any existing unverified OTPs for this phone number
    await PhoneVerification.deleteMany({
      phoneNumber: sanitizedPhone,
      verified: false,
    });

    // Generate 6-digit OTP using cryptographically secure random number
    const otp = randomInt(100000, 999999).toString();

    // Hash it for storage
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Store OTP in database
    await PhoneVerification.create({
      phoneNumber: sanitizedPhone,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      attempts: 0,
      verified: false,
    });

    // Send SMS via Twilio
    const messageText =
      otpPurpose === "forgot-password"
        ? `Ваш код відновлення пароля RestAL: ${otp}. Не повідомляйте цей код нікому.`
        : `Ваш код підтвердження RestAL: ${otp}. Не повідомляйте цей код нікому.`;

    try {
      await sendSMS(sanitizedPhone, messageText);
    } catch (smsError: any) {
      console.error("Error sending SMS:", smsError);

      // In production, we should let the user know if SMS failed
      // especially if it's a configuration error like Geo Permissions
      if (process.env.NODE_ENV === 'production') {
         return NextResponse.json(
           { message: "Не вдалося надіслати SMS. Перевірте правильність номера або спробуйте пізніше." },
           { status: 500 }
         );
      }
      // In development, we log it and continue
    }

    // Log OTP in development for testing
    if (process.env.NODE_ENV === "development") {
      console.log("----------------------------------------------------------------");
      console.log(`[DEV ONLY] To: ${sanitizedPhone}`);
      console.log(`Code: ${otp}`);
      console.log("----------------------------------------------------------------");
    }

    return NextResponse.json({
      message: "Код підтвердження надіслано на ваш номер телефону.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { message: "Внутрішня помилка сервера" },
      { status: 500 }
    );
  }
}
