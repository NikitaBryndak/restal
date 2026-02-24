import { NextResponse } from "next/server";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH, BCRYPT_SALT_ROUNDS, OTP_LENGTH, OTP_MAX_ATTEMPTS, LOCKOUT_DURATION_MS } from "@/config/constants";

export async function POST(req: Request) {
  try {
    const { phoneNumber, otp, password } = await req.json();

    if (!phoneNumber || !otp || !password) {
      return NextResponse.json({ message: "Номер телефону, код та пароль обов'язкові" }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ message: `Пароль повинен містити щонайменше ${MIN_PASSWORD_LENGTH} символів` }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, '');
    const sanitizedOtp = otp.replace(/\D/g, '').slice(0, OTP_LENGTH);  // Only digits, max 6

    await connectToDatabase();

    // Find user by phone number first to check lockout
    const userByPhone = await User.findOne({ phoneNumber: sanitizedPhone });

    if (!userByPhone) {
      // Don't reveal if user exists
      return NextResponse.json({ message: "Невірний або прострочений код підтвердження" }, { status: 400 });
    }

    // Check if account is locked
    if (userByPhone.resetPasswordLockUntil && userByPhone.resetPasswordLockUntil > new Date()) {
      const remainingMinutes = Math.ceil((userByPhone.resetPasswordLockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({
        message: `Забагато невдалих спроб. Спробуйте через ${remainingMinutes} хв.`
      }, { status: 429 });
    }

    // Hash the otp to compare with stored hash
    const otpHash = crypto
      .createHash("sha256")
      .update(sanitizedOtp)
      .digest("hex");

    // Verify OTP matches and hasn't expired
    const isValidOtp = userByPhone.resetPasswordToken === otpHash &&
                       userByPhone.resetPasswordExpires &&
                       userByPhone.resetPasswordExpires > new Date();

    if (!isValidOtp) {
      // Increment failed attempts
      userByPhone.resetPasswordAttempts = (userByPhone.resetPasswordAttempts || 0) + 1;

      if (userByPhone.resetPasswordAttempts >= OTP_MAX_ATTEMPTS) {
        userByPhone.resetPasswordLockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        userByPhone.resetPasswordAttempts = 0;
        userByPhone.resetPasswordToken = undefined;
        userByPhone.resetPasswordExpires = undefined;
      }

      await userByPhone.save();
      return NextResponse.json({ message: "Невірний або прострочений код підтвердження" }, { status: 400 });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    userByPhone.password = hashedPassword;

    // Clear reset token fields and attempts
    userByPhone.resetPasswordToken = undefined;
    userByPhone.resetPasswordExpires = undefined;
    userByPhone.resetPasswordAttempts = 0;
    userByPhone.resetPasswordLockUntil = undefined;

    await userByPhone.save();

    return NextResponse.json({ message: "Пароль успішно змінено" });

  } catch {
    return NextResponse.json({ message: "Внутрішня помилка сервера" }, { status: 500 });
  }
}
