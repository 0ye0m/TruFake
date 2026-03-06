import type { Review } from '@/types';

export interface PatternAnalysis {
  // Review timing patterns
  reviewVelocity: {
    score: number; // 0-100, lower = suspicious burst reviews
    hasBurstPattern: boolean;
    averageDaysBetweenReviews: number;
    maxReviewsInSingleDay: number;
  };
  
  // Rating distribution patterns
  ratingPattern: {
    isNatural: boolean;
    deviationFromNormal: number; // How much it deviates from natural J-curve
    suspiciousRatingBias: 'none' | 'positive' | 'negative';
    score: number; // 0-100
  };
  
  // Text patterns
  textPatterns: {
    duplicateContent: number; // percentage
    templateLikeReviews: number; // percentage
    avgReviewLength: number;
    lengthVariation: number; // standard deviation
    excessivePunctuation: number; // percentage
    allCapsUsage: number; // percentage
  };
  
  // Reviewer patterns
  reviewerPatterns: {
    uniqueReviewers: number;
    avgReviewsPerReviewer: number;
    suspiciousNames: number; // auto-generated looking names
    unverifiedRate: number; // percentage
  };
  
  // Overall pattern score
  overallPatternScore: number; // 0-100
  flags: string[];
}

// Check if name looks auto-generated
function isSuspiciousName(name: string): boolean {
  const patterns = [
    /^Customer\d+$/i,
    /^Shopper\d+$/i,
    /^Buyer\d+$/i,
    /^User\d+$/i,
    /^Member\d+$/i,
    /^Amazon\s*Customer/i,
    /^Flipkart\s*Customer/i,
    /^[A-Z]{2,5}\d{4,}$/i,
    /^.{1,2}$/ // Very short names
  ];
  
  return patterns.some(p => p.test(name.trim()));
}

