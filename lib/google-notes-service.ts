// lib/google-notes-service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AudioAnalysis } from './transcription-service';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export interface StructuredNotes {
  summary: string;
  keyPoints: string[];
  problems: {
    description: string;
    suggestions: string[];
  }[];
  actionItems: string[];
  topics?: string[];
  slides?: string[];
  participants?: string[];
  meetingType?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export async function generateStructuredNotes(
  transcription: string, 
  audioAnalysis?: AudioAnalysis
): Promise<StructuredNotes> {
  try {
    console.log('🤖 Generating structured notes with Google AI...');
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      }
    });

    const systemPrompt = `You are a professional meeting analyst. Analyze this meeting transcript and generate comprehensive, structured notes.

SPECIFIC FOCUS AREAS:
1. Identify main topics and themes discussed
2. Detect presentation slides or content mentioned
3. Extract key decisions and action items
4. Note any problems and provide practical solutions
5. Identify participants if mentioned
6. Determine meeting type and sentiment

AUDIO CONTEXT:
${audioAnalysis ? `
- Audio Quality: ${audioAnalysis.audioQuality}
- Duration: ${audioAnalysis.estimatedDuration || 'unknown'} minutes
- Speakers: ${audioAnalysis.speakerCount || 'unknown'}
- Language: ${audioAnalysis.language || 'unknown'}
` : ''}

REQUIRED JSON OUTPUT FORMAT:
{
  "summary": "A comprehensive 3-4 sentence overview of the entire meeting",
  "keyPoints": [
    "Most important topics and decisions",
    "Key insights and revelations", 
    "Critical information shared"
  ],
  "topics": [
    "Main topic 1 discussed",
    "Main topic 2 discussed",
    "Key theme identified"
  ],
  "slides": [
    "Slide/content topic 1 mentioned",
    "Slide/content topic 2 discussed",
    "Presentation elements referenced"
  ],
  "problems": [
    {
      "description": "Clear description of a challenge or obstacle discussed",
      "suggestions": [
        "Practical, actionable solution 1",
        "Specific, implementable solution 2",
        "Measurable, realistic solution 3"
      ]
    }
  ],
  "actionItems": [
    "Specific task with owner if mentioned (e.g., 'John to research pricing by Friday')",
    "Clear deliverables with deadlines",
    "Assigned responsibilities"
  ],
  "participants": ["Extracted participant names if clearly mentioned"],
  "meetingType": "brainstorming|decision-making|status-update|problem-solving|planning|presentation",
  "sentiment": "positive|neutral|negative|mixed"
}

GUIDELINES:
- Focus on actionable insights and practical next steps
- Extract participant names when clearly mentioned
- Identify presentation slides or content topics
- Note the main themes and discussion topics
- Be specific and concrete in action items
- Prioritize the most impactful points
- If slides are mentioned, capture their topics/content
- Group related topics together

Respond with ONLY the JSON object, no additional text or markdown formatting.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `MEETING TRANSCRIPT:\n\n${transcription}` }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean the response (remove markdown code blocks if present)
    const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
    
    console.log('📄 Raw AI response:', cleanText.substring(0, 200) + '...');
    
    const notes = JSON.parse(cleanText) as StructuredNotes;
    
    console.log('✅ Successfully parsed structured notes');
    return notes;

  } catch (error) {
    console.error('❌ Error generating structured notes:', error);
    
    // Return fallback notes in case of error
    return {
      summary: "Unable to generate detailed notes due to processing error.",
      keyPoints: [
        "Please check the audio quality and try again",
        "The transcription may contain insufficient content"
      ],
      topics: [],
      slides: [],
      problems: [],
      actionItems: [],
      meetingType: "unknown",
      sentiment: "neutral"
    };
  }
}