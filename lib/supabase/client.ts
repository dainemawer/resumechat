import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in the browser
 * This client automatically handles session management and uses the anon key
 */
export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	);
}
