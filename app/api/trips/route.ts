import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Not authenticated", trips: [] }, { status: 401 });
        }

        await connectToDatabase();

        const trips = await Trip.find({ ownerEmail: session.user.email }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ trips }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching trips:", error);
        return NextResponse.json({ message: "Error fetching trips", error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();

        await connectToDatabase();

        const cashbackAmount = body.payment.totalAmount * 0.01;

        const payload = {
            ...body,
            managerEmail: session.user.email,
        };

        const newTrip = new Trip({
            ...payload,
        });
        await newTrip.save();

        // Update user's cashback directly
        const user = await User.findOne({ email: body.ownerEmail });
        if (user) {
            user.cashbackAmount = (user.cashbackAmount || 0) + cashbackAmount;
            await user.save();
        }

        return NextResponse.json({ trip: newTrip }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating trip:", error);
        return NextResponse.json({ message: "Error creating trip", error: error.message }, { status: 500 });
    }
}
