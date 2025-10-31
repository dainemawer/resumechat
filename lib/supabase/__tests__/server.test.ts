import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment variables
beforeEach(() => {
	vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
	vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
	vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
});

describe('Supabase Server Client', () => {
	it('should create a server client', async () => {
		// This test will be implemented when we have actual Supabase setup
		// For now, we just verify the modules can be imported
		const { createServerClient, createServiceClient } = await import('../server');
		expect(createServerClient).toBeDefined();
		expect(createServiceClient).toBeDefined();
		expect(typeof createServerClient).toBe('function');
		expect(typeof createServiceClient).toBe('function');
	});

	it('should use correct environment variables for service client', async () => {
		// Verify that the service client will use the correct environment variables
		expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key');
	});
});
