import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChatContainer } from '@/components/chat';
import { createServerClient } from '@/lib/supabase/server';

interface PageProps {
	params: Promise<{
		slug: string;
	}>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const supabase = await createServerClient();

	const { data: resume } = await supabase
		.from('resumes')
		.select('summary, users(name)')
		.eq('share_slug', slug)
		.eq('is_public', true)
		.single();

	if (!resume) {
		return {
			title: 'Resume Not Found | ResumeChat',
		};
	}

	const candidateName = resume.users?.name || 'Candidate';

	return {
		title: `${candidateName}'s Resume | ResumeChat`,
		description: resume.summary || `Chat with ${candidateName}'s resume powered by AI`,
		openGraph: {
			title: `${candidateName}'s Resume`,
			description: resume.summary || `Chat with ${candidateName}'s resume powered by AI`,
			type: 'profile',
		},
		robots: {
			index: true,
			follow: true,
		},
	};
}

export default async function PublicResumePage({ params }: PageProps) {
	const { slug } = await params;
	const supabase = await createServerClient();

	// Fetch resume by slug
	const { data: resume, error } = await supabase
		.from('resumes')
		.select('id, summary, parsed_json, created_at, users(name, email)')
		.eq('share_slug', slug)
		.eq('is_public', true)
		.single();

	if (error || !resume) {
		notFound();
	}

	const parsedData = resume.parsed_json as {
		skills?: string[];
		experience?: Array<{
			company: string;
			role: string;
			years: string;
			description: string;
		}>;
		education?: Array<{
			degree: string;
			institution: string;
			year: string;
		}>;
	};

	const candidateName = resume.users?.name || 'Candidate';

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			<div className="container mx-auto max-w-7xl px-4 py-8">
				{/* Header */}
				<header className="mb-8">
					<div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-4"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
							/>
						</svg>
						<span>ResumeChat</span>
					</div>

					<h1 className="mb-2 text-4xl font-bold">{candidateName}</h1>
					<p className="text-lg text-muted-foreground">{resume.summary}</p>
				</header>

				{/* Main Content */}
				<div className="grid gap-8 lg:grid-cols-[1fr,400px]">
					{/* Resume Details */}
					<div className="space-y-6">
						{/* Skills */}
						{parsedData.skills && parsedData.skills.length > 0 && (
							<section className="rounded-lg border bg-card p-6">
								<h2 className="mb-4 text-xl font-semibold">Skills</h2>
								<div className="flex flex-wrap gap-2">
									{parsedData.skills.map((skill) => (
										<span
											key={skill}
											className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
										>
											{skill}
										</span>
									))}
								</div>
							</section>
						)}

						{/* Experience */}
						{parsedData.experience && parsedData.experience.length > 0 && (
							<section className="rounded-lg border bg-card p-6">
								<h2 className="mb-4 text-xl font-semibold">Experience</h2>
								<div className="space-y-6">
									{parsedData.experience.map((exp, index) => (
										<div key={`${exp.company}-${index}`} className="border-l-2 border-primary pl-4">
											<h3 className="font-semibold">{exp.role}</h3>
											<p className="text-sm text-muted-foreground">
												{exp.company} • {exp.years}
											</p>
											<p className="mt-2 text-sm">{exp.description}</p>
										</div>
									))}
								</div>
							</section>
						)}

						{/* Education */}
						{parsedData.education && parsedData.education.length > 0 && (
							<section className="rounded-lg border bg-card p-6">
								<h2 className="mb-4 text-xl font-semibold">Education</h2>
								<div className="space-y-4">
									{parsedData.education.map((edu, index) => (
										<div key={`${edu.institution}-${index}`}>
											<h3 className="font-semibold">{edu.degree}</h3>
											<p className="text-sm text-muted-foreground">
												{edu.institution} • {edu.year}
											</p>
										</div>
									))}
								</div>
							</section>
						)}
					</div>

					{/* Chat Sidebar */}
					<aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
						<div className="h-full rounded-lg border bg-card shadow-lg">
							<ChatContainer resumeId={resume.id} />
						</div>
					</aside>
				</div>

				{/* Footer */}
				<footer className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
					<p>
						Powered by{' '}
						<a href="/" className="font-medium text-primary hover:underline">
							ResumeChat
						</a>{' '}
						- AI-powered resume chat for recruiters
					</p>
				</footer>
			</div>
		</div>
	);
}
