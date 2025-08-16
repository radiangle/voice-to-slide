'use client';

import { useState } from 'react';
import AudioUploader from '@/components/AudioUploader';
import SlideViewer from '@/components/SlideViewer';

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAudioProcessed = (generatedSlides: Slide[]) => {
    setSlides(generatedSlides);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-black text-gray-800 mb-6 tracking-tight font-mono">
            Voice to Slide
          </h1>
          <p className="text-2xl font-medium text-gray-600 max-w-3xl mx-auto leading-relaxed tracking-wide">
            Transform your 3-minute voice recordings into professional slide presentations
          </p>
        </header>

        {slides.length === 0 ? (
          <AudioUploader 
            onProcessing={setIsProcessing} 
            onSlidesGenerated={handleAudioProcessed}
            isProcessing={isProcessing}
          />
        ) : (
          <SlideViewer 
            slides={slides} 
            onReset={() => setSlides([])}
          />
        )}
      </div>
    </div>
  );
}
