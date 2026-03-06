import type { Review, ProductInfo, AnalysisResult, TimelineData, KeywordData, ReviewScore } from '@/types';
import { analyzeSentiment, analyzeAllSentiments, detectSentimentRatingMismatch } from './sentiment-analyzer';
import { analyzePatterns, extractKeywords } from './pattern-detector';
import { calculateDetailedStatistics } from './statistics-calculator';
import { calculateTrustScore } from './trust-score';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// STRICTER review scoring - returns 0-100, lower = more suspicious
function calculateStrictReviewScore(review: Review, allReviews: Review[]): number {
  let score = 100;
  const reasons: string[] = [];

  // 1. LENGTH PENALTIES (very strict)
  if (review.text.length < 10) {
    score -= 50;
    reasons.push('Extremely short (< 10 chars)');
  } else if (review.text.length < 20) {
    score -= 35;
    reasons.push('Very short review');
  } else if (review.text.length < 40) {
    score -= 20;
    reasons.push('Short review');
  } else if (review.text.length < 60) {
    score -= 10;
    reasons.push('Brief review');
  }

  // 2. VERIFICATION PENALTY
  if (!review.verifiedPurchase) {
    score -= 15;
    reasons.push('Unverified purchase');
  }

  // 3. EXTREME RATING + SHORT REVIEW (big red flag)
  if ((review.rating === 1 || review.rating === 5) && review.text.length < 50) {
    score -= 25;
    reasons.push('Extreme rating with brief text');
  }

  // 4. EXAGGERATED LANGUAGE
  const exclamations = (review.text.match(/!/g) || []).length;
  if (exclamations >= 3) {
    score -= 20;
    reasons.push('Excessive exclamation marks');
  } else if (exclamations >= 2) {
    score -= 10;
  }

  // 5. ALL CAPS
  const capsWords = review.text.split(/\s+/).filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length >= 2) {
    score -= 25;
    reasons.push('Multiple ALL CAPS words');
  }

  // 6. GENERIC CONTENT CHECK
  const genericPhrases = [
    'good product', 'nice product', 'great product', 'bad product',
    'good item', 'nice item', 'great item', 'good', 'nice', 'ok',
    'excellent', 'amazing', 'awesome', 'best product', 'worst product'
  ];
  const lowerText = review.text.toLowerCase().trim();
  if (genericPhrases.includes(lowerText)) {
    score -= 40;
    reasons.push('Generic/templated content');
  }

  // 7. SENTIMENT-RATING MISMATCH
  const mismatch = detectSentimentRatingMismatch(review);
  if (mismatch.mismatch) {
    if (mismatch.severity === 'high') {
      score -= 30;
    } else if (mismatch.severity === 'medium') {
      score -= 20;
    } else {
      score -= 10;
    }
    reasons.push('Sentiment-rating mismatch');
  }

  // 8. DUPLICATE CHECK
  const normalizedText = review.text.toLowerCase().trim().replace(/\s+/g, ' ');
  const duplicates = allReviews.filter(r => 
    r.id !== review.id && r.text.toLowerCase().trim().replace(/\s+/g, ' ') === normalizedText
  );
  if (duplicates.length > 0) {
    score -= 35;
    reasons.push(`Duplicate content (${duplicates.length + 1} copies)`);
  }

  // 9. SIMILAR CONTENT CHECK (looser matching)
  const similarReviews = allReviews.filter(r => {
    if (r.id === review.id) return false;
    const otherNormalized = r.text.toLowerCase().trim().replace(/\s+/g, ' ');
    const similarity = calculateSimilarity(normalizedText, otherNormalized);
    return similarity > 0.7;
  });
  if (similarReviews.length > 0 && duplicates.length === 0) {
    score -= 15;
    reasons.push('Similar to other reviews');
  }

  // 10. SUSPICIOUS REVIEWER NAME
  const suspiciousNamePatterns = [
    /^Customer\d+$/i, /^Shopper\d+$/i, /^Buyer\d+$/i, /^User\d+$/i,
    /^Member\d+$/i, /^Amazon\s*Customer/i, /^Flipkart\s*Customer/i,
    /^[A-Z]{2,5}\d{4,}$/i, /^.{1,2}$/
  ];
  if (suspiciousNamePatterns.some(p => p.test(review.reviewerName.trim()))) {
    score -= 15;
    reasons.push('Suspicious reviewer name');
  }

  // 11. NO PUNCTUATION IN LONGER REVIEW (odd)
  if (review.text.length > 50 && !/[.!?]/.test(review.text)) {
    score -= 10;
    reasons.push('No punctuation');
  }

  // Calculate final score
  const finalScore = Math.max(0, Math.min(100, score));

  return finalScore;
}

