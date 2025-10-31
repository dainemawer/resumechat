/**
 * Configuration for text chunking
 */
export interface ChunkConfig {
	maxChunkSize: number; // Maximum characters per chunk
	overlap: number; // Number of characters to overlap between chunks
}

/**
 * Default chunking configuration
 * Optimized for OpenAI embeddings (text-embedding-3-small supports 8191 tokens)
 * Using ~500 chars per chunk for better semantic coherence
 */
export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
	maxChunkSize: 500,
	overlap: 50,
};

/**
 * Split text into overlapping chunks for embedding
 * @param text - Text to chunk
 * @param config - Chunking configuration
 * @returns Array of text chunks
 */
export function chunkText(text: string, config: ChunkConfig = DEFAULT_CHUNK_CONFIG): string[] {
	if (!text || text.trim().length === 0) {
		return [];
	}

	const chunks: string[] = [];
	const { maxChunkSize, overlap } = config;

	// Split by paragraphs first (double newlines)
	const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

	let currentChunk = '';

	for (const paragraph of paragraphs) {
		const trimmedParagraph = paragraph.trim();

		// If adding this paragraph would exceed max size, save current chunk
		if (currentChunk.length > 0 && currentChunk.length + trimmedParagraph.length > maxChunkSize) {
			chunks.push(currentChunk.trim());

			// Start new chunk with overlap from previous chunk
			const overlapText = currentChunk.slice(-overlap);
			currentChunk = overlapText + ' ' + trimmedParagraph;
		} else {
			// Add paragraph to current chunk
			currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + trimmedParagraph;
		}

		// If current chunk is too large, force split it
		if (currentChunk.length > maxChunkSize) {
			const splitChunks = forceSplitLongText(currentChunk, maxChunkSize, overlap);
			chunks.push(...splitChunks.slice(0, -1));
			currentChunk = splitChunks[splitChunks.length - 1] || '';
		}
	}

	// Add final chunk if it exists
	if (currentChunk.trim().length > 0) {
		chunks.push(currentChunk.trim());
	}

	return chunks;
}

/**
 * Force split text that's too long, preserving word boundaries
 * @param text - Text to split
 * @param maxSize - Maximum size per chunk
 * @param overlap - Overlap between chunks
 * @returns Array of chunks
 */
function forceSplitLongText(text: string, maxSize: number, overlap: number): string[] {
	const chunks: string[] = [];
	let start = 0;

	while (start < text.length) {
		let end = start + maxSize;

		// If this is not the last chunk, find a word boundary
		if (end < text.length) {
			// Look for nearest space before max size
			const lastSpace = text.lastIndexOf(' ', end);
			if (lastSpace > start) {
				end = lastSpace;
			}
		}

		chunks.push(text.slice(start, end).trim());
		start = end - overlap;
	}

	return chunks;
}

/**
 * Get estimated token count for text (rough approximation)
 * Rule of thumb: 1 token ≈ 4 characters for English text
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
	return Math.ceil(text.length / 4);
}
