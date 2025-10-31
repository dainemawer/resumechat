import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { parsePDF } from '@/lib/parsers/pdf-parser';
import { parseDOCX } from '@/lib/parsers/docx-parser';
import { structureResumeData } from '@/lib/openai/structure-resume';
import { generateSlug } from '@/lib/utils/slug';
import { validateResumeFile } from '@/lib/validations/file';
import { canUploadResume } from '@/lib/auth/check-subscription';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
	try {
		// Check authentication
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user from database
		const supabase = await createServerClient();
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('clerk_id', userId)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check if user can upload (based on subscription and current count)
		const { count: resumeCount } = await supabase
			.from('resumes')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id);

		if (!canUploadResume(user, resumeCount || 0)) {
			return NextResponse.json(
				{
					error: 'Upload limit reached. Please upgrade to Pro for unlimited uploads.',
				},
				{ status: 403 }
			);
		}

		// Parse form data
		const formData = await req.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file
		const validation = validateResumeFile(file);
		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Parse file based on type
		let rawText: string;
		try {
			if (file.type === 'application/pdf') {
				rawText = await parsePDF(buffer);
			} else {
				rawText = await parseDOCX(buffer);
			}
		} catch (error) {
			console.error('Error parsing file:', error);
			return NextResponse.json(
				{ error: 'Failed to parse file. Please ensure it is a valid resume file.' },
				{ status: 400 }
			);
		}

		// Check if text was extracted
		if (!rawText || rawText.length < 100) {
			return NextResponse.json(
				{ error: 'Could not extract enough text from file. Please try a different format.' },
				{ status: 400 }
			);
		}

		// Structure data using OpenAI
		let structured;
		try {
			structured = await structureResumeData(rawText);
		} catch (error) {
			console.error('Error structuring resume:', error);
			return NextResponse.json(
				{ error: 'Failed to analyze resume. Please try again.' },
				{ status: 500 }
			);
		}

		// Generate unique share slug
		const shareSlug = generateSlug(user.name || undefined);

		// If user already has a resume, delete it first (free tier limit)
		if (user.subscription_tier === 'free' && resumeCount && resumeCount > 0) {
			await supabase.from('resumes').delete().eq('user_id', user.id);
		}

		// Insert resume into database
		const { data: resume, error: insertError } = await supabase
			.from('resumes')
			.insert({
				user_id: user.id,
				raw_text: rawText,
				parsed_json: structured.parsedData,
				summary: structured.summary,
				share_slug: shareSlug,
				file_name: file.name,
			})
			.select()
			.single();

		if (insertError || !resume) {
			console.error('Error inserting resume:', insertError);
			return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
		}

		// Return success response
		return NextResponse.json({
			success: true,
			resumeId: resume.id,
			shareSlug: resume.share_slug,
			summary: resume.summary,
			parsedData: resume.parsed_json,
		});
	} catch (error) {
		console.error('Error in resume upload:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
