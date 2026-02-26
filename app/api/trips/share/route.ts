import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import crypto from "crypto";

// POST - Generate a share token for a trip
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tripId } = await request.json();
        if (!tripId) {
            return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
        }

        await connectToDatabase();

        const query = !isNaN(Number(tripId)) ? { number: Number(tripId) } : { _id: tripId };
        const trip = await TripModel.findOne(query);

        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        // Only owner, manager, or admin can share
        const userPhone = session.user.phoneNumber;
        const isOwner = trip.ownerPhone === userPhone;
        const isManager = trip.managerPhone === userPhone;
        const hasAdminAccess = (session.user.privilegeLevel || 1) >= ADMIN_PRIVILEGE_LEVEL;

        if (!isOwner && !isManager && !hasAdminAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // If already has a token, return it
        if (trip.shareToken) {
            return NextResponse.json({ token: trip.shareToken });
        }

        // Generate new token
        const token = crypto.randomBytes(16).toString("hex");
        trip.shareToken = token;
        await trip.save();

        return NextResponse.json({ token });
    } catch (error) {
        console.error("Error generating share token:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Revoke a share token
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tripId } = await request.json();
        if (!tripId) {
            return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
        }

        await connectToDatabase();

        const query = !isNaN(Number(tripId)) ? { number: Number(tripId) } : { _id: tripId };
        const trip = await TripModel.findOne(query);

        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        const userPhone = session.user.phoneNumber;
        const isOwner = trip.ownerPhone === userPhone;
        const isManager = trip.managerPhone === userPhone;
        const hasAdminAccess = (session.user.privilegeLevel || 1) >= ADMIN_PRIVILEGE_LEVEL;

        if (!isOwner && !isManager && !hasAdminAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        trip.shareToken = "";
        await trip.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error revoking share token:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
