import { generateEmbedding } from '@/lib/embeddings/generate-embeddings';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Search result with relevance score
 */
export interface SearchResult {
	chunkText: string;
	chunkIndex: number;
	similarity: number;
}

/**
 * Perform vector similarity search on resume embeddings
 * @param resumeId - Resume ID to search
 * @param query - Natural language query
 * @param limit - Maximum number of results to return
 * @returns Array of relevant text chunks with similarity scores
 */
export async function vectorSearch(
	resumeId: string,
	query: string,
	limit = 5
): Promise<SearchResult[]> {
	// Generate embedding for the query
	const queryEmbedding = await generateEmbedding(query);

	// Query Supabase using pgvector's cosine similarity
	// Note: In production, you'd use a native pgvector function
	// For now, we'll fetch all embeddings and calculate similarity client-side
	const supabase = await createServerClient();

	const { data: embeddings, error } = await supabase
		.from('embeddings')
		.select('chunk_text, chunk_index, embedding')
		.eq('resume_id', resumeId);

	if (error || !embeddings) {
		console.error('Error fetching embeddings:', error);
		throw new Error('Failed to search resume');
	}

	// Calculate cosine similarity for each embedding
	const results: SearchResult[] = embeddings
		.map((emb) => ({
			chunkText: emb.chunk_text,
			chunkIndex: emb.chunk_index,
			similarity: cosineSimilarity(queryEmbedding, emb.embedding as number[]),
		}))
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, limit);

	return results;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Build context string from search results
 * @param results - Search results to format
 * @returns Formatted context string
 */
export function buildContext(results: SearchResult[]): string {
	if (results.length === 0) {
		return 'No relevant information found.';
	}

	return results
		.map((result, index) => {
			return `[Context ${index + 1}] (Relevance: ${(result.similarity * 100).toFixed(1)}%)\n${result.chunkText}`;
		})
		.join('\n\n');
}
