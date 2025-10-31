import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold">Welcome back</h1>
					<p className="mt-2 text-muted-foreground">Sign in to access your AI-powered resume chat</p>
				</div>
				<SignIn
					appearance={{
						elements: {
							rootBox: 'mx-auto',
							card: 'shadow-none',
						},
					}}
				/>
			</div>
		</main>
	);
}
