import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { buildContext, vectorSearch } from '@/lib/search/vector-search';
import { createServerClient } from '@/lib/supabase/server';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	try {
		// Parse request body
		const { messages, resumeId } = await req.json();

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response('Messages are required', { status: 400 });
		}

		if (!resumeId) {
			return new Response('Resume ID is required', { status: 400 });
		}

		// Get the latest user message
		const latestMessage = messages[messages.length - 1];
		if (!latestMessage || latestMessage.role !== 'user') {
			return new Response('Latest message must be from user', { status: 400 });
		}

		// Fetch resume and owner information
		const supabase = await createServerClient();
		const { data: resume, error: resumeError } = await supabase
			.from('resumes')
			.select('id, user_id, summary, parsed_json, users!inner(*)')
			.eq('id', resumeId)
			.single();

		if (resumeError || !resume) {
			return new Response('Resume not found', { status: 404 });
		}

		// Check chat limits for resume owner
		const owner = resume.users;
		const { count: chatCount } = await supabase
			.from('chats')
			.select('*', { count: 'exact', head: true })
			.eq('resume_id', resumeId);

		// Check if owner can still receive chats
		const maxChats = owner.subscription_tier === 'pro' ? Number.POSITIVE_INFINITY : 50;
		if (chatCount && chatCount >= maxChats) {
			return new Response('Chat limit reached for this resume. Owner needs to upgrade to Pro.', {
				status: 403,
			});
		}

		// Perform vector search to find relevant context
		const searchResults = await vectorSearch(resumeId, latestMessage.content, 5);
		const context = buildContext(searchResults);

		// Build system prompt with context
		const systemPrompt = `You are an AI assistant helping recruiters learn about a job candidate through their resume. 

Here is the candidate's summary:
${resume.summary}

Here are relevant details from their resume based on the current question:
${context}

Guidelines:
- Answer questions based ONLY on the information provided in the resume context
- Be professional, concise, and helpful
- If information isn't available in the resume, politely say you don't have that information
- Don't make assumptions or add information not present in the resume
- Highlight relevant skills, experiences, and qualifications
- Use a friendly but professional tone
- Keep responses focused and to the point`;

		// Store the chat interaction (before streaming response)
		await supabase.from('chats').insert({
			resume_id: resumeId,
			message: latestMessage.content,
		});

		// Create streaming response using Vercel AI SDK
		const result = streamText({
			model: openai('gpt-4-turbo'),
			messages: [
				{ role: 'system', content: systemPrompt },
				...messages.filter((msg: { role: string }) => msg.role !== 'system'),
			],
			temperature: 0.7,
			maxTokens: 500,
		});

		// Return streaming response
		return result.toDataStreamResponse();
	} catch (error) {
		console.error('Error in chat API:', error);
		return new Response('Internal server error', { status: 500 });
	}
}
