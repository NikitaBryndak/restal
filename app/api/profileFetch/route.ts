import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
            .select("name email phoneNumber createdAt cashbackAmount privelegeLevel");

        if (!user) {
            return NextResponse.json({
                message: "User not found",
                user: null
            }, {
                status: 404
            });

        }

        return NextResponse.json({
            userName: user.name,
            userEmail: user.email,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
            cashbackAmount: user.cashbackAmount,
            privelegeLevel: user.privelegeLevel
        }, {
            status: 200
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            message: "Error fetching user profile",
            error: message
        }, {
            status: 500
        });
    }
}
