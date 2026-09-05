import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import Review from "@/models/review";
import { logAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/config/constants";

/**
 * POST /api/reviews — leave a post-trip review.
 * Only the trip owner may review, and only after the trip is Completed or Archived.
 * Body: { tripNumber: string, rating: 1..5, text?: string (<=500) }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResult = checkRateLimit(
            "reviews",
            session.user.phoneNumber,
            RATE_LIMITS["reviews"].max,
            RATE_LIMITS["reviews"].windowMs,
        );
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const tripNumber = typeof body.tripNumber === "string" ? body.tripNumber.trim() : "";
        if (!tripNumber) {
            return NextResponse.json({ error: "Вкажіть номер подорожі" }, { status: 400 });
        }

        // Rating must be an integer 1..5
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Оцінка має бути від 1 до 5" }, { status: 400 });
        }

        // Optional comment, max 500 chars
        let text = "";
        if (body.text !== undefined && body.text !== null) {
            if (typeof body.text !== "string") {
                return NextResponse.json({ error: "Коментар має бути текстом" }, { status: 400 });
            }
            text = body.text.trim();
            if (text.length > 500) {
                return NextResponse.json({ error: "Коментар не може перевищувати 500 символів" }, { status: 400 });
            }
        }

        await connectToDatabase();

        const trip = (await Trip.findOne({ number: tripNumber }).lean()) as any;
        if (!trip) {
            return NextResponse.json({ error: "Подорож не знайдена" }, { status: 404 });
        }

        // Only the trip owner can review their trip
        if (trip.ownerPhone !== session.user.phoneNumber) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Reviews are only allowed after the trip has ended
        const reviewableStatuses = ["Completed", "Archived"];
        if (!reviewableStatuses.includes(trip.status)) {
            return NextResponse.json({ error: "Відгуки можна залишати лише після завершення подорожі" }, { status: 400 });
        }

        // One review per user per trip (unique index is the backstop)
        const existing = await Review.findOne({ tripId: trip._id, userPhone: session.user.phoneNumber }).lean();
        if (existing) {
            return NextResponse.json({ error: "Ви вже залишили відгук на цю подорож" }, { status: 409 });
        }

        const created = await Review.create({
            tripId: trip._id,
            tripNumber: trip.number,
            userPhone: session.user.phoneNumber,
            userName: (session.user.name as string) || "",
            rating,
            text,
        });

        logAudit({
            action: "review.created",
            entityType: "review",
            entityId: String(created._id),
            userId: session.user.phoneNumber,
            details: { tripNumber: trip.number, rating },
        });

        return NextResponse.json({ message: "Дякуємо за ваш відгук!", reviewId: created._id }, { status: 201 });
    } catch (err) {
        console.error("POST /api/reviews error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
