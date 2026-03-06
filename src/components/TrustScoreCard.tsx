'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrustScore } from '@/types';
import { Shield, CheckCircle } from 'lucide-react';

interface TrustScoreCardProps {
  trustScore: TrustScore;
}

export function TrustScoreCard({ trustScore }: TrustScoreCardProps) {
  const { score, fakePercentage, genuinePercentage } = trustScore;

  // Calculate stroke dash for circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 70) return { ring: 'stroke-emerald-500', text: 'text-emerald-600' };
    if (score >= 40) return { ring: 'stroke-amber-500', text: 'text-amber-600' };
    return { ring: 'stroke-red-500', text: 'text-red-600' };
  };

  const getMessage = () => {
    if (score >= 90) return 'Excellent trust score';
    if (score >= 70) return 'Good trust score';
    if (score >= 50) return 'Fair trust score';
    if (score >= 30) return 'Low trust score';
    return 'Very low trust score';
  };

  const colors = getColor();

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900">
          Trust Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Circular Progress Gauge */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              <circle
                cx="65" cy="65" r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-neutral-100"
              />
              <circle
                cx="65" cy="65" r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={colors.ring}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 0.8s ease-out'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-semibold ${colors.text}`}>{score}</span>
              <span className="text-xs text-neutral-500">/ 100</span>
            </div>
          </div>

          {/* Percentage Breakdown */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Genuine</span>
              <span className="font-medium text-emerald-600">{genuinePercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Suspicious</span>
              <span className="font-medium text-red-600">{fakePercentage}%</span>
            </div>
          </div>

          {/* Trust Message */}
          <div className="mt-4 p-3 rounded-lg bg-neutral-50 w-full">
            <p className="text-xs text-neutral-600 text-center">{getMessage()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
