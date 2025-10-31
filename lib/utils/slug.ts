import { customAlphabet } from 'nanoid';

// Use lowercase alphanumeric for nanoid to ensure URL-safe, lowercase slugs
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

/**
 * Generate a unique URL-safe slug for resume sharing
 * @param name - Optional name to include in slug
 * @returns URL-safe slug
 */
export function generateSlug(name?: string): string {
	const id = nanoid(); // Generate 10-character unique ID

	if (!name) {
		return id;
	}

	// Create slug from name
	const nameSlug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
		.replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
		.slice(0, 20); // Limit length

	return nameSlug ? `${nameSlug}-${id}` : id;
}

/**
 * Validate a slug format
 * @param slug - Slug to validate
 * @returns True if valid
 */
export function isValidSlug(slug: string): boolean {
	// Must be 10-40 characters, alphanumeric and hyphens only
	return /^[a-z0-9-]{10,40}$/.test(slug);
}
