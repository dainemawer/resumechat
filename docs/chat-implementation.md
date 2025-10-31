# Chat Implementation

## Overview

ResumeChat's chat interface is built using patterns from the [Vercel Chat SDK](https://vercel.com/blog/introducing-chat-sdk), leveraging the Vercel AI SDK for streaming responses and state management.

## Architecture

### Chat Flow

```
User Input → API Route → Vector Search → Context Building → OpenAI → Stream Response → UI Update
```

### Key Components

1. **useChat Hook** - State management and API communication
2. **ChatInterface** - Main container component
3. **ChatMessage** - Individual message display
4. **ChatInput** - Message input with keyboard shortcuts
5. **Vector Search** - Context retrieval from embeddings

## Implementation

### API Route

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createServerClient } from '@/lib/supabase/server';
import { searchResumeContext } from '@/lib/openai/vector-search';

export async function POST(req: Request) {
	try {
		const { messages, resumeId, shareSlug } = await req.json();
		const lastMessage = messages[messages.length - 1];

		// Get resume and user info
		const supabase = createServerClient();
		const { data: resume } = await supabase
			.from('resumes')
			.select('*, users(*)')
			.or(`id.eq.${resumeId},share_slug.eq.${shareSlug}`)
			.single();

		if (!resume) {
			return new Response('Resume not found', { status: 404 });
		}

		// Check rate limits
		await checkChatLimits(resume.users);

		// Perform vector search for relevant context
		const context = await searchResumeContext(
			resume.id,
			lastMessage.content
		);

		// Build system prompt with context
		const systemPrompt = buildSystemPrompt(resume, context);

		// Stream response
		const result = streamText({
			model: openai('gpt-4-turbo'),
			system: systemPrompt,
			messages,
			maxTokens: 500,
			temperature: 0.7,
		});

		// Store chat interaction
		await supabase.from('chats').insert({
			resume_id: resume.id,
			question: lastMessage.content,
			answer: result.text,
		});

		// Increment chat count for rate limiting
		await incrementChatCount(resume.user_id);

		return result.toDataStreamResponse();
	} catch (error) {
		console.error('Chat error:', error);
		return new Response('Internal server error', { status: 500 });
	}
}
```

### Chat Interface Component

```typescript
// components/chat/ChatInterface.tsx
'use client';

import { useChat } from 'ai/react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatLimitBanner } from './ChatLimitBanner';

interface ChatInterfaceProps {
	resumeId?: string;
	shareSlug?: string;
	initialMessages?: Message[];
}

export function ChatInterface({
	resumeId,
	shareSlug,
	initialMessages = [],
}: ChatInterfaceProps) {
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		error,
	} = useChat({
		api: '/api/chat',
		body: {
			resumeId,
			shareSlug,
		},
		initialMessages,
		onError: (error) => {
			console.error('Chat error:', error);
		},
	});

	return (
		<div className="flex flex-col h-full">
			{/* Chat limit banner */}
			<ChatLimitBanner />

			{/* Message history */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="text-center text-muted-foreground">
						<p>Ask me anything about this resume!</p>
					</div>
				) : (
					messages.map((message) => (
						<ChatMessage
							key={message.id}
							message={message}
							isLoading={isLoading && message.id === messages[messages.length - 1].id}
						/>
					))
				)}
			</div>

			{/* Input */}
			<ChatInput
				value={input}
				onChange={handleInputChange}
				onSubmit={handleSubmit}
				isLoading={isLoading}
				disabled={isLoading}
			/>

			{/* Error display */}
			{error && (
				<div role="alert" className="p-4 bg-destructive/10 text-destructive">
					{error.message}
				</div>
			)}
		</div>
	);
}
```

### Chat Message Component

```typescript
// components/chat/ChatMessage.tsx
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MessageMarkdown } from './MessageMarkdown';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessageProps {
	message: {
		id: string;
		role: 'user' | 'assistant';
		content: string;
	};
	isLoading?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
	message,
	isLoading,
}: ChatMessageProps) {
	const isUser = message.role === 'user';

	return (
		<div
			className={cn(
				'flex w-full',
				isUser ? 'justify-end' : 'justify-start'
			)}
		>
			<div
				className={cn(
					'max-w-[80%] rounded-lg px-4 py-2',
					isUser
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-foreground'
				)}
			>
				{isLoading ? (
					<TypingIndicator />
				) : (
					<MessageMarkdown content={message.content} />
				)}
			</div>
		</div>
	);
});
```

### Chat Input Component

```typescript
// components/chat/ChatInput.tsx
'use client';

import { FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onSubmit: (e: FormEvent) => void;
	isLoading: boolean;
	disabled?: boolean;
}

