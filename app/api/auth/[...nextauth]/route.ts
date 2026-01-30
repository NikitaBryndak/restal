import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Credential } from "@/types";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials) {
                try {
                    await connectToDatabase();
                    const { phoneNumber, password } = credentials as Credential;
                    const user = await User.findOne({ phoneNumber }).lean();

                    if (!user) {
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(password, (user as any).password);

                    if (!passwordMatch) {
                        return null;
                    }

                    // Normalize privilege level (handle potential typo in DB vs Schema)
                    const userAny = user as any;
                    const level = userAny.privelegeLevel || userAny.privilegeLevel || 1;

                    return {
                        ...userAny,
                        id: userAny._id.toString(),
                        privelegeLevel: level
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.privelegeLevel = user.privelegeLevel;
                token.phoneNumber = user.phoneNumber;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.privelegeLevel = token.privelegeLevel;
                session.user.phoneNumber = token.phoneNumber;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt" as const,
        maxAge: 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login"
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }