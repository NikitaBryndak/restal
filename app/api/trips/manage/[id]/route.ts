import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";

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
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
             return NextResponse.json({ message: "Forbidden: No phone number in session. Please re-login." }, { status: 403 });
        }

        if ((session.user.privelegeLevel ?? 0) < ADMIN_PRIVILEGE_LEVEL) {
             return NextResponse.json({ message: `Forbidden: Insufficient privileges (Level ${session.user.privelegeLevel ?? 0}). Required: ${ADMIN_PRIVILEGE_LEVEL}` }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await context.params;
        const trip = await Trip.findOne(buildQuery(id)).lean();

        if (!trip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        return NextResponse.json({ trip }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to fetch trip" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
             return NextResponse.json({ message: "Forbidden: No phone number in session. Please re-login." }, { status: 403 });
        }

        if ((session.user.privelegeLevel ?? 0) < ADMIN_PRIVILEGE_LEVEL) {
             return NextResponse.json({ message: "Forbidden: Insufficient privileges." }, { status: 403 });
        }

        const updates = await request.json();

        await connectToDatabase();

    const { id } = await context.params;
    const query = buildQuery(id);

        // Attach manager metadata and remove immutable fields.
        const { _id, createdAt, updatedAt, number, ...rest } = updates ?? {};
        const payload = {
            ...rest,
            managerPhone: session.user.phoneNumber,
        };

        const updatedTrip = await Trip.findOneAndUpdate(query, payload, { new: true, runValidators: true });

        if (!updatedTrip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        return NextResponse.json({ trip: updatedTrip }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to update trip" }, { status: 500 });
    }
}
