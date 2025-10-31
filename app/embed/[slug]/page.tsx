import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ChatContainer } from '@/components/chat';
import { canAccessEmbed } from '@/lib/auth/check-subscription';
import { createServerClient } from '@/lib/supabase/server';

interface PageProps {
	params: Promise<{
		slug: string;
	}>;
}

export const metadata: Metadata = {
	title: 'Resume Chat | ResumeChat',
	robots: {
		index: false,
		follow: false,
	},
};

export default async function EmbedResumePage({ params }: PageProps) {
	const { slug } = await params;
	const supabase = await createServerClient();

	// Fetch resume by slug
	const { data: resume, error } = await supabase
		.from('resumes')
		.select('id, user_id, users!inner(*)')
		.eq('share_slug', slug)
		.eq('is_public', true)
		.single();

	if (error || !resume) {
		notFound();
	}

	const owner = resume.users;

	// Check if owner has Pro subscription (required for embed feature)
	if (!canAccessEmbed(owner)) {
		// Redirect to regular share page for free users
		redirect(`/u/${slug}`);
	}

	return (
		<div className="h-screen w-full bg-background">
			<ChatContainer resumeId={resume.id} />
		</div>
	);
}
