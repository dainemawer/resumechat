'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function UploadForm() {
	const router = useRouter();
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!file) {
			setError('Please select a file');
			return;
		}

		setIsUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/resumes/upload', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Upload failed');
			}

			// Success - redirect to dashboard
			router.push('/dashboard');
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Card>
				<CardHeader>
					<CardTitle>Upload Resume</CardTitle>
					<CardDescription>Upload your resume in PDF or DOCX format (max 5MB)</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					<div>
						<label htmlFor="resume-file" className="mb-2 block text-sm font-medium">
							Resume File
						</label>
						<input
							id="resume-file"
							type="file"
							accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
							onChange={(e) => {
								const selectedFile = e.target.files?.[0];
								if (selectedFile) {
									setFile(selectedFile);
									setError(null);
								}
							}}
							disabled={isUploading}
							className="block w-full text-sm text-muted-foreground
								file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground
								hover:file:bg-primary/90 file:transition-colors
								disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<p className="mt-2 text-xs text-muted-foreground">Supported formats: PDF, DOCX (max 5MB)</p>
					</div>

					{file && (
						<div className="rounded-md border border-primary/20 bg-primary/5 p-3">
							<p className="text-sm">
								<span className="font-medium">Selected:</span> {file.name}
							</p>
							<p className="text-xs text-muted-foreground">
								Size: {(file.size / 1024 / 1024).toFixed(2)} MB
							</p>
						</div>
					)}

					<div className="flex gap-2">
						<Button type="submit" disabled={!file || isUploading} className="flex-1">
							{isUploading ? (
								<>
									<svg
										className="-ml-1 mr-2 size-4 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Uploading...
								</>
							) : (
								'Upload Resume'
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push('/dashboard')}
							disabled={isUploading}
						>
							Cancel
						</Button>
					</div>
				</CardContent>
			</Card>
		</form>
	);
}
