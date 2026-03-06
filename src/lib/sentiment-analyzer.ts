import type { Review } from '@/types';

export interface SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  magnitude: number; // 0 to 1 (strength of sentiment)
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface SentimentAnalysis {
  overall: SentimentResult;
  byReview: Map<string, SentimentResult>;
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  averageScore: number;
  sentimentRatingCorrelation: number; // correlation between sentiment and rating
}

// Positive and negative word lists for sentiment analysis
const POSITIVE_WORDS = new Set([
  'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'good', 'love',
  'perfect', 'wonderful', 'best', 'outstanding', 'superb', 'brilliant',
  'incredible', 'magnificent', 'exceptional', 'delighted', 'happy', 'satisfied',
  'impressed', 'recommend', 'beautiful', 'quality', 'worth', 'value', 'fast',
  'easy', 'comfortable', 'durable', 'reliable', 'exceeded', 'expectations',
  'flawless', 'premium', 'stunning', 'elegant', 'sleek', 'solid', 'perfectly'
]);

const NEGATIVE_WORDS = new Set([
  'terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'disappointing',
  'disappointed', 'poor', 'waste', 'broken', 'defective', 'cheap', 'flimsy',
  'useless', 'returned', 'return', 'refund', 'garbage', 'junk', 'scam',
  'regret', 'avoid', 'never', 'stopped', 'failed', 'broke', 'damaged',
  'misleading', 'false', 'wrong', 'missing', 'incorrect', 'problem', 'issue',
  'painful', 'frustrating', 'annoying', 'unreliable', 'uncomfortable'
]);

const INTENSIFIERS = new Set([
  'very', 'really', 'extremely', 'absolutely', 'completely', 'totally',
  'utterly', 'highly', 'incredibly', 'exceptionally', 'remarkably'
]);

const NEGATORS = new Set([
  'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
  'hardly', 'barely', 'scarcely', "don't", "doesn't", "didn't", "won't",
  "wouldn't", "shouldn't", "can't", "couldn't"
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

export function analyzeSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);
  
  if (tokens.length === 0) {
    return { score: 0, magnitude: 0, label: 'neutral', confidence: 0.5 };
  }
  
  let positiveCount = 0;
  let negativeCount = 0;
  let totalSentimentWords = 0;
  let intensity = 1;
  let negation = false;
  
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const prevWord = i > 0 ? tokens[i - 1] : '';
    
    // Check for intensifiers
    if (INTENSIFIERS.has(word)) {
      intensity = 1.5;
      continue;
    }
    
    // Check for negators (affects next word)
    if (NEGATORS.has(word)) {
      negation = true;
      continue;
    }
    
    // Count sentiment words
    if (POSITIVE_WORDS.has(word)) {
      totalSentimentWords++;
      if (negation) {
        negativeCount += intensity;
        negation = false;
      } else {
        positiveCount += intensity;
      }
    } else if (NEGATIVE_WORDS.has(word)) {
      totalSentimentWords++;
      if (negation) {
        positiveCount += intensity;
        negation = false;
      } else {
        negativeCount += intensity;
      }
    }
    
    intensity = 1; // Reset intensity
  }
  
  // Calculate sentiment score (-1 to 1)
  const totalSentiment = positiveCount + negativeCount;
  let score = 0;
  
  if (totalSentiment > 0) {
    score = (positiveCount - negativeCount) / (positiveCount + negativeCount);
  }
  
  // Calculate magnitude (strength of sentiment)
  const magnitude = Math.min(1, totalSentiment / Math.max(tokens.length * 0.1, 1));
  
  // Determine label
  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) {
    label = 'positive';
  } else if (score < -0.1) {
    label = 'negative';
  } else {
    label = 'neutral';
  }
  
  // Calculate confidence based on sentiment word density
  const confidence = Math.min(1, (totalSentimentWords / tokens.length) * 3 + 0.3);
  
  return {
    score: Math.round(score * 100) / 100,
    magnitude: Math.round(magnitude * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100
  };
}

export function analyzeAllSentiments(reviews: Review[]): SentimentAnalysis {
  const byReview = new Map<string, SentimentResult>();
  let totalScore = 0;
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  
  // For correlation calculation
  let sumX = 0; // sentiment scores
  let sumY = 0; // ratings
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  const n = reviews.length;
  
  for (const review of reviews) {
    const sentiment = analyzeSentiment(review.text);
    byReview.set(review.id, sentiment);
    totalScore += sentiment.score;
    
    // Count distribution
    if (sentiment.label === 'positive') positive++;
    else if (sentiment.label === 'negative') negative++;
    else neutral++;
    
    // Correlation calculation
    const normalizedRating = (review.rating - 3) / 2; // -1 to 1
    sumX += sentiment.score;
    sumY += normalizedRating;
    sumXY += sentiment.score * normalizedRating;
    sumX2 += sentiment.score * sentiment.score;
    sumY2 += normalizedRating * normalizedRating;
  }
  
  // Calculate Pearson correlation
  let correlation = 0;
  if (n > 1) {
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator > 0) {
      correlation = (n * sumXY - sumX * sumY) / denominator;
    }
  }
  
  const overall: SentimentResult = {
    score: Math.round((totalScore / reviews.length) * 100) / 100,
    magnitude: 0,
    label: totalScore / reviews.length > 0.1 ? 'positive' : 
           totalScore / reviews.length < -0.1 ? 'negative' : 'neutral',
    confidence: 0.8
  };
  
  return {
    overall,
    byReview,
    distribution: {
      positive: Math.round((positive / reviews.length) * 100),
      negative: Math.round((negative / reviews.length) * 100),
      neutral: Math.round((neutral / reviews.length) * 100)
    },
    averageScore: Math.round((totalScore / reviews.length) * 100) / 100,
    sentimentRatingCorrelation: Math.round(correlation * 100) / 100
  };
}

// Check for sentiment-rating mismatch
export function detectSentimentRatingMismatch(review: Review): {
  mismatch: boolean;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
} {
  const sentiment = analyzeSentiment(review.text);
  
  // Define expected sentiment for each rating
  const expectedSentiment: Record<number, { min: number; max: number }> = {
    1: { min: -1, max: -0.2 },
    2: { min: -0.5, max: 0.2 },
    3: { min: -0.3, max: 0.3 },
    4: { min: 0.2, max: 1 },
    5: { min: 0.5, max: 1 }
  };
  
  const expected = expectedSentiment[review.rating];
  const mismatch = sentiment.score < expected.min || sentiment.score > expected.max;
  
  if (!mismatch) {
    return { mismatch: false, severity: 'low', explanation: '' };
  }
  
  // Calculate severity
  const deviation = Math.max(
    Math.abs(sentiment.score - expected.min),
    Math.abs(sentiment.score - expected.max)
  );
  
  let severity: 'low' | 'medium' | 'high';
  let explanation = '';
  
  if (deviation > 0.5) {
    severity = 'high';
    explanation = `${review.rating}-star review has ${sentiment.label} sentiment (${sentiment.score.toFixed(2)}) - strong mismatch`;
  } else if (deviation > 0.3) {
    severity = 'medium';
    explanation = `${review.rating}-star review has ${sentiment.label} sentiment - notable mismatch`;
  } else {
    severity = 'low';
    explanation = `Minor sentiment-rating inconsistency detected`;
  }
  
  return { mismatch: true, severity, explanation };
}
