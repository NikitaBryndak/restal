import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PromoCode from "@/models/promoCode";
import User from "@/models/user";

// GET - Validate a promo code (manager only)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Check manager privilege (level >= 2)
        const manager = await User.findOne({ phoneNumber: session.user.phoneNumber });
        if (!manager || manager.privilegeLevel < 2) {
            return NextResponse.json(
                { message: "Доступ лише для менеджерів" },
                { status: 403 }
            );
        }

        const { code } = await params;
        const upperCode = code.toUpperCase();

        // Expire if needed
        await PromoCode.updateMany(
            { status: "active", expiresAt: { $lt: new Date() } },
            { $set: { status: "expired" } }
        );

        const promoCode = await PromoCode.findOne({ code: upperCode }).lean() as Record<string, unknown> | null;

        if (!promoCode) {
            return NextResponse.json(
                { valid: false, message: "Код не знайдено" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            valid: promoCode.status === "active",
            code: promoCode.code,
            amount: promoCode.amount,
            status: promoCode.status,
            ownerName: promoCode.ownerName,
            ownerPhone: promoCode.ownerPhone,
            createdAt: promoCode.createdAt,
            expiresAt: promoCode.expiresAt,
            usedAt: promoCode.usedAt,
        });
    } catch (error) {
        console.error("Promo code validation error:", error);
        return NextResponse.json(
            { message: "Помилка при перевірці коду" },
            { status: 500 }
        );
    }
}

// POST - Redeem / use a promo code (manager only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Check manager privilege (level >= 2)
        const manager = await User.findOne({ phoneNumber: session.user.phoneNumber });
        if (!manager || manager.privilegeLevel < 2) {
            return NextResponse.json(
                { message: "Доступ лише для менеджерів" },
                { status: 403 }
            );
        }

        const { code } = await params;
        const upperCode = code.toUpperCase();

        // Expire old codes first
        await PromoCode.updateMany(
            { status: "active", expiresAt: { $lt: new Date() } },
            { $set: { status: "expired" } }
        );

        const promoCode = await PromoCode.findOne({ code: upperCode });

        if (!promoCode) {
            return NextResponse.json(
                { message: "Код не знайдено" },
                { status: 404 }
            );
        }

        if (promoCode.status === "used") {
            return NextResponse.json(
                { message: "Цей код вже було використано" },
                { status: 400 }
            );
        }

        if (promoCode.status === "expired") {
            return NextResponse.json(
                { message: "Термін дії коду закінчився" },
                { status: 400 }
            );
        }

        // Mark as used
        promoCode.status = "used";
        promoCode.usedAt = new Date();
        promoCode.usedByManagerId = manager._id;
        promoCode.usedByManagerPhone = manager.phoneNumber;
        await promoCode.save();

        return NextResponse.json({
            message: "Код успішно використано",
            code: promoCode.code,
            amount: promoCode.amount,
            ownerName: promoCode.ownerName,
            ownerPhone: promoCode.ownerPhone,
        });
    } catch (error) {
        console.error("Promo code redeem error:", error);
        return NextResponse.json(
            { message: "Помилка при використанні коду" },
            { status: 500 }
        );
    }
}