// Simple similarity calculation
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(' '));
  const words2 = new Set(text2.split(' '));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

// Get suspicion reason for a review
function getSuspicionReason(review: Review, score: number): string {
  const reasons: string[] = [];

  if (review.text.length < 15) reasons.push('Extremely short review');
  else if (review.text.length < 30) reasons.push('Very brief review');
  
  if (!review.verifiedPurchase && (review.rating === 1 || review.rating === 5)) {
    reasons.push('Unverified extreme rating');
  }
  
  const exclamations = (review.text.match(/!/g) || []).length;
  if (exclamations >= 3) reasons.push('Excessive exclamation marks');
  
  const capsWords = review.text.split(/\s+/).filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length >= 2) reasons.push('ALL CAPS usage');
  
  const mismatch = detectSentimentRatingMismatch(review);
  if (mismatch.mismatch) reasons.push(mismatch.explanation);
  
  const lowerText = review.text.toLowerCase().trim();
  const genericPhrases = ['good', 'nice', 'ok', 'great product', 'bad product'];
  if (genericPhrases.includes(lowerText)) reasons.push('Generic content');

  return reasons.length > 0 ? reasons.join('; ') : 'Multiple suspicious indicators detected';
}

// Main analysis function
export async function analyzeReviews(
  reviews: Review[],
  productInfo: ProductInfo
): Promise<AnalysisResult> {
  console.log(`Starting analysis of ${reviews.length} reviews...`);

  // Calculate individual review scores first (STRICT)
  const individualScores: ReviewScore[] = reviews.map((review, index) => {
    const score = calculateStrictReviewScore(review, reviews);
    return {
      reviewId: review.id,
      score,
      factors: {
        length: review.text.length >= 60 ? 100 : review.text.length >= 30 ? 70 : 40,
        verified: review.verifiedPurchase ? 100 : 50,
        sentimentMatch: detectSentimentRatingMismatch(review).mismatch ? 30 : 100,
        languageQuality: 70
      }
    };
  });

  // Run additional analyses in parallel
  const [
    aiResult,
    sentimentAnalysis,
    patternAnalysis,
    detailedStatistics,
    keywordData
  ] = await Promise.all([
    analyzeWithAI(reviews, productInfo),
    Promise.resolve(analyzeAllSentiments(reviews)),
    Promise.resolve(analyzePatterns(reviews)),
    Promise.resolve(calculateDetailedStatistics(reviews)),
    Promise.resolve(extractKeywords(reviews))
  ]);

  console.log('AI Result:', aiResult ? 'Received' : 'Using fallback');

  // Determine suspicious reviews based on scores
  const SUSPICIOUS_THRESHOLD = 60;
  
  let fakeReviews: number;
  let genuineReviews: number;
  let reasoning: string;
  let suspiciousReviews: Review[];

  if (aiResult && aiResult.suspicious_review_indices.length > 0) {
    console.log('Using AI result with', aiResult.suspicious_review_indices.length, 'suspicious indices');
    
    const aiSuspiciousIds = new Set(aiResult.suspicious_review_indices.map(i => reviews[i]?.id));
    
    const lowScoreReviews = reviews.filter((r, i) => {
      const score = individualScores[i]?.score ?? 50;
      return score < SUSPICIOUS_THRESHOLD;
    });

    const allSuspiciousIds = new Set([
      ...aiSuspiciousIds,
      ...lowScoreReviews.map(r => r.id)
    ]);

    suspiciousReviews = reviews
      .filter(r => allSuspiciousIds.has(r.id))
      .map((review) => {
        const scoreIndex = reviews.findIndex(r => r.id === review.id);
        const score = individualScores[scoreIndex]?.score ?? 50;
        return {
          ...review,
          suspicious: true,
          suspicionReason: aiSuspiciousIds.has(review.id) 
            ? 'Flagged by AI analysis' 
            : getSuspicionReason(review, score),
          authenticityScore: score
        };
      });

    fakeReviews = suspiciousReviews.length;
    genuineReviews = reviews.length - fakeReviews;
    reasoning = aiResult.reasoning;
  } else {
    console.log('Using score-based detection');
    
    suspiciousReviews = reviews
      .filter((r, i) => {
        const score = individualScores[i]?.score ?? 50;
        return score < SUSPICIOUS_THRESHOLD;
      })
      .map((review) => {
        const scoreIndex = reviews.findIndex(r => r.id === review.id);
        const score = individualScores[scoreIndex]?.score ?? 50;
        return {
          ...review,
          suspicious: true,
          suspicionReason: getSuspicionReason(review, score),
          authenticityScore: score
        };
      });

    fakeReviews = suspiciousReviews.length;
    genuineReviews = reviews.length - fakeReviews;
    
    reasoning = generateDetailedReasoning(patternAnalysis, sentimentAnalysis, fakeReviews, genuineReviews, suspiciousReviews);
  }

  console.log(`Analysis complete: ${fakeReviews} suspicious, ${genuineReviews} genuine`);

  const reviewTimeline = generateTimelineData(reviews);

  const keywordCloud: KeywordData[] = Array.from(keywordData.entries())
    .map(([word, data]) => ({
      word,
      count: data.count,
      rating: data.rating,
      sentiment: (data.rating >= 4 ? 'positive' : data.rating <= 2 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const trustScore = calculateTrustScore(genuineReviews, reviews.length);

  return {
    fakeReviews,
    genuineReviews,
    reasoning,
    suspiciousReviews,
    trustScore,
    sentimentAnalysis: {
      overall: {
        score: sentimentAnalysis.overall.score,
        label: sentimentAnalysis.overall.label
      },
      distribution: sentimentAnalysis.distribution,
      sentimentRatingCorrelation: sentimentAnalysis.sentimentRatingCorrelation
    },
    patternAnalysis: {
      reviewVelocity: {
        score: patternAnalysis.reviewVelocity.score,
        hasBurstPattern: patternAnalysis.reviewVelocity.hasBurstPattern
      },
      ratingPattern: {
        isNatural: patternAnalysis.ratingPattern.isNatural,
        suspiciousRatingBias: patternAnalysis.ratingPattern.suspiciousRatingBias,
        score: patternAnalysis.ratingPattern.score
      },
      textPatterns: {
        duplicateContent: patternAnalysis.textPatterns.duplicateContent,
        templateLikeReviews: patternAnalysis.textPatterns.templateLikeReviews,
        excessivePunctuation: patternAnalysis.textPatterns.excessivePunctuation
      },
      reviewerPatterns: {
        suspiciousNames: patternAnalysis.reviewerPatterns.suspiciousNames,
        unverifiedRate: patternAnalysis.reviewerPatterns.unverifiedRate
      },
      overallPatternScore: patternAnalysis.overallPatternScore,
      flags: patternAnalysis.flags
    },
    detailedStatistics,
    keywordCloud,
    reviewTimeline,
    individualScores
  };
}

// AI Analysis using Groq API
async function analyzeWithAI(
  reviews: Review[],
  productInfo: ProductInfo
): Promise<{
  fake_reviews: number;
  genuine_reviews: number;
  reasoning: string;
  suspicious_review_indices: number[];
} | null> {
  try {
    const reviewsData = reviews.map((review, index) => ({
      index,
      text: review.text,
      rating: review.rating,
      reviewerName: review.reviewerName,
      verifiedPurchase: review.verifiedPurchase
    }));

    const systemPrompt = `You are a strict fake review detector for e-commerce platforms. You MUST identify suspicious reviews.

STRICT DETECTION RULES - A review is LIKELY FAKE if:
1. Text is very short (< 20 characters) - EXTREMELY SUSPICIOUS
2. Contains generic phrases like "good", "nice", "ok", "great product" alone - SUSPICIOUS  
3. Has excessive punctuation (!!!, ALL CAPS) - SUSPICIOUS
4. Unverified purchase + extreme rating (1 or 5 stars) + short text - VERY SUSPICIOUS
5. Rating doesn't match text sentiment - SUSPICIOUS
6. Repeated/similar content across reviews - SUSPICIOUS
7. Reviewer name looks auto-generated (Customer123, etc) - SUSPICIOUS

IMPORTANT: You MUST find suspicious reviews. Be strict. When in doubt, flag it.

Respond ONLY with valid JSON:
{
  "fake_reviews": number,
  "genuine_reviews": number, 
  "reasoning": "detailed explanation",
  "suspicious_review_indices": [array of indices]
}`;

    const userPrompt = `Product: ${productInfo.title}
Reviews to analyze (${reviews.length} total):
 ${JSON.stringify(reviewsData, null, 2)}

Analyze these reviews. Be STRICT - identify ALL suspicious reviews. Return JSON.`;

    console.log('Calling Groq API for analysis...');
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    
    if (!responseText) {
      console.error('AI API returned empty response');
      return null;
    }

    console.log('AI response received, parsing...');

    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      typeof parsed.fake_reviews !== 'number' ||
      typeof parsed.genuine_reviews !== 'number' ||
      typeof parsed.reasoning !== 'string' ||
      !Array.isArray(parsed.suspicious_review_indices)
    ) {
      console.error('Invalid AI response structure');
      return null;
    }

    parsed.suspicious_review_indices = parsed.suspicious_review_indices.filter(
      (idx: number) => idx >= 0 && idx < reviews.length
    );

    console.log('AI analysis successful:', parsed.fake_reviews, 'fake reviews found');
    return parsed;
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

function generateTimelineData(reviews: Review[]): TimelineData[] {
  const byDate = new Map<string, { count: number; ratingSum: number; verifiedCount: number }>();

  for (const review of reviews) {
    const date = review.date.split('T')[0];
    const existing = byDate.get(date) || { count: 0, ratingSum: 0, verifiedCount: 0 };
    existing.count++;
    existing.ratingSum += review.rating;
    existing.verifiedCount += review.verifiedPurchase ? 1 : 0;
    byDate.set(date, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      averageRating: Math.round((data.ratingSum / data.count) * 10) / 10,
      verifiedCount: data.verifiedCount
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function generateDetailedReasoning(
  pattern: { overallPatternScore: number; flags: string[] },
  sentiment: { overall: { label: string }; sentimentRatingCorrelation: number },
  fakeCount: number,
  genuineCount: number,
  suspiciousReviews: Review[]
): string {
  const parts: string[] = [];
  const total = fakeCount + genuineCount;
  const fakePercent = total > 0 ? ((fakeCount / total) * 100).toFixed(1) : '0';

  parts.push(`⚠️ CRITICAL: Analysis identified ${fakeCount} suspicious reviews (${fakePercent}% of total).`);

  const shortReviews = suspiciousReviews.filter(r => r.text.length < 30).length;
  const unverified = suspiciousReviews.filter(r => !r.verifiedPurchase).length;
  const extremeRatings = suspiciousReviews.filter(r => r.rating === 1 || r.rating === 5).length;

  if (shortReviews > 0) parts.push(`• ${shortReviews} extremely short reviews detected.`);
  if (unverified > 0) parts.push(`• ${unverified} unverified purchase reviews flagged.`);
  if (extremeRatings > 0) parts.push(`• ${extremeRatings} extreme ratings (1★ or 5★) with suspicious content.`);

  if (pattern.flags.length > 0) {
    parts.push(`Pattern issues: ${pattern.flags.slice(0, 2).join(', ')}.`);
  }

  if (sentiment.sentimentRatingCorrelation < 0.4) {
    parts.push('Low sentiment-rating correlation suggests potential manipulation.');
  }

  if (fakeCount > total * 0.3) {
    parts.push('🔴 HIGH RISK: More than 30% of reviews appear suspicious. Exercise extreme caution!');
  } else if (fakeCount > total * 0.15) {
    parts.push('🟡 MODERATE RISK: Some suspicious patterns detected. Verify carefully.');
  } else {
    parts.push('🟢 LOW RISK: Most reviews appear authentic, but always verify before purchasing.');
  }

  return parts.join(' ');
}