import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CASHBACK_RATE, SUPER_ADMIN_PRIVILEGE_LEVEL } from '@/config/constants';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated", trips: [] }, { status: 401 });
        }

        await connectToDatabase();

        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
        const isSuperAdmin = userPrivilegeLevel >= SUPER_ADMIN_PRIVILEGE_LEVEL;

        // Super admins (level 4+) can see all trips
        const query = isSuperAdmin ? {} : {
            $or: [
                { ownerPhone: userPhone },
                { managerPhone: userPhone }
            ]
        };

        const trips = await Trip.find(query).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ trips }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error fetching trips" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();

        await connectToDatabase();

        // Calculate cashback amount (will be processed one day after tour ends)
        const cashbackAmount = body.payment.totalAmount * CASHBACK_RATE;

        // Get current manager's name
        const currentManager = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as any;

        // Auto-fill flight dates from tour dates and return country from tour country
        const flightInfo = body.flightInfo || {};
        if (body.tripStartDate) {
            flightInfo.departure = {
                ...flightInfo.departure,
                date: body.tripStartDate,
            };
        }
        if (body.tripEndDate) {
            flightInfo.arrival = {
                ...flightInfo.arrival,
                date: body.tripEndDate,
            };
        }
        if (body.country) {
            flightInfo.arrival = {
                ...flightInfo.arrival,
                country: body.country,
            };
        }

        const payload = {
            ...body,
            flightInfo,
            managerPhone: session.user.phoneNumber,
            managerName: currentManager?.name || '',
            status: 'In Booking',
            // Store cashback amount for later processing (one day after tour ends)
            cashbackAmount: cashbackAmount,
            cashbackProcessed: false,
        };

        const newTrip = new Trip({
            ...payload,
        });
        await newTrip.save();

        // NOTE: Cashback is now added one day after the tour ends (tripEndDate)
        // This is handled by the /api/cron/process-cashback endpoint
        // which should be called daily by a cron job or scheduled task

        return NextResponse.json({ trip: newTrip }, { status: 201 });
    } catch {
        return NextResponse.json({ message: "Error creating trip" }, { status: 500 });
    }
}
