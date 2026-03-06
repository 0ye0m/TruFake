'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatisticsSummary } from '@/types';
import { 
  CheckCircle,
  Star,
  FileText,
  Clock
} from 'lucide-react';

interface DetailedStatsCardsProps {
  statistics: StatisticsSummary;
}

export function DetailedStatsCards({ statistics }: DetailedStatsCardsProps) {
  const { 
    totalReviews,
    verifiedPurchases,
    unverifiedPurchases,
    averageRating,
    ratingDistribution,
    averageLength,
    dateRange,
    reviewsPerMonth,
    authenticityMetrics,
    overallQualityScore
  } = statistics;

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-xs text-neutral-500">Total Reviews</p>
          <p className="text-xl font-semibold text-neutral-900 mt-1">{totalReviews}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-xs text-neutral-500">Verified</p>
          <p className="text-xl font-semibold text-emerald-600 mt-1">{verifiedPurchases}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-xs text-neutral-500">Unverified</p>
          <p className="text-xl font-semibold text-amber-600 mt-1">{unverifiedPurchases}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-xs text-neutral-500">Avg Rating</p>
          <p className="text-xl font-semibold text-neutral-900 mt-1 flex items-center gap-1">
            {averageRating.toFixed(1)}
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </p>
        </div>
      </div>

      {/* Authenticity Metrics */}
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-900 flex items-center justify-between">
            <span>Authenticity Metrics</span>
            <span className={`text-sm ${getScoreColor(overallQualityScore)}`}>
              {overallQualityScore}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Verified', score: authenticityMetrics.verifiedPurchaseScore },
              { label: 'Ratings', score: authenticityMetrics.ratingDistributionScore },
              { label: 'Length', score: authenticityMetrics.reviewLengthScore },
              { label: 'Timing', score: authenticityMetrics.timeConsistencyScore },
              { label: 'Language', score: authenticityMetrics.languageQualityScore }
            ].map((metric) => (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">{metric.label}</span>
                  <span className={getScoreColor(metric.score)}>{metric.score}%</span>
                </div>
                <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      metric.score >= 70 ? 'bg-emerald-500' :
                      metric.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Review Length */}
        <Card className="bg-white border-neutral-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Review Length</span>
            </div>
            <p className="text-lg font-semibold text-neutral-900">{averageLength} <span className="text-sm font-normal text-neutral-500">chars avg</span></p>
            <p className="text-xs text-neutral-400 mt-1">
              {averageLength < 50 ? 'Short reviews' : averageLength > 150 ? 'Detailed reviews' : 'Moderate length'}
            </p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-white border-neutral-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Timeline</span>
            </div>
            <p className="text-lg font-semibold text-neutral-900">{dateRange.daysSpan} <span className="text-sm font-normal text-neutral-500">days</span></p>
            <p className="text-xs text-neutral-400 mt-1">
              {reviewsPerMonth} reviews/month
            </p>
          </CardContent>
        </Card>

        {/* Rating Breakdown */}
        <Card className="bg-white border-neutral-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Ratings</span>
            </div>
            <div className="space-y-1">
              {ratingDistribution.slice(0, 3).map((r) => (
                <div key={r.rating} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-neutral-500">{r.rating}★</span>
                  <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400" 
                      style={{ width: `${r.percentage}%` }} 
                    />
                  </div>
                  <span className="w-8 text-neutral-400 text-right">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
