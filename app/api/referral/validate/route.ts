import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";

// POST - Validate a referral code before registration
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limit referral validation — max 10 per IP per 15 minutes
        // Prevents brute-forcing valid referral codes
        const ip = getServerIp(request);
        const { allowed } = checkRateLimit("referral-validate", ip, 10, 15 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json(
                { valid: false, message: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        const { referralCode } = await request.json();

        if (!referralCode || typeof referralCode !== "string") {
            return NextResponse.json(
                { valid: false, message: "Реферальний код обов'язковий" },
                { status: 400 }
            );
        }

        const sanitizedCode = referralCode.trim().toUpperCase();

        if (!/^REF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(sanitizedCode)) {
            return NextResponse.json(
                { valid: false, message: "Невірний формат реферального коду" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const referrer = await User.findOne({ referralCode: sanitizedCode }).select("name");

        if (!referrer) {
            return NextResponse.json(
                { valid: false, message: "Реферальний код не знайдено" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            valid: true,
            referrerName: referrer.name,
            message: "Реферальний код дійсний",
        });
    } catch {
        return NextResponse.json(
            { valid: false, message: "Помилка перевірки коду" },
            { status: 500 }
        );
    }
}
