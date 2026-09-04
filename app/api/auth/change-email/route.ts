import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.phoneNumber) {
            return NextResponse.json({
                message: "Неавторизовано"
            }, { status: 401 });
        }

        // SECURITY: Rate limit email changes
        const rateLimitResult = checkRateLimit("change-email", session.user.phoneNumber, 5, 15 * 60 * 1000);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({
                message: "Забагато спроб. Спробуйте пізніше."
            }, { status: 429 });
        }

        const body = await request.json();
        const newEmail = typeof body.newEmail === "string" ? body.newEmail.trim() : "";

        // Empty value clears the email address (user opts out of email entirely)
        if (newEmail && !EMAIL_REGEX.test(newEmail)) {
            return NextResponse.json({
                message: "Некоректний формат email"
            }, { status: 400 });
        }

        if (newEmail.length > MAX_EMAIL_LENGTH) {
            return NextResponse.json({
                message: `Email не може перевищувати ${MAX_EMAIL_LENGTH} символів`
            }, { status: 400 });
        }

        await connectToDatabase();
        const existing = await User.findOne({ phoneNumber: session.user.phoneNumber });

        if (!existing) {
            return NextResponse.json({
                message: "Користувача не знайдено"
            }, { status: 404 });
        }

        const update = newEmail ? { $set: { email: newEmail } } : { $unset: { email: "" } };

        await User.updateOne(
            { phoneNumber: session.user.phoneNumber },
            update
        );

        logAudit({
            action: "user.email_changed",
            entityType: "user",
            userId: session.user.phoneNumber,
            userPhone: session.user.phoneNumber,
            userName: existing.name,
            details: { oldEmail: existing.email || null, newEmail: newEmail || null },
        });

        return NextResponse.json({
            message: newEmail ? "Email успішно збережено" : "Email видалено",
            userEmail: newEmail || null
        }, { status: 200 });
    } catch (error) {
        console.error("Change email error:", error);
        return NextResponse.json({
            message: "Внутрішня помилка сервера"
        }, { status: 500 });
    }
}
