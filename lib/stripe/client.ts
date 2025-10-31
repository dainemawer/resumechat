import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error('STRIPE_SECRET_KEY is not set');
}

/**
 * Stripe client for server-side operations
 * WARNING: Only use this in server-side code (API routes, Server Actions, webhooks)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia',
	typescript: true,
});
