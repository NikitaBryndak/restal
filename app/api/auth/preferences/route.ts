import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { RATE_LIMITS } from "@/config/constants";

/**
 * POST /api/auth/preferences
 *
 * Updates the signed-in user's notification preferences.
 * Body: { notifyEmail?: boolean, notifySms?: boolean } — at least one required.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResult = checkRateLimit("update-preferences", session.user.phoneNumber, RATE_LIMITS["update-preferences"].max, RATE_LIMITS["update-preferences"].windowMs);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
        }

        const updates: Record<string, boolean> = {};
        for (const key of ["notifyEmail", "notifySms", "notifyTelegram"] as const) {
            if (body[key] !== undefined) {
                if (typeof body[key] !== "boolean") {
                    return NextResponse.json({ message: `${key} must be a boolean` }, { status: 400 });
                }
                updates[key] = body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "No preferences to update" }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOneAndUpdate(
            { phoneNumber: session.user.phoneNumber },
            { $set: updates },
            { new: true }
        ).select("notifyEmail notifySms notifyTelegram name");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        logAudit({
            action: "preferences_updated",
            entityType: "user",
            entityId: String(user._id),
            userId: String(user._id),
            userPhone: session.user.phoneNumber,
            userName: user.name || "",
            details: updates,
        });

        return NextResponse.json({
            notifyEmail: user.notifyEmail ?? false,
            notifySms: user.notifySms ?? false,
            notifyTelegram: user.notifyTelegram ?? false,
        }, { status: 200 });

    } catch (error) {
        console.error("Preferences update error:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json({ message: "Error updating preferences" }, { status: 500 });
    }
}
