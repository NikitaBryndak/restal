import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";

// SECURITY NOTE: This endpoint is used during registration to check if a phone number
// already exists. While this could theoretically be used for user enumeration,
// the same information is revealed during the registration process anyway.
// To mitigate abuse, consider adding rate limiting in production.

const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

export async function POST(request: NextRequest) {
    try {
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