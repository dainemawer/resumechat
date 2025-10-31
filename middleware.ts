import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Define public routes that should be accessible without auth
const isPublicRoute = createRouteMatcher([
	'/',
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/u/(.*)',
	'/embed/(.*)',
	'/api/webhooks/(.*)',
	'/api/chat',
	'/pricing',
]);

export default clerkMiddleware(async (auth, req) => {
	// Allow public routes
	if (isPublicRoute(req)) {
		return NextResponse.next();
	}

	// Protect dashboard and other authenticated routes
	if (isProtectedRoute(req)) {
		await auth.protect();
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		// Always run for API routes
		'/(api|trpc)(.*)',
	],
};
