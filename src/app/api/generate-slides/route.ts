import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription provided' },
        { status: 400 }
      );
    }

    const prompt = `
You are a professional presentation designer. Convert the following transcript into a structured slide presentation with at least 5 slides.

Transcript: "${transcription}"

Create a JSON response with the following structure:
{
  "slides": [
    {
      "id": 1,
      "title": "Slide Title",
      "content": "Main slide content with key points. Use \\n for line breaks.",
      "speakerNotes": "Detailed speaker notes for this slide"
    }
  ]
}

Requirements:
1. Create exactly 5-7 slides
2. First slide should be a title/introduction slide
3. Last slide should be a conclusion/summary slide  
4. Middle slides should cover main points from the transcript
5. Each slide should have concise, impactful content
6. Speaker notes should provide additional context and talking points
7. Use professional, clear language
8. Organize content logically with smooth transitions between slides

Return only valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional presentation designer who creates structured, engaging slide presentations from transcripts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const slideData = JSON.parse(responseText);
    
    // Validate the response structure
    if (!slideData.slides || !Array.isArray(slideData.slides)) {
      throw new Error('Invalid slide data structure');
    }

    // Ensure we have at least 5 slides
    if (slideData.slides.length < 5) {
      throw new Error('Generated fewer than 5 slides');
    }

    return NextResponse.json({
      slides: slideData.slides
    });

  } catch (error) {
    console.error('Slide generation error:', error);
    
    // Fallback slides in case of error
    const fallbackSlides: Slide[] = [
      {
        id: 1,
        title: "Welcome",
        content: "Thank you for using Voice to Slide\\n\\nYour presentation has been generated from your audio recording.",
        speakerNotes: "Welcome your audience and introduce the topic based on the audio content."
      },
      {
        id: 2,
        title: "Main Topic",
        content: "Key points from your recording:\\n\\n• Important insight 1\\n• Important insight 2\\n• Important insight 3",
        speakerNotes: "Discuss the main points that were identified in your audio recording."
      },
      {
        id: 3,
        title: "Supporting Details",
        content: "Additional information and context\\n\\nExpand on the key themes and provide supporting evidence.",
        speakerNotes: "Provide more detailed information and examples to support your main points."
      },
      {
        id: 4,
        title: "Key Insights",
        content: "Important takeaways:\\n\\n• Insight 1\\n• Insight 2\\n• Action items",
        speakerNotes: "Highlight the most important insights and any action items for your audience."
      },
      {
        id: 5,
        title: "Conclusion",
        content: "Thank you\\n\\nQuestions and Discussion",
        speakerNotes: "Summarize the key points and open the floor for questions and discussion."
      }
    ];

    return NextResponse.json({
      slides: fallbackSlides
    });
  }
}