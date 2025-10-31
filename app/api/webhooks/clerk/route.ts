import type { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
	// Get the Webhook secret from environment
	const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
	}

	// Get the headers
	const headerPayload = await headers();
	const svix_id = headerPayload.get('svix-id');
	const svix_timestamp = headerPayload.get('svix-timestamp');
	const svix_signature = headerPayload.get('svix-signature');

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response('Error occured -- no svix headers', {
			status: 400,
		});
	}

	// Get the body
	const payload = await req.json();
	const body = JSON.stringify(payload);

	// Create a new Svix instance with your secret.
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt: WebhookEvent;

	// Verify the payload with the headers
	try {
		evt = wh.verify(body, {
			'svix-id': svix_id,
			'svix-timestamp': svix_timestamp,
			'svix-signature': svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error('Error verifying webhook:', err);
		return new Response('Error occured', {
			status: 400,
		});
	}

	// Get the event type
	const eventType = evt.type;

	// Initialize Supabase service client
	const supabase = createServiceClient();

	try {
		switch (eventType) {
			case 'user.created': {
				// Create user in Supabase
				const { id, email_addresses, first_name, last_name } = evt.data;

				const primaryEmail = email_addresses.find(
					(email) => email.id === evt.data.primary_email_address_id
				);

				if (!primaryEmail) {
					console.error('No primary email found for user:', id);
					return new Response('No primary email found', { status: 400 });
				}

				const { error } = await supabase.from('users').insert({
					clerk_id: id,
					email: primaryEmail.email_address,
					name: `${first_name || ''} ${last_name || ''}`.trim() || null,
					subscription_tier: 'free',
					chat_count: 0,
				});

				if (error) {
					console.error('Error creating user in Supabase:', error);
					return new Response('Error creating user', { status: 500 });
				}

				console.log('User created in Supabase:', id);
				break;
			}

			case 'user.updated': {
				// Update user in Supabase
				const { id, email_addresses, first_name, last_name } = evt.data;

				const primaryEmail = email_addresses.find(
					(email) => email.id === evt.data.primary_email_address_id
				);

				if (!primaryEmail) {
					console.error('No primary email found for user:', id);
					return new Response('No primary email found', { status: 400 });
				}

				const { error } = await supabase
					.from('users')
					.update({
						email: primaryEmail.email_address,
						name: `${first_name || ''} ${last_name || ''}`.trim() || null,
					})
					.eq('clerk_id', id);

				if (error) {
					console.error('Error updating user in Supabase:', error);
					return new Response('Error updating user', { status: 500 });
				}

				console.log('User updated in Supabase:', id);
				break;
			}

			case 'user.deleted': {
				// Delete user from Supabase (cascade will handle related data)
				const { id } = evt.data;

				if (!id) {
					console.error('No user ID provided for deletion');
					return new Response('No user ID provided', { status: 400 });
				}

				const { error } = await supabase.from('users').delete().eq('clerk_id', id);

				if (error) {
					console.error('Error deleting user from Supabase:', error);
					return new Response('Error deleting user', { status: 500 });
				}

				console.log('User deleted from Supabase:', id);
				break;
			}

			default:
				console.log('Unhandled event type:', eventType);
		}

		return new Response('Webhook processed successfully', { status: 200 });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return new Response('Error processing webhook', { status: 500 });
	}
}
