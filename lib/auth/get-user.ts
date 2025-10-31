import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import type { User } from '@/lib/supabase/types';

/**
 * Get the current authenticated user with subscription data from Supabase
 * @returns User data or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	const supabase = await createServerClient();

	const { data: user, error } = await supabase
		.from('users')
		.select('*')
		.eq('clerk_id', userId)
		.single();

	if (error || !user) {
		console.error('Error fetching user from Supabase:', error);
		return null;
	}

	return user;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in Server Actions and API routes that require auth
 */
export async function requireAuth(): Promise<User> {
	const user = await getCurrentUser();

	if (!user) {
		throw new Error('Unauthorized');
	}

	return user;
}
