# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice-to-Slide is a Next.js application that converts 3-minute voice recordings into professional slide presentations. Users can either record audio directly in the browser or upload audio files, which are then processed using OpenAI's Whisper for transcription and GPT-4 for slide generation.

## Architecture

**Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and React components
- `src/app/page.tsx`: Main application entry point with state management
- `src/components/AudioUploader.tsx`: Handles audio recording and file upload
- `src/components/SlideViewer.tsx`: Displays generated slides with navigation and export

**API Routes**: Serverless functions optimized for Vercel
- `/api/transcribe`: OpenAI Whisper integration for speech-to-text
- `/api/generate-slides`: GPT-4 powered slide generation from transcripts  
- `/api/export-pdf`: Puppeteer-based PDF export functionality

**Key Data Flow**: Audio → Transcription → AI Slide Generation → Presentation Display

## Development Commands

**Start development server**: `npm run dev`
**Build for production**: `npm run build` 
**Type checking**: `npm run type-check` (if available)
**Linting**: `npm run lint`

## Environment Setup

Required environment variables in `.env.local`:
- `OPENAI_API_KEY`: OpenAI API key for Whisper and GPT-4
- `NEXT_PUBLIC_APP_URL`: Application URL (localhost:3000 for development)

## Key Dependencies

- `openai`: OpenAI API client for Whisper transcription and GPT-4 slide generation
- `puppeteer`: PDF export functionality via headless Chrome
- `lucide-react`: Icon components for UI
- `formidable`: File upload handling in API routes

## Deployment

Configured for Vercel with `vercel.json` specifying extended timeout limits for AI processing endpoints. The application uses Vercel's serverless functions with optimized Puppeteer configuration for PDF generation.