import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import PromoCode from "@/models/promoCode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { CASHBACK_RATE, ADMIN_PRIVILEGE_LEVEL, MANAGER_PRIVILEGE_LEVEL, PHONE_REGEX } from '@/config/constants';

// Validate required trip fields
function validateTripData(body: any): string | null {
    if (!body.number || typeof body.number !== 'string' || body.number.trim().length === 0) {
        return "Номер туру є обов'язковим";
    }
    if (!body.country || typeof body.country !== 'string') {
        return "Країна є обов'язковою";
    }
    if (!body.tripStartDate || typeof body.tripStartDate !== 'string') {
        return "Дата початку туру є обов'язковою";
    }
    if (!body.tripEndDate || typeof body.tripEndDate !== 'string') {
        return "Дата закінчення туру є обов'язковою";
    }
    if (!body.ownerPhone || !PHONE_REGEX.test(body.ownerPhone.replace(/[^\d+]/g, ''))) {
        return "Потрібен дійсний номер телефону власника";
    }
    if (!body.payment || typeof body.payment.totalAmount !== 'number') {
        return "Загальна сума оплати є обов'язковою";
    }
    if (!Array.isArray(body.tourists) || body.tourists.length === 0) {
        return "Потрібно додати хоча б одного подорожуючого";
    }
    // Validate each tourist has at least name and surname
    for (let i = 0; i < body.tourists.length; i++) {
        const t = body.tourists[i];
        if (!t.name || typeof t.name !== 'string' || t.name.trim().length === 0) {
            return `Ім'я подорожуючого #${i + 1} є обов'язковим`;
        }
        if (!t.surname || typeof t.surname !== 'string' || t.surname.trim().length === 0) {
            return `Прізвище подорожуючого #${i + 1} є обов'язковим`;
        }
    }
    return null;
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated", trips: [] }, { status: 401 });
        }

        await connectToDatabase();

        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
        const isAdmin = userPrivilegeLevel >= ADMIN_PRIVILEGE_LEVEL;

        // Admins can see all trips
        const query = isAdmin ? {} : {
            $or: [
                { ownerPhone: userPhone },
                { managerPhone: userPhone }
            ]
        };

        // Allow callers to request a subset of fields via ?fields=a,b,c
        // This avoids transferring large nested objects (tourists, documents) when not needed
        const url = new URL(request.url);
        const fieldsParam = url.searchParams.get('fields');

        // SECURITY: Pagination to prevent memory exhaustion on large datasets
        const DEFAULT_LIMIT = 50;
        const MAX_LIMIT = 200;
        const pageParam = Number.parseInt(url.searchParams.get('page') || '1', 10);
        const limitParam = Number.parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
        const page = Math.max(1, Number.isNaN(pageParam) ? 1 : pageParam);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isNaN(limitParam) ? DEFAULT_LIMIT : limitParam));
        const skip = (page - 1) * limit;

        // Whitelist of safe fields that can be projected
        const ALLOWED_FIELDS = new Set([
            'number', 'country', 'status', 'ownerPhone', 'managerPhone',
            'tripStartDate', 'tripEndDate', 'createdAt', 'updatedAt',
            'payment', 'payment.totalAmount', 'payment.paidAmount',
            'cashbackAmount', 'cashbackProcessed', 'cashbackRate',
            'tourists', 'documents', 'hotelName', 'notes',
        ]);

        let tripsQuery = Trip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

        if (fieldsParam) {
            const requested = fieldsParam.split(',').map(f => f.trim()).filter(f => ALLOWED_FIELDS.has(f));
            if (requested.length > 0) {
                tripsQuery = tripsQuery.select(requested.join(' '));
            }
        }

        const trips = await tripsQuery.lean();
        const totalCount = await Trip.countDocuments(query);

        return NextResponse.json({
            trips,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        }, { status: 200 });
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

        // Check if user has manager privileges (level 2+) to create trips
        const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
        if (userPrivilegeLevel < MANAGER_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Insufficient privileges to create trips" }, { status: 403 });
        }

        const body = await request.json();

        // SECURITY: Validate required fields
        const validationError = validateTripData(body);
        if (validationError) {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        // Sanitize phone numbers
        const sanitizedOwnerPhone = body.ownerPhone.replace(/[^\d+]/g, '');

        await connectToDatabase();

        // Calculate cashback amount (will be processed one day after tour ends)
        const cashbackAmount = (body.payment?.totalAmount || 0) * CASHBACK_RATE;

        // Get current manager's name
        const currentManager = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as any;

        // Handle optional promo code
        let promoCode = '';
        let promoDiscount = 0;
        if (body.promoCode && typeof body.promoCode === 'string' && body.promoCode.trim()) {
            const upperCode = body.promoCode.trim().toUpperCase();

            // Expire old codes first
            await PromoCode.updateMany(
                { status: "active", expiresAt: { $lt: new Date() } },
                { $set: { status: "expired" } }
            );

            // Atomically claim the promo code to prevent double-spend
            const claimedPromo = await PromoCode.findOneAndUpdate(
                { code: upperCode, status: "active", expiresAt: { $gte: new Date() } },
                {
                    $set: {
                        status: "used",
                        usedAt: new Date(),
                        usedByManagerId: currentManager?._id || null,
                        usedByManagerPhone: session.user.phoneNumber,
                    },
                },
                { new: true }
            );

            if (!claimedPromo) {
                // Check why it failed
                const existing = await PromoCode.findOne({ code: upperCode }).lean() as Record<string, unknown> | null;
                if (!existing) {
                    return NextResponse.json({ message: "Промокод не знайдено" }, { status: 400 });
                }
                if (existing.status === "used") {
                    return NextResponse.json({ message: "Цей промокод вже було використано" }, { status: 400 });
                }
                if (existing.status === "expired") {
                    return NextResponse.json({ message: "Термін дії промокоду закінчився" }, { status: 400 });
                }
                return NextResponse.json({ message: "Не вдалося застосувати промокод" }, { status: 400 });
            }

            promoCode = claimedPromo.code;
            promoDiscount = claimedPromo.amount;
        }

        // Auto-fill flight dates from tour dates and return country from tour country
        const flightInfo = body.flightInfo || {};
        if (body.tripStartDate) {
            flightInfo.departure = {
                ...flightInfo.departure,
                date: body.tripStartDate,
            };
        }
        if (body.tripEndDate) {
            flightInfo.arrival = {
                ...flightInfo.arrival,
                date: body.tripEndDate,
            };
        }
        if (body.country) {
            flightInfo.arrival = {
                ...flightInfo.arrival,
                country: body.country,
            };
        }

        // SECURITY: Whitelist only allowed fields to prevent mass assignment
        const finalTotalAmount = Math.max(0, (body.payment?.totalAmount || 0) - promoDiscount);
        const payload = {
            number: body.number,
            bookingDate: body.bookingDate,
            tripStartDate: body.tripStartDate,
            tripEndDate: body.tripEndDate,
            country: body.country,
            region: body.region,
            flightInfo,
            hotel: body.hotel,
            tourists: body.tourists,
            addons: body.addons,
            documents: body.documents,
            payment: {
                totalAmount: finalTotalAmount,
                paidAmount: body.payment?.paidAmount || 0,
                deadline: body.payment?.deadline || '',
            },
            ownerPhone: sanitizedOwnerPhone,
            managerPhone: session.user.phoneNumber,
            managerName: currentManager?.name || '',
            status: 'In Booking',
            promoCode,
            promoDiscount,
            cashbackAmount: cashbackAmount,
            cashbackProcessed: false,
        };

        const newTrip = new Trip(payload);
        await newTrip.save();

        // Link promo code to this trip
        if (promoCode) {
            await PromoCode.updateOne(
                { code: promoCode },
                { $set: { tripId: newTrip._id, tripNumber: newTrip.number } }
            );
        }

        logAudit({
            action: "trip.created",
            entityType: "trip",
            entityId: newTrip._id.toString(),
            userId: session.user.phoneNumber,
            userName: currentManager?.name,
            details: { number: body.number, country: body.country, ownerPhone: sanitizedOwnerPhone, ...(promoCode ? { promoCode, promoDiscount } : {}) },
        });

        // NOTE: Cashback is now added one day after the tour ends (tripEndDate)
        // This is handled by the /api/cron/process-cashback endpoint
        // which should be called daily by a cron job or scheduled task

        return NextResponse.json({ trip: newTrip }, { status: 201 });
    } catch {
        return NextResponse.json({ message: "Error creating trip" }, { status: 500 });
    }
}
