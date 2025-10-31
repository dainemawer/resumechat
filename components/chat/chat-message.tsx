'use client';

import type { Message } from 'ai';
import { cn } from '@/lib/utils/cn';

interface ChatMessageProps {
	message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === 'user';

	return (
		<div
			className={cn('flex w-full gap-3 rounded-lg p-4', isUser ? 'bg-primary/10' : 'bg-secondary/50')}
			role="article"
			aria-label={`${isUser ? 'Your' : 'AI'} message`}
		>
			<div
				className={cn(
					'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
					isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
				)}
				aria-hidden="true"
			>
				{isUser ? 'You' : 'AI'}
			</div>

			<div className="flex-1 space-y-2">
				<div className="prose prose-sm max-w-none dark:prose-invert">
					<p className="m-0 whitespace-pre-wrap break-words">{message.content}</p>
				</div>

				{message.createdAt && (
					<time
						dateTime={new Date(message.createdAt).toISOString()}
						className="block text-xs text-muted-foreground"
					>
						{new Date(message.createdAt).toLocaleTimeString()}
					</time>
				)}
			</div>
		</div>
	);
}
