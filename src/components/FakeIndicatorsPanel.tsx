'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PatternSummary } from '@/types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  FileText, 
  Users,
  Shield
} from 'lucide-react';

interface FakeIndicatorsPanelProps {
  patternAnalysis: PatternSummary;
}

export function FakeIndicatorsPanel({ patternAnalysis }: FakeIndicatorsPanelProps) {
  const { 
    reviewVelocity, 
    ratingPattern, 
    textPatterns, 
    reviewerPatterns, 
    overallPatternScore,
    flags 
  } = patternAnalysis;

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900 flex items-center justify-between">
          <span>Detection Indicators</span>
          <span className={`text-sm font-medium ${getScoreColor(overallPatternScore)}`}>
            {overallPatternScore}/100
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                overallPatternScore >= 70 ? 'bg-emerald-500' :
                overallPatternScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallPatternScore}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Review Velocity */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Velocity</span>
            </div>
            <p className={`text-lg font-semibold ${getScoreColor(reviewVelocity.score)}`}>
              {reviewVelocity.score}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {reviewVelocity.hasBurstPattern ? 'Burst detected' : 'Natural pattern'}
            </p>
          </div>

          {/* Rating Pattern */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Ratings</span>
            </div>
            <p className={`text-lg font-semibold ${getScoreColor(ratingPattern.score)}`}>
              {ratingPattern.score}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {ratingPattern.suspiciousRatingBias !== 'none' ? `${ratingPattern.suspiciousRatingBias} bias` : 'Natural'}
            </p>
          </div>

          {/* Text Patterns */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Text Quality</span>
            </div>
            <p className="text-lg font-semibold text-neutral-900">
              {textPatterns.duplicateContent}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">Duplicate content</p>
          </div>

          {/* Reviewer Patterns */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-600">Reviewers</span>
            </div>
            <p className="text-lg font-semibold text-neutral-900">
              {reviewerPatterns.unverifiedRate}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">Unverified</p>
          </div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-xs font-medium text-neutral-600 mb-2">Issues Detected</p>
            <div className="space-y-1">
              {flags.slice(0, 3).map((flag, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-neutral-600">
                  <span className="text-amber-500">•</span>
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
