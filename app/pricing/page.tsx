import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

const tiers = [
	{
		name: 'Free',
		price: '$0',
		description: 'Perfect for trying out ResumeChat',
		features: [
			'1 resume upload',
			'50 chat interactions per month',
			'Public shareable link',
			'AI-powered responses',
			'"Made with ResumeChat" branding',
		],
		cta: 'Get Started',
		href: '/sign-up',
	},
	{
		name: 'Pro',
		price: '$10',
		period: '/month',
		description: 'For professionals who want unlimited access',
		features: [
			'Unlimited resume uploads',
			'Unlimited chat interactions',
			'Public shareable links',
			'Embed widget for your website',
			'Remove branding',
			'Chat analytics dashboard',
			'Priority support',
		],
		cta: 'Upgrade to Pro',
		href: '/api/stripe/create-checkout',
		popular: true,
	},
];

export default async function PricingPage() {
	const user = await currentUser();

	return (
		<main className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<Link href="/" className="text-xl font-bold">
						ResumeChat
					</Link>
					<nav className="flex items-center gap-4">
						{user ? (
							<Link
								href="/dashboard"
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								Dashboard
							</Link>
						) : (
							<>
								<Link href="/sign-in" className="text-sm font-medium hover:underline">
									Sign In
								</Link>
								<Link
									href="/sign-up"
									className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
								>
									Sign Up
								</Link>
							</>
						)}
					</nav>
				</div>
			</header>

			{/* Pricing Section */}
			<div className="container mx-auto px-4 py-16">
				<div className="mx-auto max-w-3xl text-center">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple, transparent pricing</h1>
					<p className="mt-4 text-lg text-muted-foreground">
						Choose the plan that's right for you. Upgrade or downgrade at any time.
					</p>
				</div>

				<div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
					{tiers.map((tier) => (
						<div
							key={tier.name}
							className={`relative rounded-lg border p-8 ${
								tier.popular ? 'border-primary shadow-lg ring-2 ring-primary' : 'border-border'
							}`}
						>
							{tier.popular && (
								<div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
									Most Popular
								</div>
							)}

							<div>
								<h3 className="text-2xl font-bold">{tier.name}</h3>
								<p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
								<p className="mt-4">
									<span className="text-4xl font-bold tracking-tight">{tier.price}</span>
									{tier.period && (
										<span className="text-base font-medium text-muted-foreground">{tier.period}</span>
									)}
								</p>
							</div>

							<ul className="mt-8 space-y-3">
								{tier.features.map((feature) => (
									<li key={feature} className="flex gap-3">
										<svg
											className="h-6 w-5 flex-none text-primary"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fillRule="evenodd"
												d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
												clipRule="evenodd"
											/>
										</svg>
										<span className="text-sm text-muted-foreground">{feature}</span>
									</li>
								))}
							</ul>

							<div className="mt-8">
								{user && tier.name === 'Pro' ? (
									<form action={tier.href} method="POST">
										<button
											type="submit"
											className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
										>
											{tier.cta}
										</button>
									</form>
								) : (
									<Link
										href={tier.href}
										className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
									>
										{tier.cta}
									</Link>
								)}
							</div>
						</div>
					))}
				</div>

				{/* FAQ */}
				<div className="mx-auto mt-24 max-w-3xl">
					<h2 className="text-3xl font-bold">Frequently asked questions</h2>
					<dl className="mt-10 space-y-8">
						<div>
							<dt className="text-lg font-semibold">Can I change plans later?</dt>
							<dd className="mt-2 text-muted-foreground">
								Yes! You can upgrade or downgrade your plan at any time from your dashboard. Changes take
								effect immediately.
							</dd>
						</div>
						<div>
							<dt className="text-lg font-semibold">What happens if I exceed the free tier limits?</dt>
							<dd className="mt-2 text-muted-foreground">
								You'll be prompted to upgrade to Pro for unlimited access. Your existing data and chat
								history will be preserved.
							</dd>
						</div>
						<div>
							<dt className="text-lg font-semibold">Can I cancel my subscription?</dt>
							<dd className="mt-2 text-muted-foreground">
								Yes, you can cancel anytime. You'll continue to have Pro access until the end of your
								billing period, then automatically downgrade to Free.
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</main>
	);
}
