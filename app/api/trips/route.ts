import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CASHBACK_RATE } from '@/config/constants';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated", trips: [] }, { status: 401 });
        }

        await connectToDatabase();

        const userPhone = session.user.phoneNumber;
        const trips = await Trip.find({
            $or: [
                { ownerPhone: userPhone },
                { managerPhone: userPhone }
            ]
        }).sort({ createdAt: -1 }).lean();

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

        const cashbackAmount = body.payment.totalAmount * CASHBACK_RATE;

        const payload = {
            ...body,
            managerPhone: session.user.phoneNumber,
        };

        const newTrip = new Trip({
            ...payload,
        });
        await newTrip.save();

        // Update user's cashback directly
        const user = await User.findOne({ phoneNumber: body.ownerPhone });
        if (user) {
            user.cashbackAmount = (user.cashbackAmount || 0) + cashbackAmount;
            await user.save();
        }

        return NextResponse.json({ trip: newTrip }, { status: 201 });
    } catch {
        return NextResponse.json({ message: "Error creating trip" }, { status: 500 });
    }
}