// Detect template-like reviews
function isTemplateLike(text: string): boolean {
  const templatePatterns = [
    /^(Good|Great|Nice|Excellent|Bad|Poor) product\.?$/i,
    /^(Good|Great|Nice|Excellent|Bad|Poor) quality\.?$/i,
    /^(I love it|I hate it|Worth buying|Not worth|Must buy)\.?$/i,
    /^(Highly recommend|Don't buy|Go for it)\.?$/i,
    /^(Best product|Worst product|Good value|Value for money)\.?$/i,
    /^[A-Za-z]{1,5}$/ // Very short
  ];
  
  const trimmed = text.trim();
  return templatePatterns.some(p => p.test(trimmed)) || trimmed.length < 15;
}

// Check for excessive punctuation
function hasExcessivePunctuation(text: string): boolean {
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  
  return exclamationCount >= 3 || questionCount >= 3 || capsRatio > 0.5;
}

// Check for all caps words
function hasAllCaps(text: string): boolean {
  const words = text.split(/\s+/);
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  return capsWords.length >= 2;
}

// Calculate J-curve deviation (natural rating distribution)
function calculateJCurveDeviation(ratings: Record<number, number>): number {
  // Expected J-curve distribution for genuine products
  // Typically: 5 stars ~65%, 4 ~15%, 3 ~8%, 2 ~5%, 1 ~7%
  const expected = { 5: 0.65, 4: 0.15, 3: 0.08, 2: 0.05, 1: 0.07 };
  const total = Object.values(ratings).reduce((a, b) => a + b, 0);
  
  if (total === 0) return 0;
  
  let deviation = 0;
  for (const [rating, expectedPercent] of Object.entries(expected)) {
    const actualPercent = (ratings[parseInt(rating)] || 0) / total;
    deviation += Math.abs(actualPercent - expectedPercent);
  }
  
  return deviation / 5; // Average deviation per rating
}

export function analyzePatterns(reviews: Review[]): PatternAnalysis {
  const flags: string[] = [];
  
  // ====== REVIEW TIMING ANALYSIS ======
  const dates = reviews
    .map(r => new Date(r.date).getTime())
    .filter(d => !isNaN(d))
    .sort((a, b) => a - b);
  
  let avgDaysBetween = 0;
  let maxReviewsSingleDay = 0;
  let hasBurstPattern = false;
  
  if (dates.length > 1) {
    // Calculate average days between reviews
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
    }
    avgDaysBetween = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    
    // Check for bursts
    const dayCounts = new Map<string, number>();
    for (const date of dates) {
      const dayKey = new Date(date).toISOString().split('T')[0];
      dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
    }
    maxReviewsSingleDay = Math.max(...dayCounts.values());
    
    // If more than 20% of reviews came on one day, it's suspicious
    hasBurstPattern = maxReviewsSingleDay > reviews.length * 0.2;
    if (hasBurstPattern) {
      flags.push(`Burst review pattern: ${maxReviewsSingleDay} reviews on a single day`);
    }
  }
  
  // Review velocity score (higher = more natural)
  let velocityScore = 100;
  if (hasBurstPattern) velocityScore -= 30;
  if (maxReviewsSingleDay > 5) velocityScore -= 20;
  if (avgDaysBetween < 1 && reviews.length > 10) velocityScore -= 25;
  
  // ====== RATING DISTRIBUTION ANALYSIS ======
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1);
  
  const jCurveDeviation = calculateJCurveDeviation(ratingCounts);
  
  // Determine bias
  const fiveStarRate = ratingCounts[5] / reviews.length;
  const oneStarRate = ratingCounts[1] / reviews.length;
  let suspiciousBias: 'none' | 'positive' | 'negative' = 'none';
  
  if (fiveStarRate > 0.8) {
    suspiciousBias = 'positive';
    flags.push(`Suspiciously high 5-star rate: ${Math.round(fiveStarRate * 100)}%`);
  } else if (oneStarRate > 0.5) {
    suspiciousBias = 'negative';
    flags.push(`Unusually high 1-star rate: ${Math.round(oneStarRate * 100)}%`);
  }
  
  const ratingScore = Math.max(0, 100 - jCurveDeviation * 200);
  
  // ====== TEXT PATTERN ANALYSIS ======
  let duplicateCount = 0;
  let templateCount = 0;
  let excessivePunctCount = 0;
  let allCapsCount = 0;
  let totalLength = 0;
  const lengths: number[] = [];
  const textSet = new Set<string>();
  
  for (const review of reviews) {
    const normalizedText = review.text.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check duplicates
    if (textSet.has(normalizedText)) {
      duplicateCount++;
    } else {
      textSet.add(normalizedText);
    }
    
    // Check template-like
    if (isTemplateLike(review.text)) {
      templateCount++;
    }
    
    // Check punctuation and caps
    if (hasExcessivePunctuation(review.text)) {
      excessivePunctCount++;
    }
    if (hasAllCaps(review.text)) {
      allCapsCount++;
    }
    
    totalLength += review.text.length;
    lengths.push(review.text.length);
  }
  
  // Calculate length variation
  const avgLength = totalLength / reviews.length;
  const lengthVariance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / reviews.length;
  const lengthVariation = Math.sqrt(lengthVariance);
  
  const duplicatePercent = Math.round((duplicateCount / reviews.length) * 100);
  const templatePercent = Math.round((templateCount / reviews.length) * 100);
  const punctPercent = Math.round((excessivePunctCount / reviews.length) * 100);
  const capsPercent = Math.round((allCapsCount / reviews.length) * 100);
  
  if (duplicatePercent > 5) {
    flags.push(`${duplicatePercent}% duplicate reviews detected`);
  }
  if (templatePercent > 20) {
    flags.push(`${templatePercent}% template-like reviews`);
  }
  
  // ====== REVIEWER PATTERN ANALYSIS ======
  const uniqueReviewers = new Set(reviews.map(r => r.reviewerName)).size;
  const suspiciousNames = reviews.filter(r => isSuspiciousName(r.reviewerName)).length;
  const unverifiedCount = reviews.filter(r => !r.verifiedPurchase).length;
  
  const suspiciousNamePercent = Math.round((suspiciousNames / reviews.length) * 100);
  const unverifiedPercent = Math.round((unverifiedCount / reviews.length) * 100);
  
  if (suspiciousNamePercent > 30) {
    flags.push(`${suspiciousNamePercent}% reviews have suspicious reviewer names`);
  }
  if (unverifiedPercent > 50) {
    flags.push(`High unverified purchase rate: ${unverifiedPercent}%`);
  }
  
  // ====== CALCULATE OVERALL SCORE ======
  const textScore = Math.max(0, 100 - 
    (duplicatePercent * 2) - 
    (templatePercent * 1.5) - 
    (punctPercent) - 
    (capsPercent * 1.5)
  );
  
  const reviewerScore = Math.max(0, 100 - 
    (suspiciousNamePercent * 1.5) - 
    (unverifiedPercent * 0.5)
  );
  
  const overallPatternScore = Math.round(
    (velocityScore * 0.15) +
    (ratingScore * 0.25) +
    (textScore * 0.35) +
    (reviewerScore * 0.25)
  );
  
  return {
    reviewVelocity: {
      score: Math.round(velocityScore),
      hasBurstPattern,
      averageDaysBetweenReviews: Math.round(avgDaysBetween * 10) / 10,
      maxReviewsInSingleDay: maxReviewsSingleDay
    },
    ratingPattern: {
      isNatural: jCurveDeviation < 0.2,
      deviationFromNormal: Math.round(jCurveDeviation * 100),
      suspiciousRatingBias: suspiciousBias,
      score: Math.round(ratingScore)
    },
    textPatterns: {
      duplicateContent: duplicatePercent,
      templateLikeReviews: templatePercent,
      avgReviewLength: Math.round(avgLength),
      lengthVariation: Math.round(lengthVariation),
      excessivePunctuation: punctPercent,
      allCapsUsage: capsPercent
    },
    reviewerPatterns: {
      uniqueReviewers,
      avgReviewsPerReviewer: Math.round((reviews.length / uniqueReviewers) * 100) / 100,
      suspiciousNames: suspiciousNamePercent,
      unverifiedRate: unverifiedPercent
    },
    overallPatternScore,
    flags
  };
}

