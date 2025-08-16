import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Processing file:', audioFile.name, 'Type:', audioFile.type, 'Size:', audioFile.size);

    // Check if file has content
    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Empty audio file. Please try uploading again.' },
        { status: 400 }
      );
    }

    // Get file extension from name
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase();
    console.log('File extension:', fileExtension);

    // Normalize MIME type for better compatibility
    let mimeType = audioFile.type;
    if (fileExtension === 'm4a') {
      // OpenAI expects 'audio/m4a', not 'audio/x-m4a'
      mimeType = 'audio/m4a';
    } else if (fileExtension === 'mp3') {
      mimeType = 'audio/mpeg';
    } else if (fileExtension === 'wav') {
      mimeType = 'audio/wav';
    } else if (fileExtension === 'ogg') {
      mimeType = 'audio/ogg';
    }

    // Convert to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'Failed to read audio file content.' },
        { status: 400 }
      );
    }
    
    const buffer = Buffer.from(arrayBuffer);

    // Create file with normalized MIME type
    const file = new File([buffer], audioFile.name, {
      type: mimeType,
    });

    console.log('Sending to OpenAI - Name:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({
      transcription: transcription.text,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try a different audio format.' },
      { status: 500 }
    );
  }
}