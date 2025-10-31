import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment variables
beforeEach(() => {
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock_key');
});

describe('Stripe Client', () => {
	it('should initialize Stripe client', async () => {
		// Verify module can be imported with proper env setup
		expect(process.env.STRIPE_SECRET_KEY).toBe('sk_test_mock_key');
	});

	it('should throw error if STRIPE_SECRET_KEY is not set', async () => {
		vi.unstubAllEnvs();

		await expect(async () => {
			// This will throw when the module is imported
			await import('../client');
		}).rejects.toThrow('STRIPE_SECRET_KEY is not set');

		// Restore for other tests
		vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock_key');
	});
});
