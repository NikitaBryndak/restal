import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/notification";

// GET - Fetch notifications for current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated", notifications: [] }, { status: 401 });
        }

        await connectToDatabase();

        const notifications = await Notification.find({
            userPhone: session.user.phoneNumber,
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({
            userPhone: session.user.phoneNumber,
            read: false,
        });

        return NextResponse.json({ notifications, unreadCount }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error fetching notifications" }, { status: 500 });
    }
}

// PUT - Mark notifications as read
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const { notificationIds, markAllRead } = await request.json();

        await connectToDatabase();

        if (markAllRead) {
            await Notification.updateMany(
                { userPhone: session.user.phoneNumber, read: false },
                { read: true }
            );
        } else if (notificationIds && Array.isArray(notificationIds)) {
            await Notification.updateMany(
                {
                    _id: { $in: notificationIds },
                    userPhone: session.user.phoneNumber
                },
                { read: true }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error updating notifications" }, { status: 500 });
    }
}
