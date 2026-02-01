import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import Notification from "@/models/notification";
import { MANAGER_PRIVILEGE_LEVEL, SUPER_ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { DOCUMENT_LABELS, TOUR_STATUS_LABELS, TourStatus } from "@/types";
import mongoose from "mongoose";

const buildQuery = (rawId: string) => {
    // Strip leading # if present (e.g., "Trip #5468189" -> "5468189")
    let identifier = rawId.trim().replace(/^#/, '');

    // Check if it looks like a trip number (purely numeric string)
    if (/^\d+$/.test(identifier)) {
        return { number: identifier };
    }

    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        return { _id: identifier };
    }

    // Fallback: try as trip number anyway
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
             return NextResponse.json({ message: `Forbidden: Insufficient privileges (Level ${session.user.privilegeLevel ?? 0}). Required: ${MANAGER_PRIVILEGE_LEVEL}` }, { status: 403 });
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
        const isSuperAdmin = userPrivilegeLevel >= SUPER_ADMIN_PRIVILEGE_LEVEL;
        const isOwnerOrManager = trip.ownerPhone === userPhone || trip.managerPhone === userPhone;

        // Super admins (level 4+) can access any trip, others need ownership/manager access
        if (!isSuperAdmin && !isOwnerOrManager) {
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
        const isSuperAdmin = userPrivilegeLevel >= SUPER_ADMIN_PRIVILEGE_LEVEL;
        const isOwnerOrManager = existingTrip.ownerPhone === userPhone || existingTrip.managerPhone === userPhone;

        // Super admins (level 4+) can modify any trip, others need ownership/manager access
        if (!isSuperAdmin && !isOwnerOrManager) {
            return NextResponse.json({ message: "Forbidden: You don't have access to modify this trip." }, { status: 403 });
        }

        // Remove immutable fields but allow number to be updated, update managerPhone to current manager
        const { _id, createdAt, updatedAt, managerName, ...rest } = updates ?? {};

        // Get current manager's name
        const currentManager = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as any;

        const payload = {
            ...rest,
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

        return NextResponse.json({ trip: updatedTrip }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to update trip" }, { status: 500 });
    }
}
