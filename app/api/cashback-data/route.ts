import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/user";
import Trip from "@/models/trip";
import PromoCode from "@/models/promoCode";
import { SUPER_ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";

/**
 * Combined cashback data endpoint.
 * Returns profile, trips (minimal fields), and promo codes in a single request.
 * This avoids 3 separate HTTP round-trips + 3 getServerSession calls.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
        const isSuperAdmin = userPrivilegeLevel >= SUPER_ADMIN_PRIVILEGE_LEVEL;

        const tripQuery = isSuperAdmin
            ? {}
            : { $or: [{ ownerPhone: userPhone }, { managerPhone: userPhone }] };

        // Run all 3 DB queries in parallel
        const [userDoc, trips, _expireResult] = await Promise.all([
            User.findOne({ phoneNumber: userPhone })
                .select("name email phoneNumber createdAt cashbackAmount privilegeLevel referralCode referralCount referralBonusEarned")
                .lean(),
            Trip.find(tripQuery)
                .select("number country payment cashbackAmount cashbackProcessed status updatedAt ownerPhone")
                .sort({ createdAt: -1 })
                .lean(),
            // Expire stale promo codes as a side effect
            PromoCode.updateMany(
                { ownerPhone: userPhone, status: "active", expiresAt: { $lt: new Date() } },
                { $set: { status: "expired" } }
            ),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = userDoc as Record<string, any> | null;

        // Fetch promo codes AFTER expiration is done
        const codes = await PromoCode.find({ ownerPhone: userPhone })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            profile: user
                ? {
                      userName: user.name,
                      userEmail: user.email,
                      phoneNumber: user.phoneNumber,
                      createdAt: user.createdAt,
                      cashbackAmount: user.cashbackAmount,
                      privilegeLevel: user.privilegeLevel,
                      referralCode: user.referralCode || null,
                      referralCount: user.referralCount || 0,
                      referralBonusEarned: user.referralBonusEarned || 0,
                  }
                : null,
            trips: trips,
            promoCodes: codes.map((c) => ({
                code: c.code,
                amount: c.amount,
                status: c.status,
                createdAt: c.createdAt,
                expiresAt: c.expiresAt,
                usedAt: c.usedAt,
            })),
        });
    } catch (error) {
        console.error("Cashback data fetch error:", error);
        return NextResponse.json(
            { message: "Error fetching cashback data" },
            { status: 500 }
        );
    }
}
