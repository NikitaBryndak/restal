import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phoneNumber, email, password } = body;

        // Input validation
        if (!name || !phoneNumber || !password) {
            return NextResponse.json({
                message: "Name, phone number, and password are required"
            }, { status: 400 });
        }

        if (!PHONE_REGEX.test(phoneNumber)) {
            return NextResponse.json({
                message: "Invalid phone number format"
            }, { status: 400 });
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            }, { status: 400 });
        }

        await connectToDatabase();

        // Check for existing user
        const existingUser = await User.findOne({ phoneNumber }).select("_id");
        if (existingUser) {
            return NextResponse.json({
                message: "An account with this phone number already exists"
            }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, phoneNumber, email, password: hashedPassword });

        return NextResponse.json({
            message: "User registered successfully"
        }, {
            status: 201
        });

    } catch (error) {
        return NextResponse.json({
            message: "Error during registration"
        }, {
            status: 500
        });
    }
}