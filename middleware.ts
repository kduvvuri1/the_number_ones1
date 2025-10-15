import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

    const protectedRoute = createRouteMatcher([
    '/',
    '/upcoming',
    '/meeting(.*)',
    '/previous',
    '/recordings',
    '/personal-room',
    ]);

    import { NextResponse } from 'next/server';

    export default clerkMiddleware(async (auth, req) => {
        if (protectedRoute(req) && !(await auth()).userId) {
            const signInUrl = new URL('/sign-in', req.url);
            signInUrl.searchParams.set('redirect_url', req.url);
            return NextResponse.redirect(signInUrl);
        }
    });
    
    export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/(api|trpc)(.*)'],
    };