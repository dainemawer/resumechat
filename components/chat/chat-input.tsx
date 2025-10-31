'use client';

import type { FormEvent } from 'react';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
	isLoading: boolean;
	disabled?: boolean;
	placeholder?: string;
}

export function ChatInput({
	input,
	handleInputChange,
	handleSubmit,
	isLoading,
	disabled = false,
	placeholder = 'Ask about this candidate...',
}: ChatInputProps) {
	return (
		<form onSubmit={handleSubmit} className="flex w-full gap-2">
			<label htmlFor="chat-input" className="sr-only">
				Message
			</label>

			<textarea
				id="chat-input"
				name="message"
				value={input}
				onChange={handleInputChange}
				placeholder={placeholder}
				disabled={disabled || isLoading}
				rows={1}
				className={cn(
					'min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3',
					'text-sm placeholder:text-muted-foreground',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
					'disabled:cursor-not-allowed disabled:opacity-50',
					'transition-all duration-200'
				)}
				onKeyDown={(e) => {
					// Submit on Enter, newline on Shift+Enter
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
					}
				}}
				aria-label="Chat message input"
				aria-describedby="chat-input-hint"
			/>

			<span id="chat-input-hint" className="sr-only">
				Press Enter to send, Shift+Enter for new line
			</span>

			<button
				type="submit"
				disabled={disabled || isLoading || !input.trim()}
				className={cn(
					'inline-flex h-[44px] items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground',
					'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					'disabled:pointer-events-none disabled:opacity-50',
					'transition-colors duration-200'
				)}
				aria-label={isLoading ? 'Sending message...' : 'Send message'}
			>
				{isLoading ? (
					<>
						<svg
							className="-ml-1 mr-2 size-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Sending...
					</>
				) : (
					'Send'
				)}
			</button>
		</form>
	);
}
