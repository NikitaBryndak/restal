import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import PhoneVerification from "@/models/phoneVerification";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { WELCOME_BONUS, PHONE_REGEX, MIN_PASSWORD_LENGTH, BCRYPT_SALT_ROUNDS } from "@/config/constants";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";

// SECURITY: Basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limit registration — max 5 attempts per IP per hour
        const ip = getServerIp(request);
        const { allowed } = checkRateLimit("register", ip, 5, 60 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json(
                { message: "Too many registration attempts. Please try again later." },
                { status: 429 }
            );
        }

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

        // SECURITY: Verify that the phone number was verified via OTP RECENTLY (e.g. within last 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const verification = await PhoneVerification.findOne({
            phoneNumber: sanitizedPhone,
            verified: true,
            updatedAt: { $gte: tenMinutesAgo }
        }).sort({ createdAt: -1 });

        if (!verification) {
            return NextResponse.json({
                message: "Phone number has not been verified or verification expired. Please verify again."
            }, { status: 403 });
        }

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

        // SECURITY: Validate email format if provided
        if (email && typeof email === 'string' && email.trim().length > 0) {
            if (!EMAIL_REGEX.test(email.trim())) {
                return NextResponse.json({
                    message: "Invalid email format"
                }, { status: 400 });
            }
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // Welcome bonus only at registration — referral bonus is awarded when first trip completes
        await User.create({
            name: sanitizedName,
            phoneNumber: sanitizedPhone,
            email: email?.trim().toLowerCase() || undefined,  // Only store if provided
            password: hashedPassword,
            cashbackAmount: WELCOME_BONUS,
            referredBy: referrerId,
        });

        // Clean up verification record after successful registration
        await PhoneVerification.deleteMany({ phoneNumber: sanitizedPhone });

        return NextResponse.json({
            message: "User registered successfully",
            referralApplied: !!referrerId,
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