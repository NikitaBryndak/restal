import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Credential } from "@/types";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";

interface MongoUser {
    _id: { toString: () => string };
    password: string;
    phoneNumber: string;
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

                    const level = user.privilegeLevel ?? 1;

                    return {
                        id: user._id.toString(),
                        phoneNumber: user.phoneNumber,
                        privilegeLevel: level,
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
                token.privilegeLevel = user.privilegeLevel;
                token.phoneNumber = user.phoneNumber;
            }

            // SECURITY: Re-fetch privilegeLevel from DB on every token refresh
            // to ensure demoted users lose access promptly, not after 24h JWT expiry
            if (token.phoneNumber) {
                try {
                    await connectToDatabase();
                    const dbUser = await User.findOne(
                        { phoneNumber: token.phoneNumber },
                        { privilegeLevel: 1 }
                    ).lean() as { privilegeLevel?: number } | null;

                    if (dbUser) {
                        token.privilegeLevel = dbUser.privilegeLevel ?? 1;
                    }
                } catch {
                    // If DB lookup fails, keep the existing token value
                    // to avoid locking users out on transient errors
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.privilegeLevel = token.privilegeLevel;
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
    debug: process.env.NODE_ENV === "development",
    pages: {
        signIn: "/login",
        error: "/login"
    }
};
