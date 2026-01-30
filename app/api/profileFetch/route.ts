import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const phoneNumber = request.headers.get("phoneNumber");

        if (!phoneNumber) {
            return NextResponse.json({
                message: "Phone number is required",
                user: null
            }, {
                status: 400
            });
        }

        const user = await User.findOne({ phoneNumber }).select("name email phoneNumber createdAt cashbackAmount privelegeLevel");

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

    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({
            message: "Error fetching user profile",
            error: error.message
        }, {
            status: 500
        });
    }
}
