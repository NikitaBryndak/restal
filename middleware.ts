import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { ACCESS_GROUPS, findPageForPath } from "./config/access"

export default withAuth(
    function middleware(req) {
        const url = req.nextUrl.pathname;
        const allowedPages = (req.nextauth.token?.allowedPages as string[] | undefined) ?? [];

        // Only catalog pages are gated here. Paths outside the catalog
        // (/dashboard root, trip detail pages, ...) stay open to any
        // authenticated user — ownership is enforced by server components.
        const page = findPageForPath(url);
        if (page && !allowedPages.includes(page.slug)) {
            // Redirect to the first allowed client page, or home if none.
            let fallback = "/";
            for (const group of ACCESS_GROUPS) {
                for (const p of group.pages) {
                    if (allowedPages.includes(p.slug)) {
                        fallback = p.paths[0];
                        break;
                    }
                }
                if (fallback !== "/") break;
            }
            return NextResponse.redirect(new URL(fallback, req.url));
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
