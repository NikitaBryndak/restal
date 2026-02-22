import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { REFERRAL_BONUS_REFEREE, WELCOME_BONUS } from "@/config/constants";

const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phoneNumber, email, password, referralCode } = body;

        // Input validation
        if (!name || !phoneNumber || !password) {
            return NextResponse.json({
                message: "Name, phone number, and password are required"
            }, { status: 400 });
        }

        // Sanitize phone number - only allow digits and optional leading +
        const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, '');

        if (!PHONE_REGEX.test(sanitizedPhone)) {
            return NextResponse.json({
                message: "Invalid phone number format"
            }, { status: 400 });
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            }, { status: 400 });
        }

        // Sanitize name to prevent XSS
        const sanitizedName = name.trim().slice(0, 100);

        await connectToDatabase();

        // Check for existing user
        const existingUser = await User.findOne({ phoneNumber: sanitizedPhone }).select("_id");
        if (existingUser) {
            return NextResponse.json({
                message: "An account with this phone number already exists"
            }, { status: 409 });
        }

        // Validate referral code if provided
        let referrerId = null;
        if (referralCode && typeof referralCode === "string") {
            const sanitizedCode = referralCode.trim().toUpperCase();
            if (/^REF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(sanitizedCode)) {
                const referrer = await User.findOne({ referralCode: sanitizedCode }).select("_id");
                if (referrer) {
                    referrerId = referrer._id;
                }
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // If referred, give extra bonus on top of the welcome bonus
        const initialCashback = referrerId
            ? WELCOME_BONUS + REFERRAL_BONUS_REFEREE
            : WELCOME_BONUS;

        await User.create({
            name: sanitizedName,
            phoneNumber: sanitizedPhone,
            email: email?.trim().toLowerCase(),
            password: hashedPassword,
            cashbackAmount: initialCashback,
            referredBy: referrerId,
        });

        return NextResponse.json({
            message: "User registered successfully",
            referralApplied: !!referrerId,
            bonusAmount: referrerId ? REFERRAL_BONUS_REFEREE : 0,
        }, {
            status: 201
        });

    } catch (error) {
        return NextResponse.json({
            message: "Error during registration"
        }, {
            status: 500
        });
    }
}