import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from './client';

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(userId: string, email: string, name?: string) {
	const customer = await stripe.customers.create({
		email,
		name: name || undefined,
		metadata: {
			userId,
		},
	});

	// Update user with Stripe customer ID
	const supabase = createServiceClient();
	await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', userId);

	return customer;
}

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
	userId: string,
	email: string,
	name?: string
): Promise<string> {
	const supabase = createServiceClient();

	// Check if user already has a Stripe customer ID
	const { data: user } = await supabase
		.from('users')
		.select('stripe_customer_id')
		.eq('id', userId)
		.single();

	if (user?.stripe_customer_id) {
		return user.stripe_customer_id;
	}

	// Create new customer
	const customer = await createStripeCustomer(userId, email, name);
	return customer.id;
}

/**
 * Create a Stripe checkout session for Pro subscription
 */
export async function createCheckoutSession(userId: string, email: string, name?: string) {
	const customerId = await getOrCreateStripeCustomer(userId, email, name);

	const session = await stripe.checkout.sessions.create({
		customer: customerId,
		mode: 'subscription',
		payment_method_types: ['card'],
		line_items: [
			{
				price: process.env.STRIPE_PRICE_ID_PRO,
				quantity: 1,
			},
		],
		success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
		metadata: {
			userId,
		},
	});

	return session;
}

/**
 * Create a Stripe billing portal session
 */
export async function createPortalSession(customerId: string) {
	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
	});

	return session;
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string) {
	const supabase = createServiceClient();

	const { data: user } = await supabase
		.from('users')
		.select('subscription_tier, subscription_status')
		.eq('id', userId)
		.single();

	if (!user) {
		return null;
	}

	return {
		tier: user.subscription_tier,
		status: user.subscription_status,
	};
}

/**
 * Update user subscription in database
 */
export async function updateUserSubscription(userId: string, tier: 'free' | 'pro', status: string) {
	const supabase = createServiceClient();

	await supabase
		.from('users')
		.update({
			subscription_tier: tier,
			subscription_status: status,
		})
		.eq('id', userId);
}
