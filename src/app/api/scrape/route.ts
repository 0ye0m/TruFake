import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/scraper';
import type { ScrapeResponse } from '@/types';

export const maxDuration = 60; // 60 seconds timeout for Vercel

export async function POST(request: NextRequest): Promise<NextResponse<ScrapeResponse>> {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          productInfo: null,
          reviews: [],
          error: 'Please enter a product URL'
        },
        { status: 400 }
      );
    }

    // Clean URL
    const cleanUrl = url.trim();
    
    // Add protocol if missing
    let finalUrl = cleanUrl;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      finalUrl = 'https://' + cleanUrl;
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(finalUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          productInfo: null,
          reviews: [],
          error: 'Invalid URL format. Please enter a valid product URL.'
        },
        { status: 400 }
      );
    }

    // Check if it's a supported URL
    const supportedDomains = [
      'amazon.', 'flipkart.', 'ebay.', 'walmart.', 'bestbuy.',
      'aliexpress.', 'target.', 'etsy.', 'myntra.', 'snapdeal.',
      'meesho.', 'newegg.'
    ];
    const isSupported = supportedDomains.some(domain => parsedUrl.hostname.includes(domain));

    if (!isSupported) {
      return NextResponse.json(
        {
          success: false,
          productInfo: null,
          reviews: [],
          error: 'Unsupported website.\n\nWe support:\n• Amazon\n• Flipkart\n• eBay\n• Walmart\n• Best Buy\n• AliExpress\n• Target\n• Etsy\n• Myntra\n• Snapdeal\n• Meesho\n• Newegg\n\nPlease use a product URL from one of these platforms.'
        },
        { status: 400 }
      );
    }

    console.log(`[API] Starting scrape for: ${finalUrl}`);

    // Scrape with timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - took too long to fetch the page')), 50000);
    });

    const scrapePromise = scrapeProduct(finalUrl);

    const { productInfo, reviews } = await Promise.race([scrapePromise, timeoutPromise]);

    console.log(`[API] Success: ${productInfo.title} with ${reviews.length} reviews`);

    return NextResponse.json({
      success: true,
      productInfo,
      reviews
    });

  } catch (error) {
    console.error('[API] Scrape error:', error);
    
    // Get error message safely
    let errorMessage = 'Failed to fetch product data. Please try again.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Clean up common error messages
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('took too long')) {
      errorMessage = 'Request timed out. The website may be slow. Please try again.';
    } else if (errorMessage.includes('403') || errorMessage.includes('401') || errorMessage.includes('Access denied')) {
      errorMessage = 'Access denied by the website. Please try a different product.';
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      errorMessage = 'Product page not found. Please check the URL and try again.';
    } else if (errorMessage.includes('Failed to fetch page')) {
      errorMessage = 'Could not reach the website. Please check if the URL is correct and try again.';
    }

    return NextResponse.json(
      {
        success: false,
        productInfo: null,
        reviews: [],
        error: errorMessage
      },
      { status: 200 } // Return 200 to avoid network errors, error is in response body
    );
  }
}
