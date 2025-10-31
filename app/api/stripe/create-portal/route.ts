import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe/subscription';
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
			.select('stripe_customer_id')
			.eq('clerk_id', userId)
			.single();

		if (error || !user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		if (!user.stripe_customer_id) {
			return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
		}

		// Create portal session
		const session = await createPortalSession(user.stripe_customer_id);

		return NextResponse.json({
			url: session.url,
		});
	} catch (error) {
		console.error('Error creating portal session:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
