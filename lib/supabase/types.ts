/**
 * Database types for Supabase tables
 * These types should match the schema defined in docs/database.md
 */

export interface User {
	id: string;
	clerk_id: string;
	email: string;
	name: string | null;
	stripe_customer_id: string | null;
	subscription_tier: 'free' | 'pro';
	subscription_status: string | null;
	chat_count: number;
	created_at: string;
}

export interface Resume {
	id: string;
	user_id: string;
	raw_text: string;
	parsed_json: ParsedResumeData;
	summary: string | null;
	share_slug: string;
	file_name: string;
	created_at: string;
}

export interface ParsedResumeData {
	skills: string[];
	experience: ExperienceItem[];
	education: EducationItem[];
}

export interface ExperienceItem {
	company: string;
	role: string;
	years: string;
	description?: string;
}

export interface EducationItem {
	degree: string;
	institution?: string;
	year: string;
}

export interface Embedding {
	id: string;
	resume_id: string;
	content: string;
	embedding: number[];
	created_at: string;
}

export interface Chat {
	id: string;
	resume_id: string;
	question: string;
	answer: string;
	created_at: string;
}

export interface Subscription {
	id: string;
	user_id: string;
	stripe_subscription_id: string | null;
	stripe_price_id: string | null;
	status: string;
	current_period_start: string | null;
	current_period_end: string | null;
	created_at: string;
}

/**
 * Database function response types
 */
export interface VectorSearchResult {
	id: string;
	content: string;
	similarity: number;
}

/**
 * Type guards
 */
export function isProUser(user: User): boolean {
	return user.subscription_tier === 'pro' && user.subscription_status === 'active';
}

export function canUploadResume(user: User, existingResumeCount: number): boolean {
	// Free users can have 1 resume
	if (user.subscription_tier === 'free') {
		return existingResumeCount < 1;
	}
	// Pro users can replace their resume unlimited times
	return true;
}

export function canChat(user: User): boolean {
	// Pro users have unlimited chats
	if (user.subscription_tier === 'pro' && user.subscription_status === 'active') {
		return true;
	}
	// Free users have monthly limit
	return user.chat_count < 50;
}
