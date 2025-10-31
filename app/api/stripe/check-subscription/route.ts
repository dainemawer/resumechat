import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user ID from Supabase
		const supabase = await createServerClient();
		const { data: user, error } = await supabase
			.from('users')
			.select('id, subscription_tier, subscription_status')
			.eq('clerk_id', userId)
			.single();

		if (error || !user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get subscription details
		const { data: subscription } = await supabase
			.from('subscriptions')
			.select('*')
			.eq('user_id', user.id)
			.single();

		return NextResponse.json({
			tier: user.subscription_tier,
			status: user.subscription_status,
			currentPeriodEnd: subscription?.current_period_end || null,
		});
	} catch (error) {
		console.error('Error checking subscription:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
