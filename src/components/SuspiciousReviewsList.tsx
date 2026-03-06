'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Review } from '@/types';
import { AlertTriangle, ChevronDown, ChevronUp, Star, User, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuspiciousReviewsListProps {
  reviews: Review[];
}

function ReviewCard({ review }: { review: Review }) {
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

  const score = review.authenticityScore ?? 50;

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
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
          </div>

          {/* Review Text */}
          <p className={cn(
            'text-sm text-neutral-700',
            !isExpanded && 'line-clamp-2'
          )}>
            {review.text}
          </p>

          {/* Suspicion Reason */}
          {review.suspicionReason && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-700 bg-red-100 p-2 rounded">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{review.suspicionReason}</span>
            </div>
          )}

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

        {/* Score */}
        <div className="flex-shrink-0 text-center w-12">
          <div className="relative w-10 h-10 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-200" />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${score} 100`}
                strokeLinecap="round"
                className={score >= 60 ? 'text-emerald-500' : 'text-red-500'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xs font-medium", score >= 60 ? 'text-emerald-600' : 'text-red-600')}>
                {score}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      {review.text.length > 80 && (
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

export function SuspiciousReviewsList({ reviews }: SuspiciousReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-900">
            Suspicious Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
            <p className="text-sm font-medium text-neutral-900">No suspicious reviews detected</p>
            <p className="text-xs text-neutral-500 mt-1">All reviews appear genuine</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900">
          Suspicious Reviews
          <Badge className="ml-2 bg-red-100 text-red-700 hover:bg-red-100 font-normal">
            {reviews.length} flagged
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
