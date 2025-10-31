import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserButton, auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { canUploadResume } from '@/lib/auth/check-subscription';
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
	// Check authentication
	const { userId } = await auth();
	if (!userId) {
		redirect('/sign-in');
	}

	const supabase = await createServerClient();

	// Fetch user data
	const { data: user } = await supabase.from('users').select('*').eq('clerk_id', userId).single();

	if (!user) {
		return <div>User not found</div>;
	}

	// Fetch user's resumes
	const { data: resumes } = await supabase
		.from('resumes')
		.select('id, summary, share_slug, file_name, is_public, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	// Fetch chat counts for each resume
	const resumeStats = await Promise.all(
		(resumes || []).map(async (resume) => {
			const { count } = await supabase
				.from('chats')
				.select('*', { count: 'exact', head: true })
				.eq('resume_id', resume.id);

			return { ...resume, chatCount: count || 0 };
		})
	);

	const isPro = user.subscription_tier === 'pro';
	const canUpload = canUploadResume(user, resumes?.length || 0);
	const maxResumes = isPro ? '∞' : '1';
	const maxChats = isPro ? '∞' : '50';

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<h1 className="text-xl font-bold">
						<Link href="/dashboard">ResumeChat</Link>
					</h1>
					<div className="flex items-center gap-4">
						<Link href="/pricing">
							<Button variant={isPro ? 'outline' : 'default'}>
								{isPro ? '✓ Pro Account' : 'Upgrade to Pro'}
							</Button>
						</Link>
						<UserButton />
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto max-w-6xl px-4 py-8">
				{/* Welcome Section */}
				<div className="mb-8">
					<h2 className="mb-2 text-3xl font-bold">Welcome back, {user.name || 'there'}!</h2>
					<p className="text-muted-foreground">Manage your resumes and track recruiter engagement.</p>
				</div>

				{/* Stats Grid */}
				<div className="mb-8 grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Your Plan</CardDescription>
							<CardTitle className="text-3xl">{isPro ? 'Pro' : 'Free'}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{isPro ? 'Unlimited features' : 'Limited features'}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Resumes</CardDescription>
							<CardTitle className="text-3xl">
								{resumes?.length || 0} / {maxResumes}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Uploaded resumes</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Chats</CardDescription>
							<CardTitle className="text-3xl">
								{resumeStats.reduce((sum, r) => sum + r.chatCount, 0)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Across all resumes</p>
						</CardContent>
					</Card>
				</div>

				{/* Resumes Section */}
				<div className="mb-8">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-2xl font-semibold">Your Resumes</h3>
						{canUpload && (
							<Link href="/dashboard/upload">
								<Button>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="mr-2 size-4"
										aria-hidden="true"
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Upload Resume
								</Button>
							</Link>
						)}
					</div>

					{!canUpload && !isPro && (
						<div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
							<p className="text-sm">
								You've reached the free tier limit.{' '}
								<Link href="/pricing" className="font-medium text-primary hover:underline">
									Upgrade to Pro
								</Link>{' '}
								for unlimited resumes.
							</p>
						</div>
					)}

					{resumeStats.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="mx-auto mb-4 size-12 text-muted-foreground"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
									/>
								</svg>
								<h3 className="mb-2 text-lg font-semibold">No resumes yet</h3>
								<p className="mb-4 text-sm text-muted-foreground">
									Upload your first resume to start chatting with recruiters.
								</p>
								<Link href="/dashboard/upload">
									<Button>Upload Your First Resume</Button>
								</Link>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{resumeStats.map((resume) => {
								const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/u/${resume.share_slug}`;
								const embedUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/embed/${resume.share_slug}`;

								return (
									<Card key={resume.id}>
										<CardHeader>
											<CardTitle className="flex items-start justify-between">
												<span className="line-clamp-2">{resume.file_name}</span>
												<span
													className={`ml-2 shrink-0 rounded-full px-2 py-1 text-xs ${resume.is_public ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}
												>
													{resume.is_public ? 'Public' : 'Private'}
												</span>
											</CardTitle>
											<CardDescription className="line-clamp-2">{resume.summary}</CardDescription>
										</CardHeader>
										<CardContent className="space-y-2">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
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
														d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
													/>
												</svg>
												<span>
													{resume.chatCount} {resume.chatCount === 1 ? 'chat' : 'chats'}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<input
													type="text"
													readOnly
													value={shareUrl}
													className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
													onClick={(e) => e.currentTarget.select()}
												/>
												<Button
													size="sm"
													variant="outline"
													onClick={() => navigator.clipboard.writeText(shareUrl)}
												>
													Copy
												</Button>
											</div>
											{isPro && (
												<details className="rounded-md border p-2">
													<summary className="cursor-pointer text-sm font-medium">Embed Code (Pro)</summary>
													<code className="mt-2 block rounded bg-muted p-2 text-xs">
														{`<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`}
													</code>
												</details>
											)}
										</CardContent>
										<CardFooter className="gap-2">
											<Link href={shareUrl} target="_blank" className="flex-1">
												<Button variant="outline" className="w-full">
													View Page
												</Button>
											</Link>
											<Button variant="ghost" size="sm" disabled>
												Delete
											</Button>
										</CardFooter>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
