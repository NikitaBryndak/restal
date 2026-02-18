import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.phoneNumber) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        await connectToDatabase();

        // Get all trips for the user
        const trips = await Trip.find({ ownerPhone: session.user.phoneNumber });

        if (!trips || trips.length === 0) {
            return NextResponse.json({
                totalTrips: 0,
                topDestination: null
            }, { status: 200 });
        }

        // Count total trips
        const totalTrips = trips.length;

        // Find top destination (most booked)
        const destinationCount: Record<string, number> = {};
        trips.forEach((trip: any) => {
            const country = trip.country;
            destinationCount[country] = (destinationCount[country] || 0) + 1;
        });

        // Find the destination with the most bookings
        let topDestination = null;
        let maxCount = 0;
        for (const [country, count] of Object.entries(destinationCount)) {
            if (count > maxCount) {
                maxCount = count;
                topDestination = country;
            }
        }

        return NextResponse.json({
            totalTrips,
            topDestination,
            topDestinationCount: maxCount
        }, { status: 200 });
    } catch (error) {
        console.error("Get user statistics error:", error);
        return NextResponse.json({
            message: "Internal server error"
        }, { status: 500 });
    }
}
