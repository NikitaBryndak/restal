import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phoneNumber, email, password } = body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await connectToDatabase();
        await User.create({ name, phoneNumber, email, password: hashedPassword });

        return NextResponse.json({
            message: "User registered successfully"
        }, {
            status: 201
        });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({
            message: "Error during registration"
        }, {
            status: 500
        });
    }
}