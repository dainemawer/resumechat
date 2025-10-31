'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';

interface ChatContainerProps {
	resumeId: string;
	initialMessages?: Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
	}>;
}

export function ChatContainer({ resumeId, initialMessages = [] }: ChatContainerProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
		api: '/api/chat',
		body: {
			resumeId,
		},
		initialMessages,
	});

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b bg-muted/50 px-6 py-4">
				<h2 className="text-lg font-semibold">Chat with Resume</h2>
				<p className="text-sm text-muted-foreground">
					Ask questions about this candidate's experience and qualifications
				</p>
			</div>

			{/* Messages */}
			<div
				className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
				role="log"
				aria-live="polite"
				aria-label="Chat messages"
			>
				{messages.length === 0 && (
					<div className="flex h-full items-center justify-center">
						<div className="max-w-md space-y-4 text-center">
							<div className="mx-auto size-12 rounded-full bg-primary/10 p-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="size-6 text-primary"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
									/>
								</svg>
							</div>

							<div>
								<h3 className="font-semibold">Start a Conversation</h3>
								<p className="text-sm text-muted-foreground">
									Ask anything about this candidate's skills, experience, or qualifications.
								</p>
							</div>

							<div className="space-y-2 text-left text-sm text-muted-foreground">
								<p className="font-medium">Example questions:</p>
								<ul className="space-y-1 pl-4">
									<li>• What programming languages does this candidate know?</li>
									<li>• Tell me about their work experience</li>
									<li>• What are their key achievements?</li>
									<li>• Do they have leadership experience?</li>
								</ul>
							</div>
						</div>
					</div>
				)}

				{messages.map((message) => (
					<ChatMessage key={message.id} message={message} />
				))}

				{error && (
					<div
						className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
						role="alert"
						aria-live="assertive"
					>
						<p className="text-sm font-medium text-destructive">Error: {error.message}</p>
						<p className="text-xs text-destructive/80">Please try again or refresh the page.</p>
					</div>
				)}

				<div ref={messagesEndRef} aria-hidden="true" />
			</div>

			{/* Input */}
			<div className="border-t bg-muted/50 px-6 py-4">
				<ChatInput
					input={input}
					handleInputChange={handleInputChange}
					handleSubmit={handleSubmit}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}
