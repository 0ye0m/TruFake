'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Review, ReviewScore } from '@/types';
import { 
  ChevronDown, 
  ChevronUp, 
  Star, 
  User, 
  Calendar, 
  CheckCircle,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedReviewsListProps {
  reviews: Review[];
  scores?: ReviewScore[];
  showAll?: boolean;
}

function ReviewCard({ review, score }: { review: Review; score?: ReviewScore }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-3 w-3',
          i < rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
        )}
      />
    ));
  };

  const getAuthenticityColor = (s: number) => {
    if (s >= 70) return 'text-emerald-600';
    if (s >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const authenticityScore = score?.score ?? review.authenticityScore ?? 50;

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-colors",
      review.suspicious ? "bg-red-50 border-red-200" : "bg-white border-neutral-200"
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {renderStars(review.rating)}
            </div>
            {review.verifiedPurchase ? (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50 font-normal">
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-neutral-500 border-neutral-300 bg-neutral-50 font-normal">
                Unverified
              </Badge>
            )}
            {review.suspicious && (
              <Badge className="text-xs bg-red-100 text-red-700 font-normal">
                Suspicious
              </Badge>
            )}
          </div>

          {/* Review Text */}
          <p className={cn(
            'text-sm text-neutral-700',
            !isExpanded && 'line-clamp-2'
          )}>
            {review.text}
          </p>

          {/* Meta Info */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{review.reviewerName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{review.date}</span>
            </div>
          </div>
        </div>

        {/* Authenticity Score */}
        <div className="flex-shrink-0 text-center w-14">
          <div className="relative w-12 h-12 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-neutral-100"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${authenticityScore} 100`}
                strokeLinecap="round"
                className={getAuthenticityColor(authenticityScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xs font-medium", getAuthenticityColor(authenticityScore))}>
                {authenticityScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      {review.text.length > 100 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show more <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function EnhancedReviewsList({ reviews, scores = [], showAll = false }: EnhancedReviewsListProps) {
  const [showAllReviews, setShowAllReviews] = useState(showAll);
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'genuine'>('all');

  const suspiciousReviews = reviews.filter(r => r.suspicious);
  const genuineReviews = reviews.filter(r => !r.suspicious);

  const filteredReviews = filter === 'suspicious' 
    ? suspiciousReviews 
    : filter === 'genuine' 
      ? genuineReviews 
      : reviews;

  const displayReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);

  const getScoreMap = () => {
    const map = new Map<string, typeof scores[0]>();
    scores.forEach(s => map.set(s.reviewId, s));
    return map;
  };

  const scoreMap = getScoreMap();

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900 flex items-center justify-between">
          <span>All Reviews</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-emerald-600">{genuineReviews.length} genuine</span>
            <span className="text-xs font-normal text-red-600">{suspiciousReviews.length} suspicious</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'suspicious', 'genuine'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium",
                filter === f 
                  ? "bg-neutral-900 text-white" 
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {f === 'all' ? 'All' : f === 'suspicious' ? 'Suspicious' : 'Genuine'}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {displayReviews.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p className="text-sm">No reviews to display</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {displayReviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                score={scoreMap.get(review.id)}
              />
            ))}
          </div>
        )}

        {/* Show More/Less Button */}
        {filteredReviews.length > 10 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900"
            >
              {showAllReviews ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show All {filteredReviews.length} Reviews
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
