import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'ResumeChat - Transform Your Resume into an AI Chat Experience',
	description:
		'Upload your resume and create an interactive AI-powered chat interface that recruiters can engage with. Stand out with ResumeChat.',
	keywords: ['resume', 'ai', 'chat', 'job search', 'recruiting', 'career'],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
			</html>
		</ClerkProvider>
	);
}
