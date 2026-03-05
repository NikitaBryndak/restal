import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import Trip from "@/models/trip";
import PromoCode from "@/models/promoCode";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

const SECURITY_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
};

/**
 * GET /api/analytics/bonuses
 * Admin-only endpoint returning per-user bonus summary:
 *   - current balance (cashbackAmount)
 *   - total accrued bonuses (from trips + welcome + referral)
 *   - total used bonuses (redeemed promo codes)
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json(
                { message: "Не авторизовано" },
                { status: 401, headers: SECURITY_HEADERS }
            );
        }

        const rl = checkRateLimit("analytics-bonuses", session.user.phoneNumber, 20, 5 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { message: "Забагато запитів. Спробуйте пізніше." },
                { status: 429, headers: { ...SECURITY_HEADERS, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
            );
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ phoneNumber: session.user.phoneNumber })
            .select("privilegeLevel")
            .lean() as { privilegeLevel?: number } | null;

        if (!currentUser || (currentUser.privilegeLevel ?? 1) < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json(
                { message: "Недостатньо прав" },
                { status: 403, headers: SECURITY_HEADERS }
            );
        }

        // Fetch all users, accrued cashback from trips, and used promo codes in parallel
        const [users, accruedByOwner, usedByOwner] = await Promise.all([
            User.find()
                .select("name phoneNumber cashbackAmount referralBonusEarned createdAt")
                .sort({ createdAt: -1 })
                .lean()
                .exec() as unknown as Promise<{
                    _id: string;
                    name: string;
                    phoneNumber: string;
                    cashbackAmount: number;
                    referralBonusEarned?: number;
                    createdAt: Date;
                }[]>,

            // Sum of cashbackAmount from trips where cashback was processed, grouped by ownerPhone
            Trip.aggregate<{ _id: string; totalAccrued: number; tripCount: number }>([
                { $match: { cashbackProcessed: true, cashbackAmount: { $gt: 0 } } },
                {
                    $group: {
                        _id: "$ownerPhone",
                        totalAccrued: { $sum: "$cashbackAmount" },
                        tripCount: { $sum: 1 },
                    },
                },
            ]),

            // Sum of used promo code amounts, grouped by ownerPhone
            PromoCode.aggregate<{ _id: string; totalUsed: number; usedCount: number }>([
                { $match: { status: "used" } },
                {
                    $group: {
                        _id: "$ownerPhone",
                        totalUsed: { $sum: "$amount" },
                        usedCount: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Build lookup maps
        const accruedMap = new Map(accruedByOwner.map((a) => [a._id, a]));
        const usedMap = new Map(usedByOwner.map((u) => [u._id, u]));

        // Totals
        let grandTotalBalance = 0;
        let grandTotalAccrued = 0;
        let grandTotalUsed = 0;

        const rows = users.map((user) => {
            const accrued = accruedMap.get(user.phoneNumber);
            const used = usedMap.get(user.phoneNumber);

            const accruedFromTrips = accrued?.totalAccrued ?? 0;
            const referralBonus = user.referralBonusEarned ?? 0;
            const totalAccrued = accruedFromTrips + referralBonus;

            const totalUsed = used?.totalUsed ?? 0;

            const balance = user.cashbackAmount ?? 0;

            grandTotalBalance += balance;
            grandTotalAccrued += totalAccrued;
            grandTotalUsed += totalUsed;

            return {
                phoneNumber: user.phoneNumber,
                name: user.name,
                balance,
                totalAccrued,
                accruedFromTrips,
                referralBonus,
                totalUsed,
                usedCount: used?.usedCount ?? 0,
                tripCashbackCount: accrued?.tripCount ?? 0,
                createdAt: user.createdAt,
            };
        });

        return NextResponse.json(
            {
                date: new Date().toISOString(),
                totals: {
                    balance: grandTotalBalance,
                    accrued: grandTotalAccrued,
                    used: grandTotalUsed,
                    userCount: users.length,
                },
                users: rows,
            },
            { headers: SECURITY_HEADERS }
        );
    } catch (error) {
        console.error("Bonuses analytics API error:", error);
        return NextResponse.json(
            { message: "Помилка сервера" },
            { status: 500, headers: SECURITY_HEADERS }
        );
    }
}
