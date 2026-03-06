'use client';

import { ProductInfoCard } from '@/components/ProductInfoCard';
import { TrustScoreCard } from '@/components/TrustScoreCard';
import { RatingDistributionChart } from '@/components/RatingDistributionChart';
import { SuspiciousReviewsList } from '@/components/SuspiciousReviewsList';
import { ReviewTimelineChart } from '@/components/ReviewTimelineChart';
import { SentimentDistributionChart } from '@/components/SentimentDistributionChart';
import { KeywordCloud } from '@/components/KeywordCloud';
import { FakeIndicatorsPanel } from '@/components/FakeIndicatorsPanel';
import { DetailedStatsCards } from '@/components/DetailedStatsCards';
import { EnhancedReviewsList } from '@/components/EnhancedReviewsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProductInfo, Review, AnalysisResult } from '@/types';
import { 
  RefreshCw, 
  Shield, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewAnalysisDashboardProps {
  productInfo: ProductInfo;
  reviews: Review[];
  analysisResult: AnalysisResult;
  onRetry?: () => void;
}

export function ReviewAnalysisDashboard({
  productInfo,
  reviews,
  analysisResult,
  onRetry
}: ReviewAnalysisDashboardProps) {
  const { 
    fakeReviews, 
    genuineReviews, 
    reasoning, 
    suspiciousReviews, 
    trustScore,
    sentimentAnalysis,
    patternAnalysis,
    detailedStatistics,
    keywordCloud,
    reviewTimeline,
    individualScores
  } = analysisResult;

  const fakePercent = reviews.length > 0 ? ((fakeReviews / reviews.length) * 100).toFixed(0) : '0';
  const genuinePercent = reviews.length > 0 ? ((genuineReviews / reviews.length) * 100).toFixed(0) : '0';

  // Determine risk level
  const riskLevel = fakePercent >= '30' ? 'high' : fakePercent >= '15' ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      {/* Risk Banner */}
      {riskLevel === 'high' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">High Risk Detected</p>
            <p className="text-xs text-red-600">{fakePercent}% of reviews appear suspicious</p>
          </div>
        </div>
      )}

      {riskLevel === 'medium' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Moderate Risk</p>
            <p className="text-xs text-amber-600">Some suspicious reviews detected</p>
          </div>
        </div>
      )}

      {riskLevel === 'low' && fakeReviews > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Low Risk</p>
            <p className="text-xs text-emerald-600">Most reviews appear genuine</p>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-2xl font-semibold text-neutral-900">{reviews.length}</p>
          <p className="text-sm text-neutral-500">Total Reviews</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-2xl font-semibold text-emerald-600">{genuineReviews}</p>
          <p className="text-sm text-neutral-500">Genuine ({genuinePercent}%)</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-2xl font-semibold text-red-600">{fakeReviews}</p>
          <p className="text-sm text-neutral-500">Suspicious ({fakePercent}%)</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-neutral-200">
          <p className="text-2xl font-semibold text-neutral-900">{productInfo.averageRating.toFixed(1)}</p>
          <p className="text-sm text-neutral-500">Avg Rating</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-neutral-100 h-10 rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 rounded-md text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 rounded-md text-sm">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 rounded-md text-sm">
            Insights
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 rounded-md text-sm">
            Reviews
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductInfoCard productInfo={productInfo} />
            <TrustScoreCard trustScore={trustScore} />
          </div>

          {patternAnalysis && (
            <FakeIndicatorsPanel patternAnalysis={patternAnalysis} />
          )}

          <Card className="bg-white border-neutral-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-900">
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 leading-relaxed">{reasoning}</p>
            </CardContent>
          </Card>

          <SuspiciousReviewsList reviews={suspiciousReviews} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {detailedStatistics && (
            <DetailedStatsCards statistics={detailedStatistics} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RatingDistributionChart reviews={reviews} />
            {sentimentAnalysis && (
              <SentimentDistributionChart sentiment={sentimentAnalysis} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reviewTimeline && reviewTimeline.length > 0 && (
              <ReviewTimelineChart data={reviewTimeline} />
            )}
            {keywordCloud && keywordCloud.length > 0 && (
              <KeywordCloud keywords={keywordCloud} />
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {patternAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-neutral-900">
                    Review Velocity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Score</span>
                    <span className={`text-sm font-medium ${patternAnalysis.reviewVelocity.score >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {patternAnalysis.reviewVelocity.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {patternAnalysis.reviewVelocity.hasBurstPattern 
                      ? 'Burst pattern detected - reviews posted in short time window.'
                      : 'Natural posting pattern over time.'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-neutral-900">
                    Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Score</span>
                    <span className={`text-sm font-medium ${patternAnalysis.ratingPattern.score >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {patternAnalysis.ratingPattern.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {patternAnalysis.ratingPattern.suspiciousRatingBias !== 'none'
                      ? `Suspicious ${patternAnalysis.ratingPattern.suspiciousRatingBias} bias detected.`
                      : 'Natural rating distribution.'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {patternAnalysis?.flags && patternAnalysis.flags.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-amber-800">
                  Detected Issues ({patternAnalysis.flags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {patternAnalysis.flags.map((flag, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                      <span className="text-amber-500">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {individualScores && (
            <EnhancedReviewsList 
              reviews={reviews.map((r, i) => ({
                ...r,
                authenticityScore: individualScores[i]?.score ?? 50
              }))} 
              scores={individualScores} 
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Retry Button */}
      {onRetry && (
        <div className="flex justify-center pt-6 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" />
            Analyze Another Product
          </Button>
        </div>
      )}
    </div>
  );
}
