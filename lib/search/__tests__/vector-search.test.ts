import { describe, expect, it } from 'vitest';
import { buildContext } from '../vector-search';
import type { SearchResult } from '../vector-search';

describe('buildContext', () => {
	it('should format single search result', () => {
		const results: SearchResult[] = [
			{
				chunkText: 'Experienced software engineer with 5 years in web development.',
				chunkIndex: 0,
				similarity: 0.95,
			},
		];

		const context = buildContext(results);

		expect(context).toContain('[Context 1]');
		expect(context).toContain('(Relevance: 95.0%)');
		expect(context).toContain('Experienced software engineer');
	});

	it('should format multiple search results', () => {
		const results: SearchResult[] = [
			{
				chunkText: 'Led team of 5 developers',
				chunkIndex: 0,
				similarity: 0.92,
			},
			{
				chunkText: 'Built scalable microservices',
				chunkIndex: 1,
				similarity: 0.88,
			},
			{
				chunkText: 'Reduced deployment time by 50%',
				chunkIndex: 2,
				similarity: 0.85,
			},
		];

		const context = buildContext(results);

		expect(context).toContain('[Context 1]');
		expect(context).toContain('[Context 2]');
		expect(context).toContain('[Context 3]');
		expect(context).toContain('(Relevance: 92.0%)');
		expect(context).toContain('(Relevance: 88.0%)');
		expect(context).toContain('(Relevance: 85.0%)');
		expect(context).toContain('Led team of 5 developers');
		expect(context).toContain('Built scalable microservices');
		expect(context).toContain('Reduced deployment time by 50%');
	});

	it('should handle empty results', () => {
		const results: SearchResult[] = [];
		const context = buildContext(results);

		expect(context).toBe('No relevant information found.');
	});

	it('should show relevance as percentage', () => {
		const results: SearchResult[] = [
			{
				chunkText: 'Test content',
				chunkIndex: 0,
				similarity: 0.875,
			},
		];

		const context = buildContext(results);

		expect(context).toContain('(Relevance: 87.5%)');
	});

	it('should separate results with double newlines', () => {
		const results: SearchResult[] = [
			{ chunkText: 'First chunk', chunkIndex: 0, similarity: 0.9 },
			{ chunkText: 'Second chunk', chunkIndex: 1, similarity: 0.8 },
		];

		const context = buildContext(results);

		// Should have two newlines between results
		expect(context).toContain('First chunk\n\n[Context 2]');
	});

	it('should handle low similarity scores', () => {
		const results: SearchResult[] = [
			{
				chunkText: 'Barely relevant content',
				chunkIndex: 0,
				similarity: 0.15,
			},
		];

		const context = buildContext(results);

		expect(context).toContain('(Relevance: 15.0%)');
	});

	it('should handle perfect similarity', () => {
		const results: SearchResult[] = [
			{
				chunkText: 'Exact match content',
				chunkIndex: 0,
				similarity: 1.0,
			},
		];

		const context = buildContext(results);

		expect(context).toContain('(Relevance: 100.0%)');
	});

	it('should preserve chunk text formatting', () => {
		const results: SearchResult[] = [
			{
				chunkText: 'Multi-line\ncontent with\nspecial characters: $@#',
				chunkIndex: 0,
				similarity: 0.9,
			},
		];

		const context = buildContext(results);

		expect(context).toContain('Multi-line\ncontent with\nspecial characters: $@#');
	});

	it('should handle many results', () => {
		const results: SearchResult[] = Array.from({ length: 10 }, (_, i) => ({
			chunkText: `Chunk ${i + 1}`,
			chunkIndex: i,
			similarity: 0.9 - i * 0.05,
		}));

		const context = buildContext(results);

		// All results should be included
		for (let i = 1; i <= 10; i++) {
			expect(context).toContain(`[Context ${i}]`);
			expect(context).toContain(`Chunk ${i}`);
		}
	});

	it('should order results by context number', () => {
		const results: SearchResult[] = [
			{ chunkText: 'First', chunkIndex: 5, similarity: 0.95 },
			{ chunkText: 'Second', chunkIndex: 2, similarity: 0.9 },
			{ chunkText: 'Third', chunkIndex: 8, similarity: 0.85 },
		];

		const context = buildContext(results);

		const firstIndex = context.indexOf('[Context 1]');
		const secondIndex = context.indexOf('[Context 2]');
		const thirdIndex = context.indexOf('[Context 3]');

		expect(firstIndex).toBeLessThan(secondIndex);
		expect(secondIndex).toBeLessThan(thirdIndex);
	});
});

// Note: vectorSearch function would require mocking Supabase
// Those tests would go in an integration test suite
describe('vectorSearch (integration)', () => {
	it('should be tested with actual database in integration tests', () => {
		// This is a placeholder for integration tests
		// In a real scenario, you'd use a test database or mocks
		expect(true).toBe(true);
	});
});
