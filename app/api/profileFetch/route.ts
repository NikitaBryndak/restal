import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoleBySlug } from "@/lib/role-cache";
import { allowedPagesForRole } from "@/lib/role-eval";
import { UNAMBIGUOUS_CHARS } from "@/config/constants";
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({
                message: "Unauthorized",
                user: null
            }, {
                status: 401
            });
        }

        await connectToDatabase();

        const user = await User.findOne({ phoneNumber: session.user.phoneNumber })
            .select("name email phoneNumber createdAt cashbackAmount role referralCode referralCount referralBonusEarned notifyEmail notifySms notifyTelegram telegramChatId telegramBindCode telegramBindCodeExpiresAt");

        if (!user) {
            return NextResponse.json({
                message: "User not found",
                user: null
            }, {
                status: 404
            });

        }
        // Telegram binding: while opted-in but unbound, keep a fresh one-time code for the site prompt.
        let telegramBindCode: string | null = null;
        if ((user.notifyTelegram ?? false) && !user.telegramChatId) {
            const now = Date.now();
            const expired = !user.telegramBindCodeExpiresAt || user.telegramBindCodeExpiresAt.getTime() < now;
            if (!user.telegramBindCode || expired) {
                telegramBindCode = generateBindCode();
                await User.updateOne(
                    { _id: user._id },
                    { $set: { telegramBindCode, telegramBindCodeExpiresAt: new Date(now + 15 * 60_000) } }
                );
            } else {
                telegramBindCode = user.telegramBindCode;
            }
        }

        return NextResponse.json({
            userName: user.name,
            userEmail: user.email,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
            cashbackAmount: user.cashbackAmount,
            role: user.role ?? "client",
            allowedPages: allowedPagesForRole(await getRoleBySlug(user.role)),
            referralCode: user.referralCode || null,
            referralCount: user.referralCount || 0,
            referralBonusEarned: user.referralBonusEarned || 0,
            notifyEmail: user.notifyEmail ?? false,
            notifySms: user.notifySms ?? false,
            notifyTelegram: user.notifyTelegram ?? false,
            telegramChatId: user.telegramChatId ?? null,
            telegramBindCode,
        }, {
            status: 200
        });

    } catch (error: unknown) {
        // Log error server-side but don't expose details to client
        console.error("Profile fetch error:", error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json({
            message: "Error fetching user profile"
        }, {
            status: 500
        });
    }
}

function generateBindCode(): string {
    const bytes = crypto.randomBytes(4);
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += UNAMBIGUOUS_CHARS[bytes[i] % UNAMBIGUOUS_CHARS.length];
    }
    return `TG-${code}`;
}
