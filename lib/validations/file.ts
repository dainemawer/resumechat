import { z } from 'zod';

/**
 * Allowed file types for resume upload
 */
export const ALLOWED_FILE_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * Maximum file size (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validate file type by MIME type
 */
export function isValidFileType(file: File): boolean {
	return ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number]);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
	return file.size <= MAX_FILE_SIZE;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	const parts = filename.split('.');
	// If there's no dot or only one part, there's no extension
	if (parts.length <= 1) {
		return '';
	}
	return parts.pop()?.toLowerCase() || '';
}

/**
 * Validate file for resume upload
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
	if (!file) {
		return { valid: false, error: 'No file provided' };
	}

	if (!isValidFileType(file)) {
		return { valid: false, error: 'Invalid file type. Please upload a PDF or DOCX file.' };
	}

	if (!isValidFileSize(file)) {
		return {
			valid: false,
			error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
		};
	}

	return { valid: true };
}

/**
 * Zod schema for resume file validation
 */
export const resumeFileSchema = z.object({
	name: z.string().min(1).max(255),
	size: z.number().max(MAX_FILE_SIZE),
	type: z.enum(ALLOWED_FILE_TYPES),
});
