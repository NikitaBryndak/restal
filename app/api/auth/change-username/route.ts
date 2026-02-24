import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH } from "@/config/constants";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.phoneNumber) {
            return NextResponse.json({
                message: "Неавторизовано"
            }, { status: 401 });
        }

        const body = await request.json();
        const { newUsername } = body;

        // Input validation
        if (!newUsername) {
            return NextResponse.json({
                message: "Нове ім'я користувача обов'язкове"
            }, { status: 400 });
        }

        const sanitizedUsername = newUsername.trim();

        if (sanitizedUsername.length < MIN_USERNAME_LENGTH) {
            return NextResponse.json({
                message: `Ім'я користувача повинно містити щонайменше ${MIN_USERNAME_LENGTH} символи`
            }, { status: 400 });
        }

        if (sanitizedUsername.length > MAX_USERNAME_LENGTH) {
            return NextResponse.json({
                message: `Ім'я користувача не може перевищувати ${MAX_USERNAME_LENGTH} символів`
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
                message: "Користувача не знайдено"
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "Ім'я користувача успішно змінено",
            userName: user.name
        }, { status: 200 });
    } catch (error) {
        console.error("Change username error:", error);
        return NextResponse.json({
            message: "Внутрішня помилка сервера"
        }, { status: 500 });
    }
}
