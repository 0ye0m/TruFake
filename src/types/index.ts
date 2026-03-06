export interface Review {
  id: string;
  text: string;
  rating: number;
  reviewerName: string;
  date: string;
  verifiedPurchase: boolean;
  suspicious?: boolean;
  suspicionReason?: string;
  authenticityScore?: number;
}

export interface ProductInfo {
  title: string;
  price: string;
  imageUrl: string;
  totalReviews: number;
  averageRating: number;
  source: string;
  description?: string;
  url?: string;
}

export interface TrustScore {
  score: number;
  fakePercentage: number;
  genuinePercentage: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface ScrapeResponse {
  success: boolean;
  productInfo: ProductInfo | null;
  reviews: Review[];
  error?: string;
}

export interface AnalysisResult {
  fakeReviews: number;
  genuineReviews: number;
  reasoning: string;
  suspiciousReviews: Review[];
  trustScore: TrustScore;
  // Extended analysis
  sentimentAnalysis?: SentimentSummary;
  patternAnalysis?: PatternSummary;
  detailedStatistics?: StatisticsSummary;
  keywordCloud?: KeywordData[];
  reviewTimeline?: TimelineData[];
  individualScores?: ReviewScore[];
}

// Sentiment Analysis Types
export interface SentimentSummary {
  overall: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  sentimentRatingCorrelation: number;
}

// Pattern Analysis Types
export interface PatternSummary {
  reviewVelocity: {
    score: number;
    hasBurstPattern: boolean;
  };
  ratingPattern: {
    isNatural: boolean;
    suspiciousRatingBias: 'none' | 'positive' | 'negative';
    score: number;
  };
  textPatterns: {
    duplicateContent: number;
    templateLikeReviews: number;
    excessivePunctuation: number;
  };
  reviewerPatterns: {
    suspiciousNames: number;
    unverifiedRate: number;
  };
  overallPatternScore: number;
  flags: string[];
}

// Statistics Types
export interface StatisticsSummary {
  totalReviews: number;
  verifiedPurchases: number;
  unverifiedPurchases: number;
  averageRating: number;
  ratingDistribution: RatingDistribution[];
  averageLength: number;
  dateRange: {
    earliest: string;
    latest: string;
    daysSpan: number;
  };
  reviewsPerMonth: number;
  authenticityMetrics: {
    verifiedPurchaseScore: number;
    ratingDistributionScore: number;
    reviewLengthScore: number;
    timeConsistencyScore: number;
    languageQualityScore: number;
  };
  overallQualityScore: number;
}

// Keyword Cloud Types
export interface KeywordData {
  word: string;
  count: number;
  rating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Timeline Types
export interface TimelineData {
  date: string;
  count: number;
  averageRating: number;
  verifiedCount: number;
}

// Individual Review Score
export interface ReviewScore {
  reviewId: string;
  score: number;
  factors: {
    length: number;
    verified: number;
    sentimentMatch: number;
    languageQuality: number;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  result: AnalysisResult | null;
  error?: string;
}
