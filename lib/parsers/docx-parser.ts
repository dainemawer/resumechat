import mammoth from 'mammoth';

/**
 * Extract text content from a DOCX buffer
 * @param buffer - DOCX file buffer
 * @returns Extracted text content
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
	try {
		const result = await mammoth.extractRawText({ buffer });
		return cleanText(result.value);
	} catch (error) {
		console.error('Error parsing DOCX:', error);
		throw new Error('Failed to parse DOCX file. Please ensure it is a valid Word document.');
	}
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
	return (
		text
			// Remove multiple spaces
			.replace(/\s+/g, ' ')
			// Remove multiple newlines
			.replace(/\n{3,}/g, '\n\n')
			// Trim whitespace
			.trim()
	);
}
