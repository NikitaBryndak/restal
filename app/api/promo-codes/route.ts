import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PromoCode from "@/models/promoCode";
import User from "@/models/user";
import crypto from "crypto";

// Generate a unique promo code string
function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    const seg1 = Array.from(crypto.randomBytes(4))
        .map((b) => chars[b % chars.length])
        .join("");
    const seg2 = Array.from(crypto.randomBytes(4))
        .map((b) => chars[b % chars.length])
        .join("");
    return `CB-${seg1}-${seg2}`;
}

// POST - Generate a new promo code
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { amount } = await request.json();
        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount < 100) {
            return NextResponse.json(
                { message: "Мінімальна сума — 100 грн" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Generate a unique code (retry on collision)
        let code = generateCode();
        let attempts = 0;
        while (await PromoCode.findOne({ code })) {
            code = generateCode();
            attempts++;
            if (attempts > 10) {
                return NextResponse.json(
                    { message: "Не вдалося згенерувати унікальний код. Спробуйте пізніше." },
                    { status: 500 }
                );
            }
        }

        // SECURITY: Use atomic operation to prevent race condition (double-spend)
        // This atomically checks balance and deducts in a single operation
        const user = await User.findOneAndUpdate(
            {
                phoneNumber: session.user.phoneNumber,
                cashbackAmount: { $gte: numericAmount }  // Only deduct if sufficient balance
            },
            { $inc: { cashbackAmount: -numericAmount } },
            { new: true }
        );

        if (!user) {
            // Either user not found or insufficient balance
            const existingUser = await User.findOne({ phoneNumber: session.user.phoneNumber });
            if (!existingUser) {
                return NextResponse.json({ message: "Користувача не знайдено" }, { status: 404 });
            }
            return NextResponse.json(
                { message: "Недостатньо коштів на бонусному рахунку" },
                { status: 400 }
            );
        }

        // Set expiry to 30 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const promoCode = await PromoCode.create({
            code,
            amount: numericAmount,
            userId: user._id,
            ownerPhone: user.phoneNumber,
            ownerName: user.name,
            status: "active",
            expiresAt,
        });

        return NextResponse.json({
            code: promoCode.code,
            amount: promoCode.amount,
            expiresAt: promoCode.expiresAt,
            status: promoCode.status,
        }, { status: 201 });

    } catch (error) {
        console.error("Promo code generation error:", error);
        return NextResponse.json(
            { message: "Помилка при генерації коду" },
            { status: 500 }
        );
    }
}

// GET - Get current user's promo code history
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Expire any active codes past their expiry date
        await PromoCode.updateMany(
            { ownerPhone: session.user.phoneNumber, status: "active", expiresAt: { $lt: new Date() } },
            { $set: { status: "expired" } }
        );

        const codes = await PromoCode.find({ ownerPhone: session.user.phoneNumber })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            codes: codes.map((c) => ({
                code: c.code,
                amount: c.amount,
                status: c.status,
                createdAt: c.createdAt,
                expiresAt: c.expiresAt,
                usedAt: c.usedAt,
            })),
        });
    } catch (error) {
        console.error("Promo code fetch error:", error);
        return NextResponse.json(
            { message: "Помилка при завантаженні кодів" },
            { status: 500 }
        );
    }
}
