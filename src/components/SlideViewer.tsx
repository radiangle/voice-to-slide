'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, RotateCcw, FileText, Presentation, Sparkles } from 'lucide-react';

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
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward' | 'none'>('none');

  const nextSlide = () => {
    setSlideDirection('forward');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setSlideDirection('backward');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setSlideDirection(index > currentSlide ? 'forward' : 'backward');
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setTimeout(() => setSlideDirection('none'), 300);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const generateFileName = (slides: Slide[]): string => {
    if (slides.length === 0) return 'voice-presentation';
    
    // Use the first slide title as base filename, with fallbacks
    const title = slides[0].title || 'Untitled Presentation';
    
    // Clean and format the title for filename
    let filename = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 40); // Reasonable length limit
    
    // If filename is empty or too short after cleaning, use meaningful fallback
    if (filename.length < 2) {
      filename = 'voice-presentation';
    }
    
    // Add short timestamp to make it unique
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
    
    return `${filename}-${timestamp}`;
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
      a.download = `${generateFileName(slides)}.pdf`;
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
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice to Slides Presentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f0f0f0;
            overflow: hidden;
        }
        
        .slideshow-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: white;
        }
        
        .slide {
            display: none;
            width: 100%;
            height: 100%;
            position: relative;
            background: white;
            padding: 60px;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }
        
        .slide.active {
            display: flex;
        }
        
        .slide-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 40px;
            color: white;
            text-align: center;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
        }
        
        .slide-title {
            font-size: 3rem;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slide-subtitle {
            font-size: 1.2rem;
            margin-top: 10px;
            opacity: 0.9;
        }
        
        .slide-content {
            max-width: 800px;
            text-align: center;
            margin-top: 120px;
        }
        
        .slide-content p {
            font-size: 1.8rem;
            line-height: 1.6;
            color: #333;
            margin-bottom: 30px;
        }
        
        .navigation {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
        }
        
        .nav-btn {
            padding: 15px 30px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
        }
        
        .nav-btn:hover {
            background: #2563eb;
        }
        
        .nav-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        
        .slide-counter {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 1000;
        }
        
        .slide-indicators {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .indicator.active {
            background: #3b82f6;
            transform: scale(1.3);
        }
    </style>
</head>
<body>
    <div class="slideshow-container">
        ${slides.map((slide, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
            <div class="slide-header" style="background: linear-gradient(135deg, ${
              ['#3b82f6, #8b5cf6, #ec4899', '#10b981, #3b82f6, #8b5cf6', '#f59e0b, #ef4444, #ec4899', '#6366f1, #8b5cf6, #ec4899'][index % 4]
            })">
                <h1 class="slide-title">${slide.title}</h1>
                <p class="slide-subtitle">Slide ${index + 1} of ${slides.length} • Generated from Voice</p>
            </div>
            <div class="slide-content">
                ${slide.content.split('\\n').filter(p => p.trim()).map(paragraph => {
                  if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
                    return `<p>• ${paragraph.replace(/^[•\-]\s*/, '').trim()}</p>`;
                  }
                  return `<p>${paragraph}</p>`;
                }).join('')}
            </div>
        </div>
        `).join('')}
    </div>
    
    <div class="slide-counter">
        <span id="current-slide">1</span> / ${slides.length}
    </div>
    
    <div class="slide-indicators">
        ${slides.map((_, index) => `<div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`).join('')}
    </div>
    
    <div class="navigation">
        <button class="nav-btn" id="prev-btn" onclick="previousSlide()">◀ Previous</button>
        <button class="nav-btn" id="next-btn" onclick="nextSlide()">Next ▶</button>
    </div>
    
    <script>
        let currentSlideIndex = 0;
        const totalSlides = ${slides.length};
        
        function showSlide(index) {
            // Hide all slides
            document.querySelectorAll('.slide').forEach(slide => {
                slide.classList.remove('active');
            });
            
            // Show current slide
            document.querySelector(\`[data-slide="\${index}"]\`).classList.add('active');
            
            // Update counter
            document.getElementById('current-slide').textContent = index + 1;
            
            // Update indicators
            document.querySelectorAll('.indicator').forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
            
            // Update navigation buttons
            document.getElementById('prev-btn').disabled = index === 0;
            document.getElementById('next-btn').disabled = index === totalSlides - 1;
        }
        
        function nextSlide() {
            if (currentSlideIndex < totalSlides - 1) {
                currentSlideIndex++;
                showSlide(currentSlideIndex);
            }
        }
        
        function previousSlide() {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                showSlide(currentSlideIndex);
            }
        }
        
        function goToSlide(index) {
            currentSlideIndex = index;
            showSlide(currentSlideIndex);
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                previousSlide();
            }
        });
        
        // Initialize
        showSlide(0);
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generateFileName(slides)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  const getSlideTheme = (index: number) => {
    const themes = [
      'from-blue-500 via-purple-500 to-pink-500',
      'from-green-400 via-blue-500 to-purple-600', 
      'from-yellow-400 via-red-500 to-pink-500',
      'from-indigo-500 via-purple-500 to-pink-500',
      'from-teal-400 via-blue-500 to-indigo-600',
      'from-orange-400 via-pink-500 to-red-500',
      'from-cyan-400 via-blue-500 to-purple-600'
    ];
    return themes[index % themes.length];
  };

  const renderContent = (content: string) => {
    const paragraphs = content.split('\\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
        const bulletText = paragraph.replace(/^[•\-]\s*/, '').trim();
        return (
          <div key={index} className="flex items-start justify-center space-x-4 mb-6 group">
            <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mt-2 group-hover:scale-110 transition-transform duration-200"></div>
            <p className="text-xl font-medium text-gray-700 leading-relaxed tracking-wide max-w-3xl">{bulletText}</p>
          </div>
        );
      }
      
      // Check if it's a heading (all caps or starts with number)
      if (paragraph.trim().match(/^[0-9]+\./) || paragraph.trim() === paragraph.trim().toUpperCase()) {
        return (
          <h3 key={index} className="text-2xl font-bold text-gray-800 mb-4 mt-8 first:mt-0 tracking-tight text-center">
            {paragraph}
          </h3>
        );
      }
      
      return (
        <p key={index} className="text-xl font-medium text-gray-700 leading-relaxed mb-6 tracking-wide text-center max-w-4xl mx-auto">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-gray-100">
        {/* Enhanced Header */}
        <div className={`bg-gradient-to-r ${getSlideTheme(currentSlide)} text-white p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Your Presentation</h2>
                <p className="text-white/80 text-sm font-medium tracking-wide">
                  Slide {currentSlide + 1} of {slides.length} • Generated from Voice
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 ${
                  showNotes 
                    ? 'bg-white/30 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
                title="Toggle Speaker Notes"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={exportToHTML}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                title="Export as HTML"
              >
                <Presentation className="w-5 h-5" />
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
                title="Export as PDF"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onReset}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                title="Start Over"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Slide Content */}
        <div className="relative overflow-hidden">
          <div 
            className={`transition-all duration-300 ease-in-out ${
              slideDirection === 'forward' ? 'animate-slide-in-right' : 
              slideDirection === 'backward' ? 'animate-slide-in-left' : ''
            }`}
          >
            <div className="p-16 min-h-[600px] relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-3">
                <div className={`absolute inset-0 bg-gradient-to-br ${getSlideTheme(currentSlide)}`}></div>
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)`,
                  backgroundSize: '60px 60px'
                }}></div>
              </div>
              
              <div className="relative z-10 flex flex-col justify-center min-h-[500px]">
                {/* Enhanced Title */}
                <div className="text-center mb-16">
                  <h1 className={`text-6xl font-black bg-gradient-to-r ${getSlideTheme(currentSlide)} bg-clip-text text-transparent mb-6 leading-tight tracking-tight font-mono`}>
                    {slide.title}
                  </h1>
                  <div className="w-32 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full shadow-lg"></div>
                </div>
                
                {/* Enhanced Content */}
                <div className="max-w-5xl mx-auto space-y-6">
                  <div className="prose prose-xl prose-gray max-w-none">
                    {renderContent(slide.content)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Speaker Notes */}
        {showNotes && (
          <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                  Speaker Notes
                </h3>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-white/50 shadow-lg">
                <p className="text-gray-700 leading-relaxed text-xl font-medium tracking-wide">
                  {slide.speakerNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Navigation */}
        <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex items-center px-8 py-4 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium tracking-wide"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </button>
            
            <div className="flex space-x-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    index === currentSlide 
                      ? `bg-gradient-to-r ${getSlideTheme(index)} shadow-lg scale-110` 
                      : 'bg-gray-300 hover:bg-gray-400 hover:scale-105'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="flex items-center px-8 py-4 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium tracking-wide"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}