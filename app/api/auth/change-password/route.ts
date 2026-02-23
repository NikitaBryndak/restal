import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { MIN_PASSWORD_LENGTH, BCRYPT_SALT_ROUNDS } from "@/config/constants";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.phoneNumber) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        // SECURITY: Rate limit password changes — max 5 attempts per user per 15 minutes
        // Prevents brute-forcing the current password with a stolen session
        const { allowed } = checkRateLimit("change-password", session.user.phoneNumber, 5, 15 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json({
                message: "Too many password change attempts. Please try again later."
            }, { status: 429 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Input validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                message: "Current password and new password are required"
            }, { status: 400 });
        }

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json({
                message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`
            }, { status: 400 });
        }

        if (currentPassword === newPassword) {
            return NextResponse.json({
                message: "New password must be different from current password"
            }, { status: 400 });
        }

        await connectToDatabase();

        // Find user by phone number
        const user = await User.findOne({ phoneNumber: session.user.phoneNumber });

        if (!user) {
            return NextResponse.json({
                message: "User not found"
            }, { status: 404 });
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return NextResponse.json({
                message: "Current password is incorrect"
            }, { status: 401 });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({
            message: "Password changed successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({
            message: "Internal server error"
        }, { status: 500 });
    }
}
