import { NextRequest, NextResponse } from 'next/server';
import { analyzeReviews } from '@/lib/enhanced-analyzer';
import type { AnalyzeResponse, Review, ProductInfo } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await request.json();
    const { reviews, productInfo } = body as { reviews: Review[]; productInfo: ProductInfo };

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        {
          success: false,
          result: null,
          error: 'No reviews provided for analysis'
        },
        { status: 400 }
      );
    }

    if (!productInfo) {
      return NextResponse.json(
        {
          success: false,
          result: null,
          error: 'Product information is required'
        },
        { status: 400 }
      );
    }

    console.log(`Starting comprehensive analysis of ${reviews.length} reviews...`);

    // Run comprehensive analysis
    const result = await analyzeReviews(reviews, productInfo);

    console.log(`Analysis complete: ${result.fakeReviews} fake, ${result.genuineReviews} genuine`);
    console.log(`Trust Score: ${result.trustScore.score}`);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      {
        success: false,
        result: null,
        error: 'Failed to analyze reviews. Please try again.'
      },
      { status: 500 }
    );
  }
}
