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
            .select("name email phoneNumber createdAt cashbackAmount privilegeLevel");

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
            privilegeLevel: user.privilegeLevel
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