export function ChatInput({
	value,
	onChange,
	onSubmit,
	isLoading,
	disabled,
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [value]);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		// Submit on Enter (without Shift)
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (value.trim() && !isLoading) {
				onSubmit(e as unknown as FormEvent);
			}
		}
	};

	return (
		<form onSubmit={onSubmit} className="border-t p-4">
			<div className="flex gap-2">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={onChange}
					onKeyDown={handleKeyDown}
					placeholder="Ask about this resume..."
					disabled={disabled}
					rows={1}
					className="flex-1 resize-none rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
					aria-label="Chat message"
				/>
				<Button
					type="submit"
					disabled={!value.trim() || isLoading || disabled}
					size="icon"
					aria-label="Send message"
				>
					<Send className="h-4 w-4" />
				</Button>
			</div>
			<p className="mt-2 text-xs text-muted-foreground">
				Press Enter to send, Shift+Enter for new line
			</p>
		</form>
	);
}
```

## Vector Search Implementation

```typescript
// lib/openai/vector-search.ts
import { createServerClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function searchResumeContext(
	resumeId: string,
	query: string
): Promise<string[]> {
	// Generate embedding for the query
	const embeddingResponse = await openai.embeddings.create({
		model: 'text-embedding-3-small',
		input: query,
	});

	const queryEmbedding = embeddingResponse.data[0].embedding;

	// Search for similar chunks
	const supabase = createServerClient();
	const { data, error } = await supabase.rpc('match_resume_chunks', {
		query_embedding: queryEmbedding,
		match_resume_id: resumeId,
		match_threshold: 0.7,
		match_count: 5,
	});

	if (error) {
		console.error('Vector search error:', error);
		return [];
	}

	return data.map((chunk) => chunk.content);
}
```

## System Prompt Engineering

```typescript
// lib/prompts/resume-chat.ts
export function buildSystemPrompt(
	resume: Resume,
	contextChunks: string[]
): string {
	return `You are ResumeChat, an AI assistant that answers questions about a person's resume.

IMPORTANT RULES:
1. Only answer based on the information provided in the resume context below
2. If information is not in the resume, say "That detail wasn't provided in the resume"
3. Be conversational but professional
4. Highlight key strengths and relevant experience
5. Keep responses concise (2-3 sentences unless more detail is requested)

RESUME SUMMARY:
${resume.summary}

RELEVANT CONTEXT:
${contextChunks.join('\n\n')}

PARSED RESUME DATA:
Skills: ${resume.parsed_json.skills.join(', ')}
Experience: ${resume.parsed_json.experience.length} positions
Education: ${resume.parsed_json.education.map((e) => e.degree).join(', ')}

Answer questions naturally while staying grounded in the resume content provided above.`;
}
```

## Rate Limiting

```typescript
// lib/chat/limit-check.ts
import { createServerClient } from '@/lib/supabase/server';

export async function checkChatLimits(user: User) {
	if (user.subscription_tier === 'pro') {
		return; // No limits for pro users
	}

	// Check if user has exceeded free tier limits
	const limit = 50; // 50 chats per month for free tier
	
	if (user.chat_count >= limit) {
		throw new Error('Chat limit exceeded. Please upgrade to Pro for unlimited chats.');
	}
}

export async function incrementChatCount(userId: string) {
	const supabase = createServerClient();
	
	await supabase.rpc('increment_chat_count', {
		user_id: userId,
	});
}
```

## Accessibility Features

### ARIA Live Regions

```typescript
// Announce new messages to screen readers
<div aria-live="polite" aria-atomic="true" className="sr-only">
	{messages.length > 0 && messages[messages.length - 1].content}
</div>
```

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line
- **Escape**: Clear input (future)
- **Tab**: Navigate between elements

## Best Practices

### Performance
- Stream responses for perceived speed
- Debounce input for auto-save (future)
- Lazy load message history
- Optimize vector search with proper indexing

### UX
- Show typing indicator during loading
- Display error messages clearly
- Provide keyboard shortcuts
- Auto-scroll to new messages
- Save conversation history

### Security
- Rate limit chat requests
- Validate input length
- Sanitize markdown output
- Prevent prompt injection
- Log chat interactions for debugging

## Future Enhancements

1. **Conversation Memory** - Multi-turn context awareness
2. **Suggested Questions** - Pre-populated questions
3. **Voice Input** - Speech-to-text integration
4. **Export Chat** - Download conversation
5. **Share Chat** - Shareable chat links
6. **Analytics** - Track popular questions
7. **Multi-language** - Support for multiple languages

## Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Chat SDK Blog Post](https://vercel.com/blog/introducing-chat-sdk)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Streaming in Next.js](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

