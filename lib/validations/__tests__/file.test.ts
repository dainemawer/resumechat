import { describe, expect, it } from 'vitest';
import {
	ALLOWED_FILE_TYPES,
	MAX_FILE_SIZE,
	getFileExtension,
	isValidFileSize,
	isValidFileType,
	validateResumeFile,
} from '../file';

// Mock File constructor for testing
class MockFile {
	name: string;
	size: number;
	type: string;

	constructor(name: string, size: number, type: string) {
		this.name = name;
		this.size = size;
		this.type = type;
	}
}

describe('isValidFileType', () => {
	it('should accept PDF files', () => {
		const file = new MockFile('resume.pdf', 1000, 'application/pdf') as unknown as File;
		expect(isValidFileType(file)).toBe(true);
	});

	it('should accept DOCX files', () => {
		const file = new MockFile(
			'resume.docx',
			1000,
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		) as unknown as File;
		expect(isValidFileType(file)).toBe(true);
	});

	it('should reject other file types', () => {
		const txtFile = new MockFile('resume.txt', 1000, 'text/plain') as unknown as File;
		expect(isValidFileType(txtFile)).toBe(false);

		const docFile = new MockFile('resume.doc', 1000, 'application/msword') as unknown as File;
		expect(isValidFileType(docFile)).toBe(false);
	});
});

describe('isValidFileSize', () => {
	it('should accept files under the limit', () => {
		const file = new MockFile('resume.pdf', 1 * 1024 * 1024, 'application/pdf') as unknown as File; // 1MB
		expect(isValidFileSize(file)).toBe(true);
	});

	it('should accept files at the limit', () => {
		const file = new MockFile('resume.pdf', MAX_FILE_SIZE, 'application/pdf') as unknown as File;
		expect(isValidFileSize(file)).toBe(true);
	});

	it('should reject files over the limit', () => {
		const file = new MockFile('resume.pdf', MAX_FILE_SIZE + 1, 'application/pdf') as unknown as File;
		expect(isValidFileSize(file)).toBe(false);
	});

	it('should reject very large files', () => {
		const file = new MockFile('resume.pdf', 10 * 1024 * 1024, 'application/pdf') as unknown as File; // 10MB
		expect(isValidFileSize(file)).toBe(false);
	});
});

describe('getFileExtension', () => {
	it('should extract file extension', () => {
		expect(getFileExtension('resume.pdf')).toBe('pdf');
		expect(getFileExtension('document.docx')).toBe('docx');
		expect(getFileExtension('file.TXT')).toBe('txt');
	});

	it('should handle files with multiple dots', () => {
		expect(getFileExtension('my.resume.pdf')).toBe('pdf');
	});

	it('should handle files without extension', () => {
		expect(getFileExtension('resume')).toBe('');
	});

	it('should handle empty filename', () => {
		expect(getFileExtension('')).toBe('');
	});
});

describe('validateResumeFile', () => {
	it('should validate a correct PDF file', () => {
		const file = new MockFile('resume.pdf', 1 * 1024 * 1024, 'application/pdf') as unknown as File;
		const result = validateResumeFile(file);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should validate a correct DOCX file', () => {
		const file = new MockFile(
			'resume.docx',
			2 * 1024 * 1024,
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		) as unknown as File;
		const result = validateResumeFile(file);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should reject invalid file type', () => {
		const file = new MockFile('resume.txt', 1000, 'text/plain') as unknown as File;
		const result = validateResumeFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Invalid file type');
	});

	it('should reject oversized files', () => {
		const file = new MockFile('resume.pdf', 10 * 1024 * 1024, 'application/pdf') as unknown as File;
		const result = validateResumeFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('File too large');
	});

	it('should reject null file', () => {
		const result = validateResumeFile(null as unknown as File);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('No file provided');
	});
});

describe('ALLOWED_FILE_TYPES', () => {
	it('should contain PDF and DOCX types', () => {
		expect(ALLOWED_FILE_TYPES).toContain('application/pdf');
		expect(ALLOWED_FILE_TYPES).toContain(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		);
	});

	it('should have exactly 2 allowed types', () => {
		expect(ALLOWED_FILE_TYPES).toHaveLength(2);
	});
});

describe('MAX_FILE_SIZE', () => {
	it('should be 5MB in bytes', () => {
		expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
	});
});
