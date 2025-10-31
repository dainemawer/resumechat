import pdf from 'pdf-parse';

/**
 * Extract text content from a PDF buffer
 * @param buffer - PDF file buffer
 * @returns Extracted text content
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
	try {
		const data = await pdf(buffer);
		return cleanText(data.text);
	} catch (error) {
		console.error('Error parsing PDF:', error);
		throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF.');
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
