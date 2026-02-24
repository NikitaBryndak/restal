import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, BCRYPT_SALT_ROUNDS } from "@/config/constants";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.phoneNumber) {
            return NextResponse.json({
                message: "Неавторизовано"
            }, { status: 401 });
        }

        // SECURITY: Rate limit password changes — max 5 attempts per user per 15 minutes
        // Prevents brute-forcing the current password with a stolen session
        const { allowed } = checkRateLimit("change-password", session.user.phoneNumber, 5, 15 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json({
                message: "Забагато спроб зміни паролю. Спробуйте пізніше."
            }, { status: 429 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Input validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                message: "Поточний та новий паролі обов'язкові"
            }, { status: 400 });
        }

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json({
                message: `Новий пароль повинен містити щонайменше ${MIN_PASSWORD_LENGTH} символів`
            }, { status: 400 });
        }

        // SECURITY: Prevent DoS via expensive bcrypt hashing and silent truncation at 72 bytes
        if (newPassword.length > MAX_PASSWORD_LENGTH) {
            return NextResponse.json({
                message: `Пароль не може перевищувати ${MAX_PASSWORD_LENGTH} символів`
            }, { status: 400 });
        }

        if (currentPassword === newPassword) {
            return NextResponse.json({
                message: "Новий пароль повинен відрізнятися від поточного"
            }, { status: 400 });
        }

        await connectToDatabase();

        // Find user by phone number
        const user = await User.findOne({ phoneNumber: session.user.phoneNumber });

        if (!user) {
            return NextResponse.json({
                message: "Користувача не знайдено"
            }, { status: 404 });
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return NextResponse.json({
                message: "Поточний пароль невірний"
            }, { status: 401 });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({
            message: "Пароль успішно змінено"
        }, { status: 200 });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({
            message: "Внутрішня помилка сервера"
        }, { status: 500 });
    }
}
