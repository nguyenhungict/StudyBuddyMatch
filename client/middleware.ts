import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if accessing admin routes (except signin)
    if (pathname.startsWith('/admin') && pathname !== '/admin/signin') {
        // Check if user has access token
        const accessToken = request.cookies.get('accessToken')

        if (!accessToken) {
            // Not logged in -> redirect to admin signin
            return NextResponse.redirect(new URL('/admin/signin', request.url))
        }

        // Note: For now, we're allowing any logged-in user to access admin routes
        // In production, you should verify the user's role from the token or make an API call
        // to check if the user is actually an admin

        // TODO: Add proper role checking here
        // Example: Decode JWT token and check if user.role === 'ADMIN'
        // or check if user.email === 'admin@studybuddy.com'
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
    ],
}
