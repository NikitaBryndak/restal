import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getServerIp } from "@/lib/rate-limit";
import { PHONE_REGEX } from "@/config/constants";

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limit user existence checks — max 10 per IP per 15 minutes
        // Prevents mass phone number enumeration
        const ip = getServerIp(request);
        const { allowed } = checkRateLimit("userExists", ip, 10, 15 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json({
                exists: false,
                message: "Too many requests. Please try again later."
            }, { status: 429 });
        }

        const { phoneNumber } = await request.json();

        // Validate phone number format to prevent NoSQL injection
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return NextResponse.json({
                exists: false,
                message: "Phone number required"
            }, { status: 400 });
        }

        // Sanitize phone number - only allow digits and optional leading +
        const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, '');

        if (!PHONE_REGEX.test(sanitizedPhone)) {
            return NextResponse.json({
                exists: false,
                message: "Invalid phone number format"
            }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ phoneNumber: sanitizedPhone }).select("_id");

        return NextResponse.json({
            exists: !!user,
            message: user ? "User exists" : "User not found"
        }, {
            status: 200
        });

    } catch {
        return NextResponse.json({
            message: "Error checking user existence",
            exists: false
        }, {
            status: 500
        });
    }
}