import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CASHBACK_RATE, SUPER_ADMIN_PRIVILEGE_LEVEL, MANAGER_PRIVILEGE_LEVEL } from '@/config/constants';

// Phone number validation regex
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

// Validate required trip fields
function validateTripData(body: any): string | null {
    if (!body.number || typeof body.number !== 'string') {
        return "Trip number is required";
    }
    if (!body.country || typeof body.country !== 'string') {
        return "Country is required";
    }
    if (!body.tripStartDate || typeof body.tripStartDate !== 'string') {
        return "Trip start date is required";
    }
    if (!body.tripEndDate || typeof body.tripEndDate !== 'string') {
        return "Trip end date is required";
    }
    if (!body.ownerPhone || !PHONE_REGEX.test(body.ownerPhone.replace(/[^\d+]/g, ''))) {
        return "Valid owner phone number is required";
    }
    if (!body.payment || typeof body.payment.totalAmount !== 'number') {
        return "Payment total amount is required";
    }
    return null;
}

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

        // Check if user has manager privileges (level 2+) to create trips
        const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
        if (userPrivilegeLevel < MANAGER_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Insufficient privileges to create trips" }, { status: 403 });
        }

        const body = await request.json();

        // SECURITY: Validate required fields
        const validationError = validateTripData(body);
        if (validationError) {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        // Sanitize phone numbers
        const sanitizedOwnerPhone = body.ownerPhone.replace(/[^\d+]/g, '');

        await connectToDatabase();

        // Calculate cashback amount (will be processed one day after tour ends)
        const cashbackAmount = (body.payment?.totalAmount || 0) * CASHBACK_RATE;

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
            ownerPhone: sanitizedOwnerPhone,  // Use sanitized phone
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
