import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PromoCode from "@/models/promoCode";
import User from "@/models/user";

// GET - Get all promo codes with stats (manager only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Check manager privilege (level >= 2)
        const manager = await User.findOne({ phoneNumber: session.user.phoneNumber });
        if (!manager || manager.privilegeLevel < 2) {
            return NextResponse.json(
                { message: "Доступ лише для менеджерів" },
                { status: 403 }
            );
        }

        // Expire old codes
        await PromoCode.updateMany(
            { status: "active", expiresAt: { $lt: new Date() } },
            { $set: { status: "expired" } }
        );

        // Fetch codes with pagination limit to prevent unbounded data loading
        const codes = await PromoCode.find()
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        // Calculate statistics
        const stats = {
            total: codes.length,
            active: codes.filter((c) => c.status === "active").length,
            used: codes.filter((c) => c.status === "used").length,
            expired: codes.filter((c) => c.status === "expired").length,
            totalActiveAmount: codes
                .filter((c) => c.status === "active")
                .reduce((sum, c) => sum + (c.amount || 0), 0),
            totalUsedAmount: codes
                .filter((c) => c.status === "used")
                .reduce((sum, c) => sum + (c.amount || 0), 0),
        };

        return NextResponse.json({
            codes: codes.map((c) => ({
                code: c.code,
                amount: c.amount,
                status: c.status,
                ownerName: c.ownerName,
                ownerPhone: c.ownerPhone,
                createdAt: c.createdAt,
                expiresAt: c.expiresAt,
                usedAt: c.usedAt,
                usedByManagerPhone: c.usedByManagerPhone,
            })),
            stats,
        });
    } catch (error) {
        console.error("Manager promo codes fetch error:", error);
        return NextResponse.json(
            { message: "Помилка при завантаженні кодів" },
            { status: 500 }
        );
    }
}
