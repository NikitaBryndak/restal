import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const { phoneNumber } = await request.json();

        const user = await User.findOne({ phoneNumber }).select("_id");

        return NextResponse.json({
            exists: !!user,
            message: user ? "User exists" : "User not found"
        }, {
            status: 200
        });

    } catch (error: any) {
        console.error("Error checking user existence:", error);
        return NextResponse.json({
            message: "Error checking user existence",
            exists: false
        }, {
            status: 500
        });
    }
}