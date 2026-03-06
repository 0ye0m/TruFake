'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SentimentSummary } from '@/types';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentDistributionChartProps {
  sentiment: SentimentSummary;
}

export function SentimentDistributionChart({ sentiment }: SentimentDistributionChartProps) {
  const { distribution, overall, sentimentRatingCorrelation } = sentiment;

  const data = [
    { name: 'Positive', value: distribution.positive, color: '#22c55e' },
    { name: 'Neutral', value: distribution.neutral, color: '#eab308' },
    { name: 'Negative', value: distribution.negative, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const getSentimentIcon = () => {
    if (overall.label === 'positive') return <Smile className="h-4 w-4 text-emerald-500" />;
    if (overall.label === 'negative') return <Frown className="h-4 w-4 text-red-500" />;
    return <Meh className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900 flex items-center gap-2">
          Sentiment
          {getSentimentIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value}%`, 'Percentage']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Details */}
        <div className="mt-2 pt-4 border-t border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Overall</span>
            <span className={`font-medium capitalize ${
              overall.label === 'positive' ? 'text-emerald-600' :
              overall.label === 'negative' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {overall.label}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Correlation</span>
            <span className={`font-medium ${
              sentimentRatingCorrelation > 0.5 ? 'text-emerald-600' :
              sentimentRatingCorrelation < 0.2 ? 'text-red-600' : 'text-amber-600'
            }`}>
              {sentimentRatingCorrelation.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
