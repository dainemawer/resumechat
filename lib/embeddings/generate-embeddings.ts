import OpenAI from 'openai';

/**
 * OpenAI embedding model
 * text-embedding-3-small: Fast, efficient, 1536 dimensions
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Lazy-load OpenAI client to allow for environment variable mocking in tests
 */
function getOpenAIClient(): OpenAI {
	return new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
}

/**
 * Generate embedding vector for a single text chunk
 * @param text - Text to embed
 * @returns Embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const openai = getOpenAIClient();
		const response = await openai.embeddings.create({
			model: EMBEDDING_MODEL,
			input: text,
		});

		return response.data[0]?.embedding || [];
	} catch (error) {
		console.error('Error generating embedding:', error);
		throw new Error('Failed to generate embedding');
	}
}

/**
 * Generate embeddings for multiple text chunks in batch
 * OpenAI allows up to 2048 inputs per request
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
	if (texts.length === 0) {
		return [];
	}

	// OpenAI API limit is 2048 inputs per request
	const BATCH_SIZE = 2048;
	const batches: string[][] = [];

	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		batches.push(texts.slice(i, i + BATCH_SIZE));
	}

	try {
		const openai = getOpenAIClient();
		const allEmbeddings: number[][] = [];

		for (const batch of batches) {
			const response = await openai.embeddings.create({
				model: EMBEDDING_MODEL,
				input: batch,
			});

			const embeddings = response.data.map((item) => item.embedding);
			allEmbeddings.push(...embeddings);
		}

		return allEmbeddings;
	} catch (error) {
		console.error('Error generating embeddings batch:', error);
		throw new Error('Failed to generate embeddings');
	}
}

/**
 * Calculate cosine similarity between two vectors
 * Used for semantic search relevance scoring
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between -1 and 1 (higher is more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		throw new Error('Vectors must have same dimensions');
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
