import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold">Get started</h1>
					<p className="mt-2 text-muted-foreground">
						Create your account and transform your resume into an interactive AI chat
					</p>
				</div>
				<SignUp
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
