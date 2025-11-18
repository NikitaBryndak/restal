import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";

const ADMIN_PRIVILEGE_LEVEL = 2;

const buildQuery = (rawId: string) => {
    const identifier = rawId.trim();
    const numericId = Number(identifier);
    if (!Number.isNaN(numericId) && identifier.trim() !== "") {
        return { number: numericId };
    }
    return { _id: identifier };
};

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.email || (session.user.privelegeLevel ?? 0) < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await context.params;
        const trip = await Trip.findOne(buildQuery(id)).lean();

        if (!trip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        return NextResponse.json({ trip }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching trip for manager:", error);
        return NextResponse.json({ message: "Unable to fetch trip", error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.email || (session.user.privelegeLevel ?? 0) < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const updates = await request.json();

        await connectToDatabase();

    const { id } = await context.params;
    const query = buildQuery(id);

        // Attach manager metadata and remove immutable fields.
        const { _id, createdAt, updatedAt, number, ...rest } = updates ?? {};
        const payload = {
            ...rest,
            managerEmail: session.user.email,
        };

        const updatedTrip = await Trip.findOneAndUpdate(query, payload, { new: true, runValidators: true });

        if (!updatedTrip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        return NextResponse.json({ trip: updatedTrip }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating trip for manager:", error);
        return NextResponse.json({ message: "Unable to update trip", error: error.message }, { status: 500 });
    }
}
