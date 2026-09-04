import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PromoCode from "@/models/promoCode";
import { getSessionRole, hasAnyScope } from "@/lib/role-access";

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

        // Check access to the promo codes page (previously manager level)
        const role = await getSessionRole(session);
        if (!hasAnyScope(role, ["promo-codes"])) {
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
