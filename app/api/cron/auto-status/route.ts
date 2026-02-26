import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { createNotification } from "@/lib/notifications";
import { sendTripStatusEmail, sendTripReminderEmail } from "@/lib/email";
import User from "@/models/user";
import { TOUR_STATUS_LABELS } from "@/types";

// Helper to parse DD/MM/YYYY date format
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

/**
 * Automated status transitions cron job.
 * Should be called daily (e.g., via Vercel Cron or external scheduler).
 *
 * Transitions:
 *  - "Paid" → "In Progress"   when tripStartDate ≤ today
 *  - "In Progress" → "Completed"  when tripEndDate < today
 *  - "Completed" → "Archived"  when tripEndDate + 90 days < today
 *
 * Also sends proactive notifications:
 *  - Payment deadline approaching (3 days before)
 *  - Trip starts tomorrow
 */
export async function POST(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = {
            paidToInProgress: 0,
            inProgressToCompleted: 0,
            completedToArchived: 0,
            paymentReminders: 0,
            departureReminders: 0,
            errors: [] as string[],
        };

        // ── 1. Paid → In Progress (trip has started) ────────────────────
        const paidTrips = await Trip.find({ status: "Paid" }).lean();
        for (const trip of paidTrips) {
            try {
                const startDate = parseDate(trip.tripStartDate);
                if (!startDate) continue;
                startDate.setHours(0, 0, 0, 0);

                if (startDate <= today) {
                    const updated = await Trip.findOneAndUpdate(
                        { _id: trip._id, status: "Paid" },
                        { $set: { status: "In Progress" } },
                        { new: true }
                    );
                    if (updated) {
                        results.paidToInProgress++;
                        // Notify user
                        await createNotification({
                            userPhone: trip.ownerPhone,
                            tripId: String(trip._id),
                            tripNumber: trip.number,
                            type: "status_change",
                            message: `Ваша подорож ${trip.number} (${trip.country}) розпочалась! Статус змінено на "${TOUR_STATUS_LABELS["In Progress"]}". Гарного відпочинку! 🌴`,
                            data: { oldStatus: "Paid", newStatus: "In Progress" },
                        });
                        // Send email notification
                        await sendStatusChangeEmail(trip, "Paid", "In Progress");
                    }
                }
            } catch (err) {
                results.errors.push(`Paid→InProgress error for trip ${trip.number}`);
            }
        }

        // ── 2. In Progress → Completed (trip has ended) ─────────────────
        const inProgressTrips = await Trip.find({ status: "In Progress" }).lean();
        for (const trip of inProgressTrips) {
            try {
                const endDate = parseDate(trip.tripEndDate);
                if (!endDate) continue;
                endDate.setHours(0, 0, 0, 0);

                if (endDate < today) {
                    const updated = await Trip.findOneAndUpdate(
                        { _id: trip._id, status: "In Progress" },
                        { $set: { status: "Completed" } },
                        { new: true }
                    );
                    if (updated) {
                        results.inProgressToCompleted++;
                        await createNotification({
                            userPhone: trip.ownerPhone,
                            tripId: String(trip._id),
                            tripNumber: trip.number,
                            type: "status_change",
                            message: `Подорож ${trip.number} (${trip.country}) завершена! Статус змінено на "${TOUR_STATUS_LABELS["Completed"]}". Дякуємо, що обрали RestAL! ✨`,
                            data: { oldStatus: "In Progress", newStatus: "Completed" },
                        });
                        await sendStatusChangeEmail(trip, "In Progress", "Completed");
                    }
                }
            } catch (err) {
                results.errors.push(`InProgress→Completed error for trip ${trip.number}`);
            }
        }

        // ── 3. Completed → Archived (90 days after trip ended) ──────────
        const completedTrips = await Trip.find({ status: "Completed" }).lean();
        for (const trip of completedTrips) {
            try {
                const endDate = parseDate(trip.tripEndDate);
                if (!endDate) continue;

                const archiveDate = new Date(endDate);
                archiveDate.setDate(archiveDate.getDate() + 90);
                archiveDate.setHours(0, 0, 0, 0);

                if (archiveDate <= today) {
                    const updated = await Trip.findOneAndUpdate(
                        { _id: trip._id, status: "Completed" },
                        { $set: { status: "Archived" } },
                        { new: true }
                    );
                    if (updated) {
                        results.completedToArchived++;
                        await createNotification({
                            userPhone: trip.ownerPhone,
                            tripId: String(trip._id),
                            tripNumber: trip.number,
                            type: "status_change",
                            message: `Подорож ${trip.number} (${trip.country}) переміщена в архів.`,
                            data: { oldStatus: "Completed", newStatus: "Archived" },
                        });
                    }
                }
            } catch (err) {
                results.errors.push(`Completed→Archived error for trip ${trip.number}`);
            }
        }

        // ── 4. Payment deadline reminders (3 days before) ───────────────
        const unpaidTrips = await Trip.find({
            status: { $in: ["In Booking", "Booked"] },
            "payment.deadline": { $ne: "" },
            "payment.paidAmount": { $lt: 1 }, // Not yet paid (or partially)
        }).lean();

        for (const trip of unpaidTrips) {
            try {
                const deadline = parseDate(trip.payment?.deadline);
                if (!deadline) continue;
                deadline.setHours(0, 0, 0, 0);

                const reminderDate = new Date(deadline);
                reminderDate.setDate(reminderDate.getDate() - 3);
                reminderDate.setHours(0, 0, 0, 0);

                // Send reminder exactly 3 days before deadline
                if (today.getTime() === reminderDate.getTime()) {
                    await createNotification({
                        userPhone: trip.ownerPhone,
                        tripId: String(trip._id),
                        tripNumber: trip.number,
                        type: "status_change",
                        message: `⚠️ Нагадування: термін оплати за подорож ${trip.number} (${trip.country}) спливає через 3 дні (${trip.payment.deadline}). Будь ласка, здійсніть оплату вчасно.`,
                        data: { type: "payment_reminder", deadline: trip.payment.deadline },
                    });
                    await sendPaymentReminderEmail(trip);
                    results.paymentReminders++;
                }
            } catch (err) {
                results.errors.push(`Payment reminder error for trip ${trip.number}`);
            }
        }

        // ── 5. Departure tomorrow reminders ─────────────────────────────
        const upcomingTrips = await Trip.find({
            status: { $in: ["Paid", "Booked"] },
        }).lean();

        for (const trip of upcomingTrips) {
            try {
                const startDate = parseDate(trip.tripStartDate);
                if (!startDate) continue;
                startDate.setHours(0, 0, 0, 0);

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (startDate.getTime() === tomorrow.getTime()) {
                    await createNotification({
                        userPhone: trip.ownerPhone,
                        tripId: String(trip._id),
                        tripNumber: trip.number,
                        type: "status_change",
                        message: `✈️ Завтра ваша подорож! ${trip.country}, рейс ${trip.flightInfo?.departure?.flightNumber || ''} о ${trip.flightInfo?.departure?.time || ''}. Перевірте документи та не забудьте валізу!`,
                        data: { type: "departure_reminder" },
                    });
                    await sendDepartureReminderEmail(trip);
                    results.departureReminders++;
                }
            } catch (err) {
                results.errors.push(`Departure reminder error for trip ${trip.number}`);
            }
        }

        return NextResponse.json({
            message: "Auto-status processing completed",
            ...results,
            errors: results.errors.length > 0 ? results.errors : undefined,
        }, { status: 200 });
    } catch (error) {
        console.error("Auto-status processing error:", error);
        return NextResponse.json({ message: "Error processing auto-status" }, { status: 500 });
    }
}

