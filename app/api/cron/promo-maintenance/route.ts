import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PromoCode from "@/models/promoCode";
import Notification from "@/models/notification";

/**
 * Promo code expiry reminder cron job.
 * Should be called daily.
 *
 * - Sends a reminder 5 days before a promo code expires
 * - Auto-expires promo codes past their expiry date
 */
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const now = new Date();
        const results = {
            reminders: 0,
            expired: 0,
            errors: [] as string[],
        };

        // ── 1. Auto-expire promo codes past their expiry date ───────────
        try {
            const expiredResult = await PromoCode.updateMany(
                {
                    status: "active",
                    expiresAt: { $lt: now },
                },
                { $set: { status: "expired" } }
            );
            results.expired = expiredResult.modifiedCount;
        } catch (err) {
            results.errors.push("Error auto-expiring promo codes");
        }

        // ── 2. Send reminders for promo codes expiring in 5 days ────────
        const fiveDaysFromNow = new Date(now);
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        fiveDaysFromNow.setHours(23, 59, 59, 999);

        const fourDaysFromNow = new Date(now);
        fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
        fourDaysFromNow.setHours(0, 0, 0, 0);

        // Find promo codes expiring between 4 and 5 days from now (to catch the 5-day window once)
        const expiringCodes = await PromoCode.find({
            status: "active",
            expiresAt: {
                $gte: fourDaysFromNow,
                $lte: fiveDaysFromNow,
            },
        }).lean();

        for (const code of expiringCodes) {
            try {
                // Check if we already sent a reminder for this promo code
                const existingReminder = await Notification.findOne({
                    userPhone: code.ownerPhone,
                    "data.type": "promo_expiry_reminder",
                    "data.promoCode": code.code,
                });
                if (existingReminder) continue;

                const expiryDate = new Date(code.expiresAt);
                const formattedDate = expiryDate.toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });

                await Notification.create({
                    userPhone: code.ownerPhone,
                    tripId: code._id, // Re-use tripId field for promo reference
                    tripNumber: code.code,
                    type: "status_change",
                    message: `⏰ Ваш промокод ${code.code} на ${code.amount.toLocaleString('uk-UA')} грн закінчується ${formattedDate}. Не забудьте використати його!`,
                    data: {
                        type: "promo_expiry_reminder",
                        promoCode: code.code,
                        amount: code.amount,
                        expiresAt: code.expiresAt,
                    },
                    read: false,
                });

                results.reminders++;
            } catch (err) {
                results.errors.push(`Reminder error for promo ${code.code}`);
            }
        }

        return NextResponse.json({
            message: "Promo code maintenance completed",
            ...results,
            errors: results.errors.length > 0 ? results.errors : undefined,
        }, { status: 200 });
    } catch (error) {
        console.error("Promo maintenance error:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
