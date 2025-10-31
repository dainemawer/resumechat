import { describe, expect, it } from 'vitest';
import { generateSlug, isValidSlug } from '../slug';

describe('generateSlug', () => {
	it('should generate a slug without a name', () => {
		const slug = generateSlug();
		expect(slug).toHaveLength(10);
		expect(isValidSlug(slug)).toBe(true);
	});

	it('should generate a slug with a name', () => {
		const slug = generateSlug('John Doe');
		expect(slug).toContain('john-doe');
		expect(isValidSlug(slug)).toBe(true);
	});

	it('should handle special characters in name', () => {
		const slug = generateSlug("John O'Connor!");
		expect(slug).toMatch(/^john-o-connor-[a-z0-9]{10}$/);
		expect(isValidSlug(slug)).toBe(true);
	});

	it('should generate unique slugs', () => {
		const slug1 = generateSlug('John Doe');
		const slug2 = generateSlug('John Doe');
		expect(slug1).not.toBe(slug2);
	});

	it('should handle very long names', () => {
		const longName = 'This Is A Very Long Name That Should Be Truncated';
		const slug = generateSlug(longName);
		// Name part should be truncated to 20 chars, plus hyphen and 10 char ID
		expect(slug.length).toBeLessThanOrEqual(31);
		expect(isValidSlug(slug)).toBe(true);
	});

	it('should handle empty string name', () => {
		const slug = generateSlug('');
		expect(slug).toHaveLength(10);
		expect(isValidSlug(slug)).toBe(true);
	});

	it('should handle names with only special characters', () => {
		const slug = generateSlug('!@#$%^&*()');
		// Should fall back to just ID
		expect(slug).toHaveLength(10);
		expect(isValidSlug(slug)).toBe(true);
	});
});

describe('isValidSlug', () => {
	it('should validate correct slugs', () => {
		expect(isValidSlug('abc123defg')).toBe(true);
		expect(isValidSlug('john-doe-abc123')).toBe(true);
		expect(isValidSlug('a'.repeat(10))).toBe(true);
		expect(isValidSlug('a'.repeat(40))).toBe(true);
	});

	it('should reject invalid slugs', () => {
		expect(isValidSlug('short')).toBe(false); // Too short
		expect(isValidSlug('a'.repeat(41))).toBe(false); // Too long
		expect(isValidSlug('Invalid Slug')).toBe(false); // Contains spaces
		expect(isValidSlug('invalid_slug')).toBe(false); // Contains underscore
		expect(isValidSlug('Invalid-SLUG')).toBe(false); // Contains uppercase
		expect(isValidSlug('invalid.slug')).toBe(false); // Contains period
	});

	it('should reject empty slug', () => {
		expect(isValidSlug('')).toBe(false);
	});
});
