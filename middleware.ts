import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { canAccessPath } from "./config/access"

export default withAuth(
    function middleware(req) {
        const url = req.nextUrl.pathname;
        const userLevel = req.nextauth.token?.privilegeLevel as number || 1;

        if (!canAccessPath(url, userLevel)) {
            // Redirect unauthorized users to dashboard home
            return NextResponse.redirect(new URL('/dashboard/profile', req.url));
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                return !!token
            }
        },
        pages: {
            signIn: '/login'
        }
    }
)

export const config = {
    matcher: ["/dashboard/:path*", "/api/analytics/:path*", "/cashback"],
}