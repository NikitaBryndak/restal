import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Credential } from "@/types";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRoleBySlug } from "./role-cache";
import { allowedPagesForRole } from "./role-eval";

interface MongoUser {
    _id: { toString: () => string };
    password: string;
    phoneNumber: string;
    role?: string;
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials) {
                try {
                    const { phoneNumber, password } = credentials as Credential;

                    // SECURITY: Rate limit login attempts per phone number
                    const rateLimitResult = checkRateLimit("login", phoneNumber, 10, 15 * 60 * 1000);
                    if (!rateLimitResult.allowed) {
                        throw new Error("Забагато спроб входу. Спробуйте через 15 хвилин.");
                    }

                    await connectToDatabase();
                    const user = await User.findOne({ phoneNumber }).lean() as MongoUser | null;

                    if (!user) {
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(password, user.password);

                    if (!passwordMatch) {
                        return null;
                    }

                    const role = user.role ?? "client";

                    return {
                        id: user._id.toString(),
                        phoneNumber: user.phoneNumber,
                        role,
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
                token.role = (user as { role?: string }).role;
                token.phoneNumber = user.phoneNumber;
            }

            // SECURITY: Re-fetch the user's role from DB on every token refresh
            // so role/permission changes propagate to live sessions promptly,
            // not after 24h JWT expiry.
            if (token.phoneNumber) {
                try {
                    await connectToDatabase();
                    const dbUser = await User.findOne(
                        { phoneNumber: token.phoneNumber },
                        { role: 1 }
                    ).lean() as { role?: string } | null;

                    if (dbUser?.role) {
                        token.role = dbUser.role;
                        const roleDoc = await getRoleBySlug(dbUser.role);
                        token.allowedPages = allowedPagesForRole(roleDoc);
                    } else {
                        // User deleted or missing role — fall back to the least-privileged role.
                        token.role = "client";
                        const clientRole = await getRoleBySlug("client");
                        token.allowedPages = allowedPagesForRole(clientRole);
                    }
                } catch {
                    // If DB lookup fails, keep the existing token data
                    // to avoid locking users out on transient errors
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.allowedPages = token.allowedPages;
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
