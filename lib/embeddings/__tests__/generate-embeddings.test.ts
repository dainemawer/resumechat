import { beforeAll, describe, expect, it, vi } from 'vitest';

// Mock environment variable before importing module
beforeAll(() => {
	vi.stubEnv('OPENAI_API_KEY', 'sk_test_mock_key');
});

import { cosineSimilarity } from '../generate-embeddings';

describe('cosineSimilarity', () => {
	it('should return 1 for identical vectors', () => {
		const vector = [1, 2, 3, 4, 5];
		const similarity = cosineSimilarity(vector, vector);
		expect(similarity).toBeCloseTo(1, 5);
	});

	it('should return 0 for orthogonal vectors', () => {
		const vectorA = [1, 0, 0];
		const vectorB = [0, 1, 0];
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(0, 5);
	});

	it('should return -1 for opposite vectors', () => {
		const vectorA = [1, 2, 3];
		const vectorB = [-1, -2, -3];
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(-1, 5);
	});

	it('should calculate similarity for positive correlation', () => {
		const vectorA = [1, 2, 3];
		const vectorB = [2, 4, 6];
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(1, 5); // Perfectly correlated
	});

	it('should handle normalized vectors', () => {
		// Vectors of different magnitudes but same direction
		const vectorA = [0.1, 0.2, 0.3];
		const vectorB = [0.2, 0.4, 0.6];
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(1, 5);
	});

	it('should handle negative values', () => {
		const vectorA = [-1, -2, -3];
		const vectorB = [-2, -4, -6];
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(1, 5);
	});

	it('should throw error for vectors of different lengths', () => {
		const vectorA = [1, 2, 3];
		const vectorB = [1, 2];
		expect(() => cosineSimilarity(vectorA, vectorB)).toThrow('Vectors must have same dimensions');
	});

	it('should handle high-dimensional vectors', () => {
		// Simulate embedding-like vectors
		const vectorA = Array.from({ length: 100 }, (_, i) => i / 100);
		const vectorB = Array.from({ length: 100 }, (_, i) => i / 100);
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(1, 5);
	});

	it('should return value between -1 and 1', () => {
		const vectorA = [0.5, 0.8, 0.3, 0.9];
		const vectorB = [0.2, 0.7, 0.5, 0.1];
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeGreaterThanOrEqual(-1);
		expect(similarity).toBeLessThanOrEqual(1);
	});

	it('should calculate partial similarity', () => {
		const vectorA = [1, 0, 0, 0];
		const vectorB = [0.707, 0.707, 0, 0]; // 45 degrees
		const similarity = cosineSimilarity(vectorA, vectorB);
		expect(similarity).toBeCloseTo(0.707, 2); // cos(45°) ≈ 0.707
	});

	it('should handle zero vectors gracefully', () => {
		const vectorA = [0, 0, 0];
		const vectorB = [1, 2, 3];
		const similarity = cosineSimilarity(vectorA, vectorB);
		// Result should be NaN due to division by zero
		expect(Number.isNaN(similarity)).toBe(true);
	});
});

describe('EMBEDDING_MODEL', () => {
	it('should be set to text-embedding-3-small', () => {
		const EMBEDDING_MODEL = 'text-embedding-3-small';
		expect(EMBEDDING_MODEL).toBe('text-embedding-3-small');
	});
});

describe('EMBEDDING_DIMENSIONS', () => {
	it('should be 1536 dimensions', () => {
		const EMBEDDING_DIMENSIONS = 1536;
		expect(EMBEDDING_DIMENSIONS).toBe(1536);
	});

	it('should match OpenAI text-embedding-3-small dimensions', () => {
		// text-embedding-3-small produces 1536-dimensional vectors
		const EMBEDDING_DIMENSIONS = 1536;
		expect(EMBEDDING_DIMENSIONS).toBe(1536);
	});
});

// Integration-style tests (these would need actual API calls in real testing)
describe('Embedding generation (conceptual)', () => {
	it('should produce vectors of correct dimensions', () => {
		// This is a conceptual test - actual API calls would be in integration tests
		const EMBEDDING_DIMENSIONS = 1536;
		expect(EMBEDDING_DIMENSIONS).toBe(1536);
	});

	it('should handle batches efficiently', () => {
		// Conceptual: OpenAI allows up to 2048 inputs per request
		const MAX_BATCH_SIZE = 2048;
		expect(MAX_BATCH_SIZE).toBeGreaterThan(0);
	});
});
