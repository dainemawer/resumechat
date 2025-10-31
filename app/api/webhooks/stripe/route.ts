import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/server';

// Disable body parser to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: Request) {
	const body = await req.text();
	const headersList = await headers();
	const signature = headersList.get('stripe-signature');

	if (!signature) {
		return NextResponse.json({ error: 'No signature' }, { status: 400 });
	}

	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error('STRIPE_WEBHOOK_SECRET not set');
		return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
	}

	const supabase = createServiceClient();

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				const userId = session.metadata?.userId;

				if (!userId || !session.subscription) {
					console.error('Missing userId or subscription in session metadata');
					break;
				}

				// Get subscription details
				const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

				// Update user subscription status
				const { error: userError } = await supabase
					.from('users')
					.update({
						stripe_customer_id: session.customer as string,
						subscription_tier: 'pro',
						subscription_status: subscription.status,
					})
					.eq('id', userId);

				if (userError) {
					console.error('Error updating user subscription:', userError);
					break;
				}

				// Create subscription record
				const { error: subError } = await supabase.from('subscriptions').insert({
					user_id: userId,
					stripe_subscription_id: subscription.id,
					stripe_price_id: subscription.items.data[0].price.id,
					status: subscription.status,
					current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
					current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
				});

				if (subError) {
					console.error('Error creating subscription record:', subError);
				}

				console.log('Checkout completed for user:', userId);
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;

				// Update subscription record
				const { error: subError } = await supabase
					.from('subscriptions')
					.update({
						status: subscription.status,
						stripe_price_id: subscription.items.data[0].price.id,
						current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
						current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
					})
					.eq('stripe_subscription_id', subscription.id);

				if (subError) {
					console.error('Error updating subscription:', subError);
					break;
				}

				// Update user subscription status
				const { data: subData } = await supabase
					.from('subscriptions')
					.select('user_id')
					.eq('stripe_subscription_id', subscription.id)
					.single();

				if (subData) {
					await supabase
						.from('users')
						.update({
							subscription_tier: subscription.status === 'active' ? 'pro' : 'free',
							subscription_status: subscription.status,
						})
						.eq('id', subData.user_id);
				}

				console.log('Subscription updated:', subscription.id);
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;

				// Update subscription record
				const { error: subError } = await supabase
					.from('subscriptions')
					.update({
						status: 'canceled',
					})
					.eq('stripe_subscription_id', subscription.id);

				if (subError) {
					console.error('Error updating canceled subscription:', subError);
					break;
				}

				// Downgrade user to free tier
				const { data: subData } = await supabase
					.from('subscriptions')
					.select('user_id')
					.eq('stripe_subscription_id', subscription.id)
					.single();

				if (subData) {
					await supabase
						.from('users')
						.update({
							subscription_tier: 'free',
							subscription_status: 'canceled',
						})
						.eq('id', subData.user_id);
				}

				console.log('Subscription canceled:', subscription.id);
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;

				if (invoice.subscription) {
					// Ensure subscription is active
					const { data: subData } = await supabase
						.from('subscriptions')
						.select('user_id')
						.eq('stripe_subscription_id', invoice.subscription as string)
						.single();

					if (subData) {
						await supabase
							.from('users')
							.update({
								subscription_tier: 'pro',
								subscription_status: 'active',
							})
							.eq('id', subData.user_id);
					}
				}

				console.log('Payment succeeded for invoice:', invoice.id);
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;

				if (invoice.subscription) {
					// Mark subscription as past_due
					const { data: subData } = await supabase
						.from('subscriptions')
						.select('user_id')
						.eq('stripe_subscription_id', invoice.subscription as string)
						.single();

					if (subData) {
						await supabase
							.from('users')
							.update({
								subscription_status: 'past_due',
							})
							.eq('id', subData.user_id);
					}
				}

				console.log('Payment failed for invoice:', invoice.id);
				break;
			}

			default:
				console.log('Unhandled event type:', event.type);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
	}
}
