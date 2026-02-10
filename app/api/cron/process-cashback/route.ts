import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";

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

                // Find the user and add cashback atomically
                const updatedUser = await User.findOneAndUpdate(
                    { phoneNumber: trip.ownerPhone },
                    { $inc: { cashbackAmount: (trip.cashbackAmount || 0) } },
                    { new: true }
                );

                if (updatedUser) {
                    // Mark trip as processed atomically
                    await Trip.findByIdAndUpdate(trip._id, {
                        cashbackProcessed: true,
                    });

                    processedCount++;
                } else {
                    errors.push(`User not found for trip ${trip.number}: ${trip.ownerPhone}`);
                }
            } catch (error) {
                errors.push(`Error processing trip ${trip.number}: ${error}`);
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
