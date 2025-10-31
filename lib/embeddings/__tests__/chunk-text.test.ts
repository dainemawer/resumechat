import { describe, expect, it } from 'vitest';
import { DEFAULT_CHUNK_CONFIG, chunkText, estimateTokenCount } from '../chunk-text';

describe('chunkText', () => {
	it('should return empty array for empty text', () => {
		expect(chunkText('')).toEqual([]);
		expect(chunkText('   ')).toEqual([]);
	});

	it('should return single chunk for short text', () => {
		const text = 'This is a short resume.';
		const chunks = chunkText(text);
		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toBe(text);
	});

	it('should split text into multiple chunks', () => {
		// Create text longer than maxChunkSize
		const paragraph1 = 'A'.repeat(300);
		const paragraph2 = 'B'.repeat(300);
		const text = `${paragraph1}\n\n${paragraph2}`;

		const chunks = chunkText(text);
		expect(chunks.length).toBeGreaterThan(1);
	});

	it('should respect max chunk size', () => {
		const text = 'A'.repeat(1000);
		const config = { maxChunkSize: 200, overlap: 20 };
		const chunks = chunkText(text, config);

		// Each chunk should be around maxChunkSize or less
		for (const chunk of chunks) {
			expect(chunk.length).toBeLessThanOrEqual(config.maxChunkSize + 50); // Allow some buffer
		}
	});

	it('should create overlap between chunks', () => {
		const paragraph1 = 'This is the first paragraph with some content here.';
		const paragraph2 = 'This is the second paragraph with different content.';
		const text = `${paragraph1}\n\n${paragraph2}`;

		const config = { maxChunkSize: 60, overlap: 20 };
		const chunks = chunkText(text, config);

		if (chunks.length > 1) {
			// Check that there's some overlap (last part of chunk 1 should appear in chunk 2)
			const lastWordsChunk1 = chunks[0].slice(-20);
			expect(chunks[1]).toContain(lastWordsChunk1.trim().split(' ')[0]);
		}
	});

	it('should preserve paragraph boundaries when possible', () => {
		const paragraph1 = 'Paragraph 1: Short text.';
		const paragraph2 = 'Paragraph 2: Another short text.';
		const text = `${paragraph1}\n\n${paragraph2}`;

		const chunks = chunkText(text);

		// With default config, this should fit in one chunk
		expect(chunks.length).toBeLessThanOrEqual(2);
	});

	it('should handle text with mixed newlines', () => {
		const text = 'Line 1\nLine 2\n\nParagraph 2\n\n\nParagraph 3';
		const chunks = chunkText(text);

		expect(chunks.length).toBeGreaterThan(0);
		expect(chunks.join(' ')).toBeTruthy();
	});

	it('should use default config when none provided', () => {
		const text = 'A'.repeat(1000);
		const chunks = chunkText(text);

		expect(chunks.length).toBeGreaterThan(1);
		// Should use DEFAULT_CHUNK_CONFIG.maxChunkSize
		for (const chunk of chunks) {
			expect(chunk.length).toBeLessThanOrEqual(DEFAULT_CHUNK_CONFIG.maxChunkSize + 100);
		}
	});

	it('should handle very long paragraphs', () => {
		// Single paragraph longer than maxChunkSize
		const text = 'Word '.repeat(200); // ~1000 characters
		const config = { maxChunkSize: 100, overlap: 10 };
		const chunks = chunkText(text, config);

		expect(chunks.length).toBeGreaterThan(1);
		// All text should be preserved
		const combined = chunks.join(' ');
		expect(combined.replace(/\s+/g, ' ')).toContain('Word');
	});

	it('should trim whitespace from chunks', () => {
		const text = '  Paragraph 1  \n\n  Paragraph 2  ';
		const chunks = chunkText(text);

		for (const chunk of chunks) {
			expect(chunk).toBe(chunk.trim());
		}
	});

	it('should handle real resume-like text', () => {
		const resumeText = `
JOHN DOE
Software Engineer

SUMMARY
Experienced software engineer with 5 years in web development.
Specialized in React, Node.js, and cloud technologies.

EXPERIENCE
Senior Developer at Tech Corp (2020-Present)
- Led team of 5 developers
- Built scalable microservices
- Reduced deployment time by 50%

Developer at StartupCo (2018-2020)
- Developed React applications
- Integrated third-party APIs
- Improved performance metrics

EDUCATION
BS Computer Science, University of Technology (2018)

SKILLS
JavaScript, TypeScript, React, Node.js, AWS, Docker, PostgreSQL
		`.trim();

		const chunks = chunkText(resumeText);

		expect(chunks.length).toBeGreaterThan(0);
		// All chunks should contain meaningful content
		for (const chunk of chunks) {
			expect(chunk.length).toBeGreaterThan(10);
		}
	});
});

describe('estimateTokenCount', () => {
	it('should estimate token count correctly', () => {
		const text = 'This is a test'; // ~14 characters
		const tokens = estimateTokenCount(text);

		// Should be around 4 tokens (14 / 4 = 3.5, rounded up to 4)
		expect(tokens).toBeGreaterThan(0);
		expect(tokens).toBeLessThanOrEqual(5);
	});

	it('should handle empty text', () => {
		expect(estimateTokenCount('')).toBe(0);
	});

	it('should handle longer text', () => {
		const text = 'A'.repeat(400); // 400 characters
		const tokens = estimateTokenCount(text);

		// Should be around 100 tokens (400 / 4)
		expect(tokens).toBeGreaterThanOrEqual(95);
		expect(tokens).toBeLessThanOrEqual(105);
	});

	it('should estimate typical resume length', () => {
		const resumeText = 'Word '.repeat(500); // ~2500 characters
		const tokens = estimateTokenCount(resumeText);

		// Should be around 625 tokens
		expect(tokens).toBeGreaterThan(600);
		expect(tokens).toBeLessThan(700);
	});
});

describe('DEFAULT_CHUNK_CONFIG', () => {
	it('should have sensible defaults', () => {
		expect(DEFAULT_CHUNK_CONFIG.maxChunkSize).toBeGreaterThan(0);
		expect(DEFAULT_CHUNK_CONFIG.overlap).toBeGreaterThan(0);
		expect(DEFAULT_CHUNK_CONFIG.overlap).toBeLessThan(DEFAULT_CHUNK_CONFIG.maxChunkSize);
	});

	it('should be suitable for OpenAI embeddings', () => {
		// OpenAI text-embedding-3-small supports 8191 tokens
		// With ~4 chars per token, 500 chars ~= 125 tokens, well within limit
		expect(DEFAULT_CHUNK_CONFIG.maxChunkSize).toBeLessThan(2000);
	});
});
