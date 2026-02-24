import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import ContactRequest from "@/models/contactRequest";
import User from "@/models/user";
import mongoose from "mongoose";
import { MANAGER_PRIVILEGE_LEVEL } from "@/config/constants";
import { sendContactRequestNotification } from "@/lib/email";

// Rate limit: max 5 requests per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return request.headers.get("x-real-ip") || "unknown";
}

// POST - Create a new contact request (public, rate-limited)
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const body = await request.json();

        const { source, firstName, lastName, phone, message, managerName } = body;

        // Validate required fields
        if (!source || !phone) {
            return NextResponse.json(
                { message: "Телефон є обов'язковим полем" },
                { status: 400 }
            );
        }

        if (!["contact", "manager", "tour"].includes(source)) {
            return NextResponse.json(
                { message: "Невірне джерело запиту" },
                { status: 400 }
            );
        }

        // Basic phone validation
        const phoneClean = phone.replace(/[\s()-]/g, "");
        if (phoneClean.length < 10 || phoneClean.length > 15) {
            return NextResponse.json(
                { message: "Невірний формат номера телефону" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Rate limiting check
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
        const recentRequests = await ContactRequest.countDocuments({
            ip,
            createdAt: { $gte: windowStart },
        });

        if (recentRequests >= RATE_LIMIT_MAX) {
            return NextResponse.json(
                { message: "Забагато запитів. Спробуйте через годину." },
                { status: 429 }
            );
        }

        // Create contact request with sanitized inputs
        const sanitizedData = {
            source,
            firstName: firstName?.trim().slice(0, 100) || "",
            lastName: lastName?.trim().slice(0, 100) || "",
            phone: phoneClean,
            message: message?.trim().slice(0, 2000) || "",
            managerName: managerName?.trim().slice(0, 100) || "",
        };

        const contactRequest = await ContactRequest.create({
            ...sanitizedData,
            ip,
        });

        // Send email notification (await so Vercel doesn't kill the function early)
        try {
            await sendContactRequestNotification(sanitizedData);
        } catch (err) {
            console.error("Failed to send contact request email:", err);
        }

        return NextResponse.json(
            { message: "Запит успішно надіслано", id: contactRequest._id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Contact request error:", error);
        return NextResponse.json(
            { message: "Помилка сервера" },
            { status: 500 }
        );
    }
}

// GET - Fetch all contact requests (admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
        }

        await connectToDatabase();

        // Check admin privileges
        const user = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as { privilegeLevel?: number } | null;
        if (!user || (user.privilegeLevel ?? 1) < MANAGER_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Недостатньо прав" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        // SECURITY: Bound limit to prevent memory exhaustion (max 100)
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

        const filter: Record<string, unknown> = {};
        if (status && status !== "all") {
            filter.status = status;
        }

        const [requests, total] = await Promise.all([
            ContactRequest.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ContactRequest.countDocuments(filter),
        ]);

        // Also get counts per status
        const [newCount, inProgressCount, completedCount, dismissedCount] = await Promise.all([
            ContactRequest.countDocuments({ status: "new" }),
            ContactRequest.countDocuments({ status: "in_progress" }),
            ContactRequest.countDocuments({ status: "completed" }),
            ContactRequest.countDocuments({ status: "dismissed" }),
        ]);

        return NextResponse.json({
            requests,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            counts: {
                new: newCount,
                in_progress: inProgressCount,
                completed: completedCount,
                dismissed: dismissedCount,
            },
        });
    } catch (error) {
        console.error("Fetch contact requests error:", error);
        return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
}

// PUT - Update contact request status (admin only)
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as { privilegeLevel?: number } | null;
        if (!user || (user.privilegeLevel ?? 1) < MANAGER_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Недостатньо прав" }, { status: 403 });
        }

        const { id, status, adminNote } = await request.json();

        // SECURITY: Validate ObjectId format to prevent injection/crashes
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Невірний ID запиту" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (status && ["new", "in_progress", "completed", "dismissed"].includes(status)) {
            updateData.status = status;
        }
        if (typeof adminNote === "string") {
            updateData.adminNote = adminNote.slice(0, 1000);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "Немає даних для оновлення" }, { status: 400 });
        }

        const updated = await ContactRequest.findByIdAndUpdate(id, updateData, { new: true }).lean();

        if (!updated) {
            return NextResponse.json({ message: "Запит не знайдено" }, { status: 404 });
        }

        return NextResponse.json({ message: "Оновлено", request: updated });
    } catch (error) {
        console.error("Update contact request error:", error);
        return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
}