/* ── Email helpers (fail silently — don't block cron) ──────────────── */

async function sendStatusChangeEmail(
    trip: Record<string, any>,
    oldStatus: string,
    newStatus: string
) {
    try {
        const user = await User.findOne({ phoneNumber: trip.ownerPhone }).lean() as { name?: string; email?: string } | null;
        if (!user?.email) return;
        await sendTripStatusEmail({
            to: user.email,
            userName: user.name || "Шановний клієнт",
            tripNumber: trip.number,
            country: trip.country,
            oldStatus: TOUR_STATUS_LABELS[oldStatus as keyof typeof TOUR_STATUS_LABELS] || oldStatus,
            newStatus: TOUR_STATUS_LABELS[newStatus as keyof typeof TOUR_STATUS_LABELS] || newStatus,
        });
    } catch {
        // Email failures are non-critical — don't break the cron
    }
}

async function sendPaymentReminderEmail(trip: Record<string, any>) {
    try {
        const user = await User.findOne({ phoneNumber: trip.ownerPhone }).lean() as { name?: string; email?: string } | null;
        if (!user?.email) return;
        await sendTripReminderEmail({
            to: user.email,
            userName: user.name || "Шановний клієнт",
            tripNumber: trip.number,
            country: trip.country,
            reminderType: "payment",
            deadline: trip.payment?.deadline || "",
            totalAmount: trip.payment?.totalAmount || 0,
            paidAmount: trip.payment?.paidAmount || 0,
        });
    } catch {
        // Non-critical
    }
}

async function sendDepartureReminderEmail(trip: Record<string, any>) {
    try {
        const user = await User.findOne({ phoneNumber: trip.ownerPhone }).lean() as { name?: string; email?: string } | null;
        if (!user?.email) return;
        await sendTripReminderEmail({
            to: user.email,
            userName: user.name || "Шановний клієнт",
            tripNumber: trip.number,
            country: trip.country,
            reminderType: "departure",
            flightNumber: trip.flightInfo?.departure?.flightNumber || "",
            departureTime: trip.flightInfo?.departure?.time || "",
            departureDate: trip.tripStartDate,
            hotel: trip.hotel?.name || "",
        });
    } catch {
        // Non-critical
    }
}

// GET endpoint for monitoring
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const counts = {
            paid: await Trip.countDocuments({ status: "Paid" }),
            inProgress: await Trip.countDocuments({ status: "In Progress" }),
            completed: await Trip.countDocuments({ status: "Completed" }),
        };

        return NextResponse.json({ pendingTransitions: counts }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
