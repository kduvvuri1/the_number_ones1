// lib/transcription-service.ts
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export interface AudioAnalysis {
  hasAudio: boolean;
  audioQuality: 'excellent' | 'good' | 'poor' | 'silent';
  issues: string[];
  estimatedDuration?: number;
  speakerCount?: number;
  language?: string;
}

export async function transcribeAudio(audioUrl: string): Promise<{
  transcription: string;
  analysis: AudioAnalysis;
}> {
  try {
    if (!audioUrl || !audioUrl.startsWith("http")) {
      return {
        transcription: "This file doesn't contain any processable audio content.",
        analysis: {
          hasAudio: false,
          audioQuality: 'silent',
          issues: ['Invalid audio URL', 'No accessible audio content'],
          estimatedDuration: 0
        }
      };
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4000,
      }
    });

    // Combined prompt for analysis and transcription
    const prompt = `
    TASK: Analyze this audio file and provide both a quality assessment and a detailed transcription.

    AUDIO URL: ${audioUrl}

    STEP 1 - AUDIO ANALYSIS:
    Analyze the audio quality and provide this exact JSON structure:
    {
      "hasAudio": boolean,
      "audioQuality": "excellent" | "good" | "poor" | "silent",
      "issues": string[],
      "estimatedDuration": number,
      "speakerCount": number,
      "language": string
    }

    STEP 2 - TRANSCRIPTION:
    If hasAudio is true, provide a clean, accurate transcription with:
    - All spoken words exactly as said
    - Speaker changes marked with [Speaker X] when detectable  
    - Natural flow without excessive filler words
    - Paragraphs for topic changes
    - [unclear] or [inaudible] for unclear sections
    - Important emotional tone if noticeable

    RESPONSE FORMAT:
    First, provide the JSON analysis object.
    Then, if there is audio content, provide the transcription after "TRANSCRIPTION:".
    If no audio, just provide the JSON.

    Now analyze this audio file and respond accordingly.
    `;

    console.log('🎵 Processing audio file...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let analysis: AudioAnalysis;
    let transcription = "No transcription available.";

    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
        
        // Extract transcription if present
        const transMatch = text.split('TRANSCRIPTION:');
        if (transMatch.length > 1) {
          transcription = cleanTranscription(transMatch[1]);
        } else if (analysis.hasAudio && analysis.audioQuality !== 'silent') {
          // If analysis says there's audio but no transcription section, use the text after JSON
          transcription = cleanTranscription(text.replace(jsonMatch[0], '').trim());
        }
      } catch (parseError) {
        console.error('Failed to parse audio analysis:', parseError);
        analysis = {
          hasAudio: false,
          audioQuality: 'silent',
          issues: ['Failed to analyze audio content'],
          estimatedDuration: 0
        };
      }
    } else {
      // Fallback analysis
      analysis = {
        hasAudio: false,
        audioQuality: 'silent',
        issues: ['Could not analyze audio file'],
        estimatedDuration: 0
      };
    }

    console.log('✅ Audio processing complete');
    console.log('Analysis:', analysis);
    console.log('Transcription length:', transcription.length);

    return {
      transcription,
      analysis
    };
  } catch (error: any) {
    console.error('❌ Transcription error:', error);
    
    const errorAnalysis: AudioAnalysis = {
      hasAudio: false,
      audioQuality: 'silent',
      issues: [
        'Transcription failed',
        error.message || 'Unknown error during processing'
      ],
      estimatedDuration: 0
    };

    return {
      transcription: "Unable to process audio content due to technical issues.",
      analysis: errorAnalysis
    };
  }
}

function cleanTranscription(text: string): string {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}