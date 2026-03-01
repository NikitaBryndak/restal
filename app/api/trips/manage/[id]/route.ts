import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import Notification from "@/models/notification";
import { MANAGER_PRIVILEGE_LEVEL, ADMIN_PRIVILEGE_LEVEL, CASHBACK_RATE } from "@/config/constants";
import { DOCUMENT_LABELS, TOUR_STATUS_LABELS, TourStatus } from "@/types";
import mongoose from "mongoose";

const buildQuery = (rawId: string) => {
    // Strip leading # if present (e.g., "Trip #5468189" -> "5468189")
    let identifier = rawId.trim().replace(/^#/, '');

    // Check if it's a valid MongoDB ObjectId (24-char hex string)
    if (mongoose.Types.ObjectId.isValid(identifier) && /^[a-f0-9]{24}$/i.test(identifier)) {
        return { _id: identifier };
    }

    // Otherwise treat as trip number (can be alphanumeric)
    return { number: identifier };
};

// Helper to create notification
async function createNotification(
    userPhone: string,
    tripId: string,
    tripNumber: string,
    type: 'document_upload' | 'status_change',
    message: string,
    data?: { documentKey?: string; oldStatus?: string; newStatus?: string }
) {
    try {
        const notification = new Notification({
            userPhone,
            tripId,
            tripNumber,
            type,
            message,
            data,
            read: false,
        });
        await notification.save();
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
             return NextResponse.json({ message: "Forbidden: No phone number in session. Please re-login." }, { status: 403 });
        }

        if ((session.user.privilegeLevel ?? 0) < MANAGER_PRIVILEGE_LEVEL) {
             return NextResponse.json({ message: "Forbidden: Insufficient privileges." }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await context.params;
        const trip = await Trip.findOne(buildQuery(id)).lean() as any;

        if (!trip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        // Check if user has access to this trip
        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privilegeLevel ?? 0;
        const isAdmin = userPrivilegeLevel >= ADMIN_PRIVILEGE_LEVEL;
        const isOwnerOrManager = trip.ownerPhone === userPhone || trip.managerPhone === userPhone;

        // Admins can access any trip, others need ownership/manager access
        if (!isAdmin && !isOwnerOrManager) {
            return NextResponse.json({ message: "Forbidden: You don't have access to this trip." }, { status: 403 });
        }

        // Get manager name from User model if managerPhone exists
        let managerName = '';
        if (trip.managerPhone) {
            const manager = await User.findOne({ phoneNumber: trip.managerPhone }).lean() as any;
            if (manager) {
                managerName = manager.name || '';
            }
        }

        return NextResponse.json({ trip: { ...trip, managerName } }, { status: 200 });
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

        if ((session.user.privilegeLevel ?? 0) < MANAGER_PRIVILEGE_LEVEL) {
             return NextResponse.json({ message: "Forbidden: Insufficient privileges." }, { status: 403 });
        }

        const updates = await request.json();

        await connectToDatabase();

        const { id } = await context.params;
        const query = buildQuery(id);

        // Get the existing trip to compare for notifications
        const existingTrip = await Trip.findOne(query).lean() as any;

        if (!existingTrip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        // Check if user has access to modify this trip
        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privilegeLevel ?? 0;
        const isAdmin = userPrivilegeLevel >= ADMIN_PRIVILEGE_LEVEL;
        const isOwnerOrManager = existingTrip.ownerPhone === userPhone || existingTrip.managerPhone === userPhone;

        // Admins can modify any trip, others need ownership/manager access
        if (!isAdmin && !isOwnerOrManager) {
            return NextResponse.json({ message: "Forbidden: You don't have access to modify this trip." }, { status: 403 });
        }

        // SECURITY: Use ALLOWLIST pattern instead of blocklist to prevent mass assignment.
        // Only these fields can be updated by managers — any new fields must be explicitly added here.
        const ALLOWED_UPDATE_FIELDS = [
            'status', 'country', 'city', 'hotel', 'roomType',
            'tripStartDate', 'tripEndDate', 'notes',
            'payment', 'flightInfo', 'documents',
            'tourists', 'description', 'boardBasis',
            'insurance', 'transfer', 'nightsCount',
        ];

        const rest: Record<string, unknown> = {};
        for (const key of ALLOWED_UPDATE_FIELDS) {
            if (key in updates && updates[key] !== undefined) {
                rest[key] = updates[key];
            }
        }

        // Recalculate cashback if total amount changes and cashback hasn't been processed
        let newCashbackAmount = undefined;
        const payment = rest.payment as { totalAmount?: number } | undefined;
        if (!existingTrip.cashbackProcessed && payment?.totalAmount) {
            newCashbackAmount = (payment.totalAmount || 0) * CASHBACK_RATE;
        }

        // Get current manager's name
        const currentManager = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as any;

        const payload: Record<string, any> = {
            ...rest,
            ...(newCashbackAmount !== undefined && { cashbackAmount: newCashbackAmount }),
            managerPhone: session.user.phoneNumber, // Update to current manager
            managerName: currentManager?.name || '',
        };

        // Auto-fill flight dates and return country based on tour dates and country
        if (payload.flightInfo) {
            if (payload.tripStartDate) {
                payload.flightInfo.departure = {
                    ...payload.flightInfo.departure,
                    date: payload.tripStartDate,
                };
            }
            if (payload.tripEndDate) {
                payload.flightInfo.arrival = {
                    ...payload.flightInfo.arrival,
                    date: payload.tripEndDate,
                };
            }
            if (payload.country) {
                payload.flightInfo.arrival = {
                    ...payload.flightInfo.arrival,
                    country: payload.country,
                };
            }
        }

        const updatedTrip = await Trip.findOneAndUpdate(query, payload, { new: true, runValidators: true });

        if (!updatedTrip) {
            return NextResponse.json({ message: "Trip not found" }, { status: 404 });
        }

        // Create notifications for status change
        if (existingTrip.status !== updates.status && updates.status) {
            const oldStatusLabel = TOUR_STATUS_LABELS[existingTrip.status as TourStatus] || existingTrip.status;
            const newStatusLabel = TOUR_STATUS_LABELS[updates.status as TourStatus] || updates.status;

            await createNotification(
                existingTrip.ownerPhone,
                existingTrip._id.toString(),
                existingTrip.number,
                'status_change',
                `Статус туру #${existingTrip.number} змінено з "${oldStatusLabel}" на "${newStatusLabel}"`,
                { oldStatus: existingTrip.status, newStatus: updates.status }
            );
        }

        // Create notifications for new document uploads
        if (updates.documents) {
            const documentKeys = Object.keys(updates.documents) as (keyof typeof DOCUMENT_LABELS)[];
            for (const key of documentKeys) {
                const existingDoc = (existingTrip.documents as any)?.[key];
                const newDoc = updates.documents[key];

                // Check if document was just uploaded (url changed and now has uploaded=true)
                if (newDoc?.uploaded && newDoc?.url && (!existingDoc?.url || existingDoc.url !== newDoc.url)) {
                    const docLabel = DOCUMENT_LABELS[key] || key;
                    await createNotification(
                        existingTrip.ownerPhone,
                        existingTrip._id.toString(),
                        existingTrip.number,
                        'document_upload',
                        `Новий документ "${docLabel}" завантажено для туру #${existingTrip.number}`,
                        { documentKey: key }
                    );
                }
            }
        }

        logAudit({
            action: existingTrip.status !== updates.status ? "trip.status_changed" : "trip.updated",
            entityType: "trip",
            entityId: existingTrip._id.toString(),
            userId: session.user.phoneNumber,
            userName: currentManager?.name || "",
            details: {
                number: existingTrip.number,
                ...(existingTrip.status !== updates.status && { oldStatus: existingTrip.status, newStatus: updates.status }),
                fields: Object.keys(rest),
            },
        });

        return NextResponse.json({ trip: updatedTrip }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to update trip" }, { status: 500 });
    }
}
