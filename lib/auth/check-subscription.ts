import type { User } from '@/lib/supabase/types';

/**
 * Check if a user has an active Pro subscription
 */
export function hasProSubscription(user: User): boolean {
	return user.subscription_tier === 'pro' && user.subscription_status === 'active';
}

/**
 * Check if a user can upload a resume based on their subscription tier
 */
export function canUploadResume(user: User, currentResumeCount: number): boolean {
	// Free users can have 1 resume
	if (user.subscription_tier === 'free') {
		return currentResumeCount < 1;
	}

	// Pro users can replace their resume unlimited times (but still only 1 active)
	return true;
}

/**
 * Check if a user can chat based on their limits
 */
export function canChat(user: User): boolean {
	// Pro users have unlimited chats
	if (hasProSubscription(user)) {
		return true;
	}

	// Free users have monthly limit of 50 chats
	return user.chat_count < 50;
}

/**
 * Check if a user can access embed widget (Pro only feature)
 */
export function canAccessEmbed(user: User): boolean {
	return hasProSubscription(user);
}

/**
 * Check if a user should see branding (free tier shows branding)
 */
export function shouldShowBranding(user: User): boolean {
	return !hasProSubscription(user);
}

/**
 * Get user's remaining chats for the current period
 */
export function getRemainingChats(user: User): number | null {
	// Pro users have unlimited
	if (hasProSubscription(user)) {
		return null;
	}

	// Free users have 50 per month
	const limit = 50;
	return Math.max(0, limit - user.chat_count);
}