// Extract keywords from reviews
export function extractKeywords(reviews: Review[]): Map<string, { count: number; sentiment: number; rating: number }> {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
    'because', 'until', 'while', 'this', 'that', 'these', 'those', 'it', 'its',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he',
    'him', 'his', 'she', 'her', 'hers', 'they', 'them', 'their', 'what', 'which',
    'who', 'whom', 'this', 'that', 'am', 'product', 'item', 'one', 'get', 'got',
    'buy', 'bought', 'purchase', 'purchased', 'use', 'used', 'using', 'time'
  ]);
  
  const keywordMap = new Map<string, { count: number; sentimentSum: number; ratingSum: number }>();
  
  for (const review of reviews) {
    const words = review.text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    
    for (const word of words) {
      const existing = keywordMap.get(word) || { count: 0, sentimentSum: 0, ratingSum: 0 };
      existing.count++;
      existing.ratingSum += review.rating;
      keywordMap.set(word, existing);
    }
  }
  
  // Convert to final format
  const result = new Map<string, { count: number; sentiment: number; rating: number }>();
  
  for (const [word, data] of keywordMap.entries()) {
    if (data.count >= 2) { // Only keywords appearing 2+ times
      result.set(word, {
        count: data.count,
        sentiment: 0, // Simplified for now
        rating: Math.round((data.ratingSum / data.count) * 10) / 10
      });
    }
  }
  
  return result;
}
