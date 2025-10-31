import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/subscription';
import { createServerClient } from '@/lib/supabase/server';

export async function POST() {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user data from Supabase
		const supabase = await createServerClient();
		const { data: user, error } = await supabase
			.from('users')
			.select('*')
			.eq('clerk_id', userId)
			.single();

		if (error || !user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check if user already has Pro subscription
		if (user.subscription_tier === 'pro' && user.subscription_status === 'active') {
			return NextResponse.json({ error: 'Already subscribed to Pro' }, { status: 400 });
		}

		// Create checkout session
		const session = await createCheckoutSession(user.id, user.email, user.name || undefined);

		return NextResponse.json({
			sessionId: session.id,
			url: session.url,
		});
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
