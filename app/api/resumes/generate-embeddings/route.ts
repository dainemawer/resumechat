import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { chunkText } from '@/lib/embeddings/chunk-text';
import { generateEmbeddingsBatch } from '@/lib/embeddings/generate-embeddings';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
	try {
		// Check authentication
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get resume ID from request
		const { resumeId } = await req.json();
		if (!resumeId) {
			return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
		}

		// Get resume from database
		const supabase = await createServerClient();
		const { data: resume, error: resumeError } = await supabase
			.from('resumes')
			.select('*, users!inner(clerk_id)')
			.eq('id', resumeId)
			.single();

		if (resumeError || !resume) {
			return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
		}

		// Check ownership
		if (resume.users.clerk_id !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Check if embeddings already exist
		const { count: existingCount } = await supabase
			.from('embeddings')
			.select('*', { count: 'exact', head: true })
			.eq('resume_id', resumeId);

		if (existingCount && existingCount > 0) {
			return NextResponse.json(
				{
					message: 'Embeddings already exist for this resume',
					count: existingCount,
				},
				{ status: 200 }
			);
		}

		// Chunk the resume text
		const chunks = chunkText(resume.raw_text);

		if (chunks.length === 0) {
			return NextResponse.json({ error: 'No text to embed' }, { status: 400 });
		}

		// Generate embeddings for all chunks
		let embeddings: number[][];
		try {
			embeddings = await generateEmbeddingsBatch(chunks);
		} catch (error) {
			console.error('Error generating embeddings:', error);
			return NextResponse.json({ error: 'Failed to generate embeddings' }, { status: 500 });
		}

		// Store embeddings in database
		const embeddingsToInsert = chunks.map((chunk, index) => ({
			resume_id: resumeId,
			chunk_text: chunk,
			chunk_index: index,
			embedding: embeddings[index],
		}));

		const { error: insertError } = await supabase.from('embeddings').insert(embeddingsToInsert);

		if (insertError) {
			console.error('Error storing embeddings:', insertError);
			return NextResponse.json({ error: 'Failed to store embeddings' }, { status: 500 });
		}

		// Return success
		return NextResponse.json({
			success: true,
			chunksProcessed: chunks.length,
			message: 'Embeddings generated successfully',
		});
	} catch (error) {
		console.error('Error in generate embeddings:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
