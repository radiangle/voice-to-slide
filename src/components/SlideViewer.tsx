'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, RotateCcw, FileText, Presentation } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

interface SlideViewerProps {
  slides: Slide[];
  onReset: () => void;
}

export default function SlideViewer({ slides, onReset }: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slides }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'voice-to-slides.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice to Slides Presentation</title>
    <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css" rel="stylesheet">
    <style>
        .reveal .slides section {
            text-align: left;
        }
        .reveal h1, .reveal h2, .reveal h3 {
            text-align: center;
        }
        .speaker-notes {
            display: none;
        }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slides.map(slide => `
                <section>
                    <h2>${slide.title}</h2>
                    <div>${slide.content.replace(/\\n/g, '<br>')}</div>
                    <aside class="notes">
                        ${slide.speakerNotes}
                    </aside>
                </section>
            `).join('')}
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
    <script>
        Reveal.initialize({
            controls: true,
            progress: true,
            history: true,
            center: true,
            transition: 'slide'
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-to-slides.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Presentation</h2>
              <p className="text-blue-100">
                Slide {currentSlide + 1} of {slides.length}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="px-3 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={exportToHTML}
                className="px-3 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors"
                title="Export as HTML"
              >
                <Presentation className="w-4 h-4" />
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="px-3 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Export as PDF"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onReset}
                className="px-3 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors"
                title="Start Over"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide Content */}
        <div className="p-8">
          <div className="min-h-96 flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
              {slide.title}
            </h1>
            <div className="text-lg text-gray-700 leading-relaxed space-y-4">
              {slide.content.split('\\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Speaker Notes */}
        {showNotes && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Speaker Notes
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {slide.speakerNotes}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>
            
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={currentSlide === slides.length - 1}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}