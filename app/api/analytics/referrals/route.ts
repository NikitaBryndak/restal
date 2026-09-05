import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import Trip from "@/models/trip";
import { getSessionRole, hasAnyScope } from "@/lib/role-access";
import { checkRateLimit } from "@/lib/rate-limit";
import { SECURITY_HEADERS, RATE_LIMITS } from "@/config/constants";

/**
 * GET /api/analytics/referrals
 * Admin-only endpoint returning referral program attribution:
 *   - overview totals (referrers, referred users, bonus earned, referee trips/revenue)
 *   - per-referrer rows with the trips and revenue their referees generated
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const rl = checkRateLimit("analytics-referrals", session.user.phoneNumber, RATE_LIMITS["analytics-referrals"].max, RATE_LIMITS["analytics-referrals"].windowMs);
        if (!rl.allowed) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }

        await connectToDatabase();

        const role = await getSessionRole(session);
        if (!hasAnyScope(role, ["analytics"])) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // All referees (users registered via a referral code).
        const referees = await User.find({ referredBy: { $exists: true, $ne: null } })
            .select("phoneNumber referredBy")
            .lean();

        if (referees.length === 0) {
            return NextResponse.json(
                {
                    date: new Date().toISOString(),
                    overview: { referrers: 0, referredUsers: 0, bonusEarned: 0, refereeTrips: 0, refereeRevenue: 0, refereePaid: 0 },
                    topReferrers: [],
                },
                { headers: SECURITY_HEADERS }
            );
        }

        // Referrer profiles + trips owned by referees (in parallel).
        const referrerIds = [...new Set(referees.map((r) => r.referredBy))];
        const refereePhones = [...new Set(referees.map((r) => r.phoneNumber).filter(Boolean))];

        const [referrerDocs, tripsByOwner] = await Promise.all([
            User.find({ _id: { $in: referrerIds } })
                .select("name phoneNumber referralCode referralCount referralBonusEarned")
                .lean(),
            Trip.aggregate([
                { $match: { ownerPhone: { $in: refereePhones } } },
                {
                    $group: {
                        _id: "$ownerPhone",
                        tripCount: { $sum: 1 },
                        totalAmount: { $sum: "$payment.totalAmount" },
                        paidAmount: { $sum: "$payment.paidAmount" },
                    },
                },
            ]),
        ]);

        const tripsMap = new Map(tripsByOwner.map((t) => [String(t._id), t]));

        // Group referee phones by referrer.
        const refereesByReferrer = new Map<string, string[]>();
        for (const r of referees) {
            const key = String(r.referredBy);
            const list = refereesByReferrer.get(key) ?? [];
            if (r.phoneNumber) list.push(r.phoneNumber);
            refereesByReferrer.set(key, list);
        }

        let totalBonusEarned = 0;
        const topReferrers = referrerDocs.map((ref) => {
            const refereePhonesOfReferrer = refereesByReferrer.get(String(ref._id)) ?? [];
            let refereeTrips = 0;
            let refereeRevenue = 0;
            for (const phone of refereePhonesOfReferrer) {
                const t = tripsMap.get(phone);
                if (!t) continue;
                refereeTrips += t.tripCount;
                refereeRevenue += t.totalAmount || 0;
            }
            totalBonusEarned += ref.referralBonusEarned || 0;
            return {
                name: ref.name,
                phone: ref.phoneNumber,
                code: ref.referralCode ?? "",
                registeredCount: refereePhonesOfReferrer.length,
                referredCount: ref.referralCount ?? 0,
                bonusEarned: ref.referralBonusEarned ?? 0,
                refereeTrips,
                refereeRevenue,
            };
        });
        topReferrers.sort((a, b) => b.referredCount - a.referredCount || b.refereeRevenue - a.refereeRevenue);

        let totalRefereeTrips = 0;
        let totalRefereeRevenue = 0;
        let totalRefereePaid = 0;
        for (const t of tripsByOwner) {
            totalRefereeTrips += t.tripCount;
            totalRefereeRevenue += t.totalAmount || 0;
            totalRefereePaid += t.paidAmount || 0;
        }

        return NextResponse.json(
            {
                date: new Date().toISOString(),
                overview: {
                    referrers: referrerDocs.length,
                    referredUsers: referees.length,
                    bonusEarned: totalBonusEarned,
                    refereeTrips: totalRefereeTrips,
                    refereeRevenue: totalRefereeRevenue,
                    refereePaid: totalRefereePaid,
                },
                topReferrers,
            },
            { headers: SECURITY_HEADERS }
        );
    } catch (error) {
        console.error("Error fetching referrals analytics:", error);
        return NextResponse.json({ message: "Error fetching referrals analytics" }, { status: 500 });
    }
}
