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
                    const { email, password } = credentials as Credential;
                    const user = await User.findOne({ email });
                    
                    if (!user) {
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(password, user.password);

                    if (!passwordMatch) {
                        return null;
                    }

                    return user;
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
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.privelegeLevel = token.privelegeLevel;
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