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

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice to Slides Presentation</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: white;
        }
        .slide {
            width: 8.5in;
            height: 11in;
            padding: 1in;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .slide:last-child {
            page-break-after: auto;
        }
        .slide-title {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 40px;
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
        }
        .slide-content {
            font-size: 18px;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 40px;
            flex-grow: 1;
        }
        .slide-content p {
            margin-bottom: 16px;
        }
        .slide-content ul {
            padding-left: 20px;
        }
        .slide-content li {
            margin-bottom: 8px;
        }
        .speaker-notes {
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
            font-size: 14px;
            color: #6b7280;
            font-style: italic;
        }
        .slide-number {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 12px;
            color: #9ca3af;
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
    ${slides.map((slide, index) => `
        <div class="slide">
            <h1 class="slide-title">${slide.title}</h1>
            <div class="slide-content">
                ${slide.content.split('\\n').filter(p => p.trim()).map(paragraph => {
                  if (paragraph.trim().startsWith('•')) {
                    return `<li>${paragraph.replace('•', '').trim()}</li>`;
                  }
                  return `<p>${paragraph}</p>`;
                }).join('')}
            </div>
            <div class="speaker-notes">
                <strong>Speaker Notes:</strong> ${slide.speakerNotes}
            </div>
            <div class="slide-number">${index + 1} / ${slides.length}</div>
        </div>
    `).join('')}
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

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
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