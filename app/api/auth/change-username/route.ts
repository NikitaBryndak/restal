import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 100;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.phoneNumber) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const body = await request.json();
        const { newUsername } = body;

        // Input validation
        if (!newUsername) {
            return NextResponse.json({
                message: "New username is required"
            }, { status: 400 });
        }

        const sanitizedUsername = newUsername.trim();

        if (sanitizedUsername.length < MIN_USERNAME_LENGTH) {
            return NextResponse.json({
                message: `Username must be at least ${MIN_USERNAME_LENGTH} characters`
            }, { status: 400 });
        }

        if (sanitizedUsername.length > MAX_USERNAME_LENGTH) {
            return NextResponse.json({
                message: `Username must be no more than ${MAX_USERNAME_LENGTH} characters`
            }, { status: 400 });
        }

        await connectToDatabase();

        // Find user by phone number and update username
        const user = await User.findOneAndUpdate(
            { phoneNumber: session.user.phoneNumber },
            { name: sanitizedUsername },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({
                message: "User not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "Username changed successfully",
            userName: user.name
        }, { status: 200 });
    } catch (error) {
        console.error("Change username error:", error);
        return NextResponse.json({
            message: "Internal server error"
        }, { status: 500 });
    }
}
