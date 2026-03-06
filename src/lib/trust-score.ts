import type { TrustScore, RatingDistribution, Review } from '@/types';

export function calculateTrustScore(genuineReviews: number, totalReviews: number): TrustScore {
  if (totalReviews === 0) {
    return {
      score: 0,
      fakePercentage: 0,
      genuinePercentage: 0
    };
  }

  const score = Math.round((genuineReviews / totalReviews) * 100);
  const fakePercentage = Math.round(((totalReviews - genuineReviews) / totalReviews) * 100);
  const genuinePercentage = 100 - fakePercentage;

  return {
    score,
    fakePercentage,
    genuinePercentage
  };
}

export function getTrustLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getTrustColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function getTrustBgColor(score: number): string {
  if (score >= 70) return 'bg-green-100';
  if (score >= 40) return 'bg-yellow-100';
  return 'bg-red-100';
}

export function getTrustRingColor(score: number): string {
  if (score >= 70) return 'stroke-green-500';
  if (score >= 40) return 'stroke-yellow-500';
  return 'stroke-red-500';
}

export function getTrustMessage(score: number): string {
  if (score >= 90) return 'Excellent! This product has highly trustworthy reviews.';
  if (score >= 70) return 'Good. Most reviews appear to be genuine.';
  if (score >= 50) return 'Fair. Some reviews may be suspicious.';
  if (score >= 30) return 'Warning. Many reviews show suspicious patterns.';
  return 'Danger! Most reviews appear to be fake or suspicious.';
}

export function calculateRatingDistribution(reviews: Review[]): RatingDistribution[] {
  const distribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };

  reviews.forEach(review => {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
    distribution[rating]++;
  });

  const total = reviews.length;

  return [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: distribution[rating],
    percentage: total > 0 ? Math.round((distribution[rating] / total) * 100) : 0
  }));
}

export function getRatingDistributionColor(rating: number): string {
  switch (rating) {
    case 5:
      return 'bg-green-500';
    case 4:
      return 'bg-lime-500';
    case 3:
      return 'bg-yellow-500';
    case 2:
      return 'bg-orange-500';
    case 1:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}
