import type { Review, RatingDistribution } from '@/types';
import { analyzeSentiment } from './sentiment-analyzer';

export interface DetailedStatistics {
  // Basic counts
  totalReviews: number;
  verifiedPurchases: number;
  unverifiedPurchases: number;
  
  // Rating statistics
  averageRating: number;
  medianRating: number;
  ratingStdDev: number;
  ratingDistribution: RatingDistribution[];
  
  // Review length statistics
  averageLength: number;
  medianLength: number;
  shortestReview: number;
  longestReview: number;
  
  // Time statistics
  dateRange: {
    earliest: string;
    latest: string;
    daysSpan: number;
  };
  reviewsPerMonth: number;
  
  // Authenticity scores
  authenticityMetrics: {
    verifiedPurchaseScore: number;
    ratingDistributionScore: number;
    reviewLengthScore: number;
    timeConsistencyScore: number;
    languageQualityScore: number;
  };
  
  // Overall quality score
  overallQualityScore: number;
}

export function calculateDetailedStatistics(reviews: Review[]): DetailedStatistics {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      verifiedPurchases: 0,
      unverifiedPurchases: 0,
      averageRating: 0,
      medianRating: 0,
      ratingStdDev: 0,
      ratingDistribution: [],
      averageLength: 0,
      medianLength: 0,
      shortestReview: 0,
      longestReview: 0,
      dateRange: { earliest: '', latest: '', daysSpan: 0 },
      reviewsPerMonth: 0,
      authenticityMetrics: {
        verifiedPurchaseScore: 0,
        ratingDistributionScore: 0,
        reviewLengthScore: 0,
        timeConsistencyScore: 0,
        languageQualityScore: 0
      },
      overallQualityScore: 0
    };
  }
  
  // ====== BASIC COUNTS ======
  const verifiedPurchases = reviews.filter(r => r.verifiedPurchase).length;
  const unverifiedPurchases = reviews.length - verifiedPurchases;
  
  // ====== RATING STATISTICS ======
  const ratings = reviews.map(r => r.rating);
  const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  
  // Median
  const sortedRatings = [...ratings].sort((a, b) => a - b);
  const mid = Math.floor(sortedRatings.length / 2);
  const medianRating = sortedRatings.length % 2 !== 0
    ? sortedRatings[mid]
    : (sortedRatings[mid - 1] + sortedRatings[mid]) / 2;
  
  // Standard deviation
  const ratingVariance = ratings.reduce((sum, r) => sum + Math.pow(r - averageRating, 2), 0) / ratings.length;
  const ratingStdDev = Math.sqrt(ratingVariance);
  
  // Rating distribution
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1);
  
  const ratingDistribution: RatingDistribution[] = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: ratingCounts[rating] || 0,
    percentage: Math.round((ratingCounts[rating] / reviews.length) * 100)
  }));
  
  // ====== LENGTH STATISTICS ======
  const lengths = reviews.map(r => r.text.length);
  const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  const sortedLengths = [...lengths].sort((a, b) => a - b);
  const medianLength = sortedLengths.length % 2 !== 0
    ? sortedLengths[mid]
    : (sortedLengths[mid - 1] + sortedLengths[mid]) / 2;
  
  const shortestReview = Math.min(...lengths);
  const longestReview = Math.max(...lengths);
  
  // ====== TIME STATISTICS ======
  const dates = reviews
    .map(r => new Date(r.date))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  
  let dateRange = { earliest: '', latest: '', daysSpan: 0 };
  let reviewsPerMonth = 0;
  
  if (dates.length > 0) {
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const daysSpan = Math.max(1, (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
    
    dateRange = {
      earliest: earliest.toISOString().split('T')[0],
      latest: latest.toISOString().split('T')[0],
      daysSpan: Math.round(daysSpan)
    };
    
    reviewsPerMonth = Math.round((reviews.length / daysSpan) * 30);
  }
  
  // ====== AUTHENTICITY METRICS ======
  
  // Verified purchase score (higher verified % = better)
  const verifiedPurchaseScore = Math.round((verifiedPurchases / reviews.length) * 100);
  
  // Rating distribution score (natural J-curve)
  const fiveStarPercent = (ratingCounts[5] / reviews.length) * 100;
  const oneStarPercent = (ratingCounts[1] / reviews.length) * 100;
  
  // Natural distribution: 5-star ~55-75%, 1-star ~5-15%
  let ratingDistributionScore = 100;
  if (fiveStarPercent > 85) ratingDistributionScore -= 30;
  else if (fiveStarPercent > 80) ratingDistributionScore -= 15;
  if (oneStarPercent > 40) ratingDistributionScore -= 25;
  else if (oneStarPercent > 30) ratingDistributionScore -= 15;
  
  // Review length score (shorter reviews = more suspicious)
  let reviewLengthScore = 100;
  if (averageLength < 30) reviewLengthScore -= 40;
  else if (averageLength < 50) reviewLengthScore -= 20;
  else if (averageLength < 80) reviewLengthScore -= 10;
  
  // Check for length variation (too uniform = suspicious)
  const lengthStdDev = Math.sqrt(
    lengths.reduce((sum, len) => sum + Math.pow(len - averageLength, 2), 0) / lengths.length
  );
  if (lengthStdDev < 20) reviewLengthScore -= 15;
  
  // Time consistency score
  let timeConsistencyScore = 100;
  if (reviewsPerMonth > 100) timeConsistencyScore -= 40;
  else if (reviewsPerMonth > 50) timeConsistencyScore -= 20;
  
  // Check for review bursts
  const dayCounts = new Map<string, number>();
  reviews.forEach(r => {
    const day = r.date.split('T')[0];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });
  const maxPerDay = Math.max(...dayCounts.values());
  if (maxPerDay > reviews.length * 0.3) timeConsistencyScore -= 30;
  
  // Language quality score
  let languageQualityScore = 100;
  let poorLanguageCount = 0;
  
  for (const review of reviews) {
    const text = review.text;
    
    // Check for poor grammar indicators
    const hasMultipleExclamations = (text.match(/!{2,}/g) || []).length > 0;
    const hasAllCaps = text !== text.toLowerCase() && text.length > 10;
    const hasNoPunctuation = !/[.!?]/.test(text) && text.length > 20;
    const isVeryShort = text.length < 15;
    
    if (hasMultipleExclamations || hasAllCaps || hasNoPunctuation || isVeryShort) {
      poorLanguageCount++;
    }
  }
  
  const poorLanguagePercent = (poorLanguageCount / reviews.length) * 100;
  languageQualityScore = Math.max(0, 100 - poorLanguagePercent);
  
  // ====== OVERALL QUALITY SCORE ======
  const overallQualityScore = Math.round(
    (verifiedPurchaseScore * 0.25) +
    (ratingDistributionScore * 0.20) +
    (reviewLengthScore * 0.20) +
    (timeConsistencyScore * 0.15) +
    (languageQualityScore * 0.20)
  );
  
  return {
    totalReviews: reviews.length,
    verifiedPurchases,
    unverifiedPurchases,
    averageRating: Math.round(averageRating * 10) / 10,
    medianRating,
    ratingStdDev: Math.round(ratingStdDev * 10) / 10,
    ratingDistribution,
    averageLength: Math.round(averageLength),
    medianLength: Math.round(medianLength),
    shortestReview,
    longestReview,
    dateRange,
    reviewsPerMonth,
    authenticityMetrics: {
      verifiedPurchaseScore,
      ratingDistributionScore: Math.max(0, ratingDistributionScore),
      reviewLengthScore: Math.max(0, reviewLengthScore),
      timeConsistencyScore: Math.max(0, timeConsistencyScore),
      languageQualityScore: Math.max(0, languageQualityScore)
    },
    overallQualityScore
  };
}

// Calculate review score for individual review
export function calculateReviewScore(review: Review, allReviews: Review[]): number {
  let score = 100;
  
  // Length penalty
  if (review.text.length < 15) score -= 40;
  else if (review.text.length < 30) score -= 20;
  else if (review.text.length < 50) score -= 10;
  
  // Verification bonus
  if (review.verifiedPurchase) score += 10;
  else score -= 10;
  
  // Sentiment analysis
  const sentiment = analyzeSentiment(review.text);
  
  // Check for sentiment-rating mismatch
  if (review.rating >= 4 && sentiment.score < -0.2) score -= 25;
  else if (review.rating <= 2 && sentiment.score > 0.2) score -= 25;
  
  // Check for excessive punctuation
  const exclamationCount = (review.text.match(/!/g) || []).length;
  if (exclamationCount >= 3) score -= 15;
  
  // Check for ALL CAPS
  const capsWords = review.text.split(/\s+/).filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length >= 2) score -= 15;
  
  // Check for duplicate content
  const normalizedText = review.text.toLowerCase().trim();
  const duplicates = allReviews.filter(r => 
    r.id !== review.id && r.text.toLowerCase().trim() === normalizedText
  );
  if (duplicates.length > 0) score -= 30;
  
  return Math.max(0, Math.min(100, score));
}
