import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Credential } from "@/types";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";

interface MongoUser {
    _id: { toString: () => string };
    password: string;
    phoneNumber: string;
    privelegeLevel?: number;
    privilegeLevel?: number;
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials) {
                try {
                    await connectToDatabase();
                    const { phoneNumber, password } = credentials as Credential;
                    const user = await User.findOne({ phoneNumber }).lean() as MongoUser | null;

                    if (!user) {
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(password, user.password);

                    if (!passwordMatch) {
                        return null;
                    }

                    const level = user.privelegeLevel ?? user.privilegeLevel ?? 1;

                    return {
                        id: user._id.toString(),
                        phoneNumber: user.phoneNumber,
                        privelegeLevel: level,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.privelegeLevel = user.privelegeLevel;
                token.phoneNumber = user.phoneNumber;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.privelegeLevel = token.privelegeLevel;
                session.user.phoneNumber = token.phoneNumber;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login"
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }