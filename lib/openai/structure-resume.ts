import OpenAI from 'openai';
import type { ParsedResumeData } from '@/lib/supabase/types';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Use GPT to extract structured data from resume text
 * @param rawText - Raw text extracted from resume
 * @returns Structured resume data
 */
export async function structureResumeData(rawText: string): Promise<{
	summary: string;
	parsedData: ParsedResumeData;
}> {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4-turbo',
			messages: [
				{
					role: 'system',
					content: `You are a resume parser. Extract structured information from the resume text.
Return a JSON object with this exact structure:
{
  "summary": "A 2-3 sentence professional summary of the candidate's experience and key strengths",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "years": "2020-2023 or Present",
      "description": "Brief description of role and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Graduation Year or Expected"
    }
  ]
}

Focus on:
- Extract ALL skills mentioned (technical and soft skills)
- List experience in reverse chronological order
- Include education details
- Create a compelling summary highlighting key strengths`,
				},
				{
					role: 'user',
					content: `Parse this resume:\n\n${rawText}`,
				},
			],
			response_format: { type: 'json_object' },
			temperature: 0.3,
		});

		const content = completion.choices[0]?.message?.content;
		if (!content) {
			throw new Error('No response from OpenAI');
		}

		const parsed = JSON.parse(content);

		// Validate and return
		return {
			summary: parsed.summary || 'No summary available',
			parsedData: {
				skills: Array.isArray(parsed.skills) ? parsed.skills : [],
				experience: Array.isArray(parsed.experience) ? parsed.experience : [],
				education: Array.isArray(parsed.education) ? parsed.education : [],
			},
		};
	} catch (error) {
		console.error('Error structuring resume data:', error);
		throw new Error('Failed to analyze resume. Please try again.');
	}
}
