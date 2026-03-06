'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KeywordData } from '@/types';
import { Cloud } from 'lucide-react';

interface KeywordCloudProps {
  keywords: KeywordData[];
}

export function KeywordCloud({ keywords }: KeywordCloudProps) {
  if (keywords.length === 0) {
    return (
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-900">
            Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-neutral-400 text-sm">
            No keywords to analyze
          </div>
        </CardContent>
      </Card>
    );
  }

  const topKeywords = [...keywords]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const maxCount = Math.max(...topKeywords.map(k => k.count));
  const minCount = Math.min(...topKeywords.map(k => k.count));
  const range = maxCount - minCount || 1;

  const getFontSize = (count: number): string => {
    const normalized = (count - minCount) / range;
    const size = 11 + normalized * 14;
    return `${size}px`;
  };

  const getColor = (keyword: KeywordData): string => {
    if (keyword.rating >= 4) return 'text-emerald-600';
    if (keyword.rating <= 2) return 'text-red-600';
    return 'text-neutral-600';
  };

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900">
          Top Keywords
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center p-4 bg-neutral-50 rounded-lg min-h-32">
          {topKeywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700"
              style={{ fontSize: getFontSize(keyword.count) }}
            >
              <span className={getColor(keyword)}>{keyword.word}</span>
              <span className="text-xs text-neutral-400">{keyword.count}</span>
            </span>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500" /> Positive
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-neutral-400" /> Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500" /> Negative
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
