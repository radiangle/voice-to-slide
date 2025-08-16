import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const { slides }: { slides: Slide[] } = await request.json();

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { error: 'No slides provided' },
        { status: 400 }
      );
    }

    const getSlideTheme = (index: number) => {
      const themes = [
        { primary: '#3b82f6', secondary: '#8b5cf6', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)' },
        { primary: '#10b981', secondary: '#3b82f6', gradient: 'linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)' },
        { primary: '#f59e0b', secondary: '#ef4444', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)' },
        { primary: '#6366f1', secondary: '#8b5cf6', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)' },
        { primary: '#06b6d4', secondary: '#3b82f6', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)' },
        { primary: '#f97316', secondary: '#ec4899', gradient: 'linear-gradient(135deg, #f97316, #ec4899, #ef4444)' },
        { primary: '#06b6d4', secondary: '#3b82f6', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' }
      ];
      return themes[index % themes.length];
    };

    // Generate HTML content for PDF with proper 16:9 sizing
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice to Slides Presentation</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: white;
        }
        
        .slide {
            width: 1122px;  /* 16:9 ratio: width */
            height: 631px;  /* 16:9 ratio: height */
            page-break-after: always;
            display: flex;
            flex-direction: column;
            position: relative;
            background: white;
            overflow: hidden;
            padding: 40px;
            box-sizing: border-box;
        }
        
        .slide:last-child {
            page-break-after: auto;
        }
        
        .slide-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 30px;
            color: white;
            text-align: center;
            z-index: 10;
        }
        
        .slide-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            letter-spacing: -0.02em;
        }
        
        .slide-subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 10px;
            font-weight: 500;
        }
        
        .slide-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-top: 140px;
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        
        .slide-content p {
            font-size: 1.3rem;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 20px;
            font-weight: 500;
            letter-spacing: -0.01em;
        }
        
        .slide-content .bullet-point {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
            text-align: left;
            justify-content: center;
            gap: 12px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 16px;
        }
        
        .slide-content .bullet-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            margin-top: 10px;
            flex-shrink: 0;
        }
        
        .slide-content .bullet-point p {
            font-size: 1.3rem;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            font-weight: 500;
        }
        
        .slide-content .slide-subheading {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1f2937;
            margin: 24px 0 16px 0;
            letter-spacing: -0.02em;
        }
        
        .speaker-notes {
            position: absolute;
            bottom: 40px;
            left: 40px;
            right: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-left: 4px solid #3b82f6;
            border-radius: 12px;
            font-size: 0.9rem;
            color: #475569;
        }
        
        .speaker-notes-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .slide-number {
            position: absolute;
            bottom: 15px;
            right: 20px;
            font-size: 0.8rem;
            color: #64748b;
            font-weight: 500;
        }
        
        .decorative-line {
            width: 80px;
            height: 4px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            margin: 20px auto;
            border-radius: 2px;
        }
        
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    ${slides.map((slide, index) => {
      const theme = getSlideTheme(index);
      
      const renderSlideContent = (content: string) => {
        return content.split('\\n').filter(p => p.trim()).map(paragraph => {
          if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
            const bulletText = paragraph.replace(/^[•\-]\s*/, '').trim();
            return `
              <div class="bullet-point">
                <div class="bullet-dot"></div>
                <p>${bulletText}</p>
              </div>
            `;
          }
          if (paragraph.trim().match(/^[0-9]+\./) || paragraph.trim() === paragraph.trim().toUpperCase()) {
            return `<h3 class="slide-subheading">${paragraph}</h3>`;
          }
          return paragraph.trim() ? `<p>${paragraph}</p>` : '';
        }).join('');
      };
      
      return `
        <div class="slide">
            <div class="slide-header" style="background: ${theme.gradient};">
                <h1 class="slide-title">${slide.title}</h1>
                <p class="slide-subtitle">Slide ${index + 1} of ${slides.length} • Generated from Voice</p>
            </div>
            <div class="decorative-line"></div>
            <div class="slide-content">
                ${renderSlideContent(slide.content)}
            </div>
            <div class="speaker-notes">
                <div class="speaker-notes-title">Speaker Notes</div>
                <p>${slide.speakerNotes}</p>
            </div>
            <div class="slide-number">${index + 1} / ${slides.length}</div>
        </div>
      `;
    }).join('')}
</body>
</html>`;

    // Launch Puppeteer with optimized settings for Vercel
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      headless: true
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF with proper 16:9 aspect ratio
    const pdfBuffer = await page.pdf({
      width: '1122px',  // 16:9 ratio width
      height: '631px',  // 16:9 ratio height  
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="voice-to-slides.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF export error:', error);
    
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}