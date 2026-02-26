import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import { REFERRAL_BONUS_REFERRER, REFERRAL_BONUS_REFEREE } from "@/config/constants";
import { createNotification } from "@/lib/notifications";
import { sendCashbackCreditedEmail } from "@/lib/email";

// Helper to parse DD/MM/YYYY date format
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

// This endpoint should be called daily by a cron job or scheduled task
// It processes cashback for trips that ended one day ago
export async function POST(request: Request) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // SECURITY: Fail closed - if no secret is configured, deny access
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find trips where:
        // 1. cashbackProcessed is false
        // 2. tripEndDate is at least one day ago
        // 3. cashbackAmount > 0
        const trips = await Trip.find({
            cashbackProcessed: { $ne: true },
            cashbackAmount: { $gt: 0 },
        }).lean();

        let processedCount = 0;
        const errors: string[] = [];

        for (const trip of trips) {
            try {
                const endDate = parseDate(trip.tripEndDate);
                if (!endDate) continue;

                // Calculate one day after tour end
                const processAfterDate = new Date(endDate);
                processAfterDate.setDate(processAfterDate.getDate() + 1);
                processAfterDate.setHours(0, 0, 0, 0);

                // Check if we've passed the processing date
                if (today < processAfterDate) {
                    continue; // Not yet time to process this trip
                }

                // SECURITY: Atomically claim the trip first to prevent double-crediting.
                // If the process crashes after this but before crediting the user,
                // the worst case is a missed credit (which can be manually corrected),
                // rather than a double credit (financial loss).
                const claimed = await Trip.findOneAndUpdate(
                    { _id: trip._id, cashbackProcessed: { $ne: true } },
                    { $set: { cashbackProcessed: true } },
                    { new: true }
                );

                // If another process already claimed this trip, skip it
                if (!claimed) continue;

                // Now safely credit the user
                const updatedUser = await User.findOneAndUpdate(
                    { phoneNumber: trip.ownerPhone },
                    { $inc: { cashbackAmount: (trip.cashbackAmount || 0) } },
                    { new: true }
                );

                if (updatedUser) {
                    processedCount++;

                    // Notify user about cashback credited
                    try {
                        await createNotification({
                            userPhone: trip.ownerPhone,
                            tripId: String(trip._id),
                            tripNumber: trip.number,
                            type: "status_change",
                            message: `🎉 Кешбек +${(trip.cashbackAmount || 0).toLocaleString('uk-UA')} грн нараховано за подорож ${trip.number} (${trip.country})! Ваш баланс: ${(updatedUser.cashbackAmount || 0).toLocaleString('uk-UA')} грн`,
                            data: { type: "cashback_credited", amount: trip.cashbackAmount },
                        });
                        // Send cashback email if user has email
                        if (updatedUser.email) {
                            await sendCashbackCreditedEmail({
                                to: updatedUser.email,
                                userName: updatedUser.name || "Шановний клієнт",
                                tripNumber: trip.number,
                                country: trip.country || "",
                                cashbackAmount: trip.cashbackAmount || 0,
                                newBalance: updatedUser.cashbackAmount || 0,
                            });
                        }
                    } catch {
                        // Notification/email failure is non-critical
                    }

                    // --- Referral bonus processing ---
                    // If this user was referred and this is their first completed trip,
                    // award BOTH the referrer and the referee their bonuses
                    if (updatedUser.referredBy) {
                        try {
                            // Check if this is the first cashback-processed trip for this user
                            const previousProcessedTrips = await Trip.countDocuments({
                                ownerPhone: trip.ownerPhone,
                                cashbackProcessed: true,
                                _id: { $ne: trip._id }, // Exclude current trip
                            });

                            if (previousProcessedTrips === 0) {
                                // First completed trip — award referrer their bonus
                                const referralBonus = Math.min(
                                    REFERRAL_BONUS_REFERRER,
                                    trip.payment?.totalAmount
                                        ? Math.round(trip.payment.totalAmount * 0.02)
                                        : REFERRAL_BONUS_REFERRER
                                );

                                const bonusToAward = Math.min(referralBonus, REFERRAL_BONUS_REFERRER);

                                await User.findByIdAndUpdate(
                                    updatedUser.referredBy,
                                    {
                                        $inc: {
                                            cashbackAmount: bonusToAward,
                                            referralBonusEarned: bonusToAward,
                                            referralCount: 1,
                                        },
                                    }
                                );

                                // First completed trip — award referee (this user) their referral bonus
                                if (!updatedUser.referralBonusReceived) {
                                    await User.findByIdAndUpdate(
                                        updatedUser._id,
                                        {
                                            $inc: { cashbackAmount: REFERRAL_BONUS_REFEREE },
                                            $set: { referralBonusReceived: true },
                                        }
                                    );
                                }
                            }
                        } catch (refError) {
                            errors.push(`Referral bonus error for trip ${trip.number}: ${refError}`);
                        }
                    }
                } else {
                    // SECURITY: Redact PII — don't include phone numbers in error responses
                    errors.push(`User not found for trip ${trip.number}`);
                }
            } catch (error) {
                // SECURITY: Redact internal error details
                errors.push(`Error processing trip ${trip.number}`);
            }
        }

        return NextResponse.json({
            message: "Cashback processing completed",
            processedCount,
            errors: errors.length > 0 ? errors : undefined,
        }, { status: 200 });
    } catch (error) {
        console.error("Cashback processing error:", error);
        return NextResponse.json({ message: "Error processing cashback" }, { status: 500 });
    }
}

// GET endpoint to check status (can be used for monitoring)
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // SECURITY: Fail closed - if no secret is configured, deny access
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const pendingCount = await Trip.countDocuments({
            cashbackProcessed: { $ne: true },
            cashbackAmount: { $gt: 0 },
        });

        const processedCount = await Trip.countDocuments({
            cashbackProcessed: true,
        });

        return NextResponse.json({
            pending: pendingCount,
            processed: processedCount,
        }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error fetching status" }, { status: 500 });
    }
}
