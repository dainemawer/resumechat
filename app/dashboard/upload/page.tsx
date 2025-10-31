import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { UploadForm } from '@/components/dashboard/upload-form';

export default async function UploadPage() {
	// Check authentication
	const { userId } = await auth();
	if (!userId) {
		redirect('/sign-in');
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-16 items-center px-4">
					<Link href="/dashboard" className="text-xl font-bold hover:text-primary">
						← Back to Dashboard
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto max-w-2xl px-4 py-8">
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold">Upload Your Resume</h1>
					<p className="text-muted-foreground">
						Upload your resume and we'll create an AI-powered chat interface for recruiters.
					</p>
				</div>

				<UploadForm />

				{/* How it works */}
				<div className="mt-8 rounded-lg border bg-card p-6">
					<h2 className="mb-4 text-lg font-semibold">How it works</h2>
					<ol className="space-y-3 text-sm text-muted-foreground">
						<li className="flex gap-3">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
								1
							</span>
							<span>Upload your resume in PDF or DOCX format</span>
						</li>
						<li className="flex gap-3">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
								2
							</span>
							<span>Our AI analyzes and structures your resume content</span>
						</li>
						<li className="flex gap-3">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
								3
							</span>
							<span>Get a shareable link for recruiters to chat with your resume</span>
						</li>
						<li className="flex gap-3">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
								4
							</span>
							<span>Track engagement and interactions in your dashboard</span>
						</li>
					</ol>
				</div>
			</main>
		</div>
	);
}
