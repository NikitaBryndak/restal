import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";

// POST - Validate a referral code before registration
export async function POST(request: NextRequest) {
    try {
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
