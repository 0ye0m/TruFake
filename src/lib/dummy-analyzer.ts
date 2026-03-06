import type { Review } from '@/types';

interface SuspiciousReviewResult {
  review: Review;
  reason: string;
}

interface DummyAnalysisResult {
  fakeReviews: number;
  genuineReviews: number;
  reasoning: string;
  suspiciousReviews: SuspiciousReviewResult[];
}

// Patterns that indicate potentially fake reviews
const EXAGGERATED_PATTERNS = [
  /\b(amazing|incredible|unbelievable|fantastic|outstanding|phenomenal|spectacular|mind-blowing)\b/gi,
  /\b(best\s+(ever|product|thing))\b/gi,
  /\b(must\s+buy|highly\s+recommend|don'?t\s+think\s+twice)\b/gi,
  /\b(perfect|flawless|excellent|superb)\b!+/gi,
  /\b(a\++|10\/10|five\s+stars)\b/gi
];

const NEGATIVE_PATTERNS = [
  /\b(terrible|awful|horrible|worst|disappointing|waste|garbage|junk|scam)\b/gi,
  /\b(don'?t\s+buy|avoid|stay\s+away|never\s+again)\b/gi,
  /\b(returning|refund|money\s+back)\b/gi
];

const GENERIC_SHORT_REVIEWS = [
  'good', 'nice', 'ok', 'okay', 'great', 'bad', 'poor', 'excellent', 'fine', 'decent'
];

function checkExaggeratedLanguage(text: string): { suspicious: boolean; reason: string } {
  for (const pattern of EXAGGERATED_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length >= 2) {
      return {
        suspicious: true,
        reason: `Overly exaggerated language detected: "${matches.slice(0, 2).join('", "')}" appears multiple times`
      };
    }
    if (matches && matches.length === 1) {
      // Check if the review is also very short
      if (text.length < 50) {
        return {
          suspicious: true,
          reason: `Short review with exaggerated language: "${matches[0]}"`
        };
      }
    }
  }
  return { suspicious: false, reason: '' };
}

function checkRatingTextMismatch(review: Review): { suspicious: boolean; reason: string } {
  const text = review.text.toLowerCase();
  const rating = review.rating;

  // Check for positive words with low rating
  const hasPositiveWords = /\b(great|excellent|amazing|love|perfect|best|wonderful|fantastic)\b/gi.test(text);
  const hasNegativeWords = /\b(bad|terrible|awful|hate|worst|poor|horrible|disappointing)\b/gi.test(text);

  // 1-2 star review with positive words
  if (rating <= 2 && hasPositiveWords && !hasNegativeWords) {
    return {
      suspicious: true,
      reason: `Rating-text mismatch: ${rating}-star review contains positive language`
    };
  }

  // 4-5 star review with negative words
  if (rating >= 4 && hasNegativeWords && !hasPositiveWords) {
    return {
      suspicious: true,
      reason: `Rating-text mismatch: ${rating}-star review contains negative language`
    };
  }

  return { suspicious: false, reason: '' };
}

function checkShortReview(review: Review): { suspicious: boolean; reason: string } {
  const text = review.text.trim();

  // Extremely short reviews
  if (text.length < 15) {
    return {
      suspicious: true,
      reason: `Extremely short review (${text.length} characters): "${text}"`
    };
  }

  // Generic short reviews
  const normalizedText = text.toLowerCase().replace(/[.!?,]/g, '').trim();
  if (GENERIC_SHORT_REVIEWS.includes(normalizedText)) {
    return {
      suspicious: true,
      reason: `Generic short review without substance: "${text}"`
    };
  }

  return { suspicious: false, reason: '' };
}

function checkUnverifiedExtremeRating(review: Review): { suspicious: boolean; reason: string } {
  if (!review.verifiedPurchase && (review.rating === 1 || review.rating === 5)) {
    const text = review.text.toLowerCase();

    // Check if the review has any substance
    if (text.length < 50) {
      return {
        suspicious: true,
        reason: `Unverified purchase with extreme rating (${review.rating} stars) and brief review`
      };
    }

    // Check for exaggerated language in unverified extreme reviews
    const hasExaggerated = /\b(amazing|incredible|best\s+ever|must\s+buy|terrible|worst|scam|avoid)\b/gi.test(text);
    if (hasExaggerated) {
      return {
        suspicious: true,
        reason: `Unverified purchase with extreme rating (${review.rating} stars) and exaggerated language`
      };
    }
  }

  return { suspicious: false, reason: '' };
}

function checkDuplicateContent(reviews: Review[]): Map<string, string> {
  const duplicateReasons = new Map<string, string>();
  const textCounts = new Map<string, number>();

  // Normalize and count text occurrences
  reviews.forEach(review => {
    const normalizedText = review.text.toLowerCase().trim().replace(/\s+/g, ' ');
    const count = textCounts.get(normalizedText) || 0;
    textCounts.set(normalizedText, count + 1);
  });

  // Mark duplicates
  reviews.forEach(review => {
    const normalizedText = review.text.toLowerCase().trim().replace(/\s+/g, ' ');
    const count = textCounts.get(normalizedText) || 0;
    if (count > 1) {
      duplicateReasons.set(review.id, `Duplicate review content (appears ${count} times)`);
    }
  });

  return duplicateReasons;
}

function checkGenericContent(review: Review): { suspicious: boolean; reason: string } {
  const text = review.text.toLowerCase();

  // Very generic phrases that could apply to any product
  const genericPhrases = [
    'great product',
    'good product',
    'nice product',
    'works great',
    'highly recommend',
    'as described',
    'fast shipping'
  ];

  const matchesGenericPhrase = genericPhrases.some(phrase => text.includes(phrase));

  if (matchesGenericPhrase && text.length < 60) {
    return {
      suspicious: true,
      reason: `Generic review content that could apply to any product`
    };
  }

  return { suspicious: false, reason: '' };
}

export function analyzeWithDummyRules(reviews: Review[]): DummyAnalysisResult {
  const suspiciousReviews: SuspiciousReviewResult[] = [];
  const duplicateReasons = checkDuplicateContent(reviews);

  const alreadyFlagged = new Set<string>();

  reviews.forEach(review => {
    // Skip if already flagged
    if (alreadyFlagged.has(review.id)) return;

    // Check for duplicates first
    if (duplicateReasons.has(review.id)) {
      const reason = duplicateReasons.get(review.id);
      if (reason) {
        suspiciousReviews.push({
          review: { ...review, suspicious: true, suspicionReason: reason },
          reason
        });
        alreadyFlagged.add(review.id);
        return;
      }
    }

    // Check for short reviews
    let result = checkShortReview(review);
    if (result.suspicious) {
      suspiciousReviews.push({
        review: { ...review, suspicious: true, suspicionReason: result.reason },
        reason: result.reason
      });
      alreadyFlagged.add(review.id);
      return;
    }

    // Check for exaggerated language
    result = checkExaggeratedLanguage(review.text);
    if (result.suspicious) {
      suspiciousReviews.push({
        review: { ...review, suspicious: true, suspicionReason: result.reason },
        reason: result.reason
      });
      alreadyFlagged.add(review.id);
      return;
    }

    // Check for rating-text mismatch
    result = checkRatingTextMismatch(review);
    if (result.suspicious) {
      suspiciousReviews.push({
        review: { ...review, suspicious: true, suspicionReason: result.reason },
        reason: result.reason
      });
      alreadyFlagged.add(review.id);
      return;
    }

    // Check for unverified extreme ratings
    result = checkUnverifiedExtremeRating(review);
    if (result.suspicious) {
      suspiciousReviews.push({
        review: { ...review, suspicious: true, suspicionReason: result.reason },
        reason: result.reason
      });
      alreadyFlagged.add(review.id);
      return;
    }

    // Check for generic content
    result = checkGenericContent(review);
    if (result.suspicious) {
      suspiciousReviews.push({
        review: { ...review, suspicious: true, suspicionReason: result.reason },
        reason: result.reason
      });
      alreadyFlagged.add(review.id);
    }
  });

  const fakeReviewsCount = suspiciousReviews.length;
  const genuineReviewsCount = reviews.length - fakeReviewsCount;

  const reasoning = generateReasoning(fakeReviewsCount, genuineReviewsCount, suspiciousReviews);

  return {
    fakeReviews: fakeReviewsCount,
    genuineReviews: genuineReviewsCount,
    reasoning,
    suspiciousReviews
  };
}

function generateReasoning(
  fakeCount: number,
  genuineCount: number,
  suspiciousReviews: SuspiciousReviewResult[]
): string {
  const total = fakeCount + genuineCount;
  const fakePercentage = ((fakeCount / total) * 100).toFixed(1);

  const reasons = new Set<string>();
  suspiciousReviews.forEach(sr => {
    if (sr.reason.includes('Duplicate')) reasons.add('duplicate content');
    else if (sr.reason.includes('short')) reasons.add('extremely short reviews');
    else if (sr.reason.includes('exaggerated')) reasons.add('exaggerated language');
    else if (sr.reason.includes('mismatch')) reasons.add('rating-text mismatches');
    else if (sr.reason.includes('Unverified')) reasons.add('unverified extreme ratings');
    else if (sr.reason.includes('Generic')) reasons.add('generic content');
  });

  const reasonsList = Array.from(reasons);

  if (fakeCount === 0) {
    return `Analysis found no suspicious reviews among the ${total} reviews examined. All reviews appear to be genuine with natural language patterns and appropriate ratings.`;
  }

  if (fakeCount === total) {
    return `All ${total} reviews show signs of being potentially fake. Key indicators include: ${reasonsList.join(', ')}. Exercise extreme caution with this product.`;
  }

  return `Analysis identified ${fakeCount} potentially fake reviews (${fakePercentage}% of total). Suspicious patterns detected include: ${reasonsList.join(', ')}. The remaining ${genuineCount} reviews appear genuine.`;
}
