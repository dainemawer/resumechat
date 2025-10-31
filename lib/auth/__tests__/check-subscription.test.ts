import { describe, expect, it } from 'vitest';
import type { User } from '@/lib/supabase/types';
import {
	canAccessEmbed,
	canChat,
	canUploadResume,
	getRemainingChats,
	hasProSubscription,
	shouldShowBranding,
} from '../check-subscription';

// Test data factory
const createMockUser = (overrides: Partial<User> = {}): User => ({
	id: 'test-user-id',
	clerk_id: 'clerk_test123',
	email: 'test@example.com',
	name: 'Test User',
	stripe_customer_id: null,
	subscription_tier: 'free',
	subscription_status: null,
	chat_count: 0,
	created_at: new Date().toISOString(),
	...overrides,
});

describe('hasProSubscription', () => {
	it('should return true for active pro users', () => {
		const proUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'active',
		});
		expect(hasProSubscription(proUser)).toBe(true);
	});

	it('should return false for free users', () => {
		const freeUser = createMockUser();
		expect(hasProSubscription(freeUser)).toBe(false);
	});

	it('should return false for pro users without active status', () => {
		const inactiveProUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'canceled',
		});
		expect(hasProSubscription(inactiveProUser)).toBe(false);
	});
});

describe('canUploadResume', () => {
	it('should allow free users to upload their first resume', () => {
		const freeUser = createMockUser();
		expect(canUploadResume(freeUser, 0)).toBe(true);
	});

	it('should not allow free users to upload a second resume', () => {
		const freeUser = createMockUser();
		expect(canUploadResume(freeUser, 1)).toBe(false);
	});

	it('should allow pro users to replace their resume', () => {
		const proUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'active',
		});
		expect(canUploadResume(proUser, 1)).toBe(true);
	});
});

describe('canChat', () => {
	it('should allow pro users to chat without limits', () => {
		const proUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'active',
			chat_count: 1000,
		});
		expect(canChat(proUser)).toBe(true);
	});

	it('should allow free users within their limit', () => {
		const freeUser = createMockUser({ chat_count: 25 });
		expect(canChat(freeUser)).toBe(true);
	});

	it('should not allow free users over their limit', () => {
		const freeUser = createMockUser({ chat_count: 50 });
		expect(canChat(freeUser)).toBe(false);
	});

	it('should not allow free users at exactly the limit', () => {
		const freeUser = createMockUser({ chat_count: 50 });
		expect(canChat(freeUser)).toBe(false);
	});
});

describe('canAccessEmbed', () => {
	it('should allow pro users to access embed', () => {
		const proUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'active',
		});
		expect(canAccessEmbed(proUser)).toBe(true);
	});

	it('should not allow free users to access embed', () => {
		const freeUser = createMockUser();
		expect(canAccessEmbed(freeUser)).toBe(false);
	});
});

describe('shouldShowBranding', () => {
	it('should show branding for free users', () => {
		const freeUser = createMockUser();
		expect(shouldShowBranding(freeUser)).toBe(true);
	});

	it('should not show branding for pro users', () => {
		const proUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'active',
		});
		expect(shouldShowBranding(proUser)).toBe(false);
	});
});

describe('getRemainingChats', () => {
	it('should return null for pro users (unlimited)', () => {
		const proUser = createMockUser({
			subscription_tier: 'pro',
			subscription_status: 'active',
		});
		expect(getRemainingChats(proUser)).toBeNull();
	});

	it('should return correct remaining chats for free users', () => {
		const freeUser = createMockUser({ chat_count: 30 });
		expect(getRemainingChats(freeUser)).toBe(20);
	});

	it('should return 0 when free user is at limit', () => {
		const freeUser = createMockUser({ chat_count: 50 });
		expect(getRemainingChats(freeUser)).toBe(0);
	});

	it('should not return negative values', () => {
		const freeUser = createMockUser({ chat_count: 60 });
		expect(getRemainingChats(freeUser)).toBe(0);
	});
});
