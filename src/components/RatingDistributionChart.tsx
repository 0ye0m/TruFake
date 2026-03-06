'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Review } from '@/types';
import { calculateRatingDistribution } from '@/lib/trust-score';

interface RatingDistributionChartProps {
  reviews: Review[];
}

export function RatingDistributionChart({ reviews }: RatingDistributionChartProps) {
  const distribution = calculateRatingDistribution(reviews);

  const getBarColor = (rating: number) => {
    const colors: Record<number, string> = {
      5: '#22c55e',
      4: '#84cc16',
      3: '#eab308',
      2: '#f97316',
      1: '#ef4444'
    };
    return colors[rating] || '#737373';
  };

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900">
          Rating Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} />
              <YAxis
                dataKey="rating"
                type="category"
                tickFormatter={(value) => `${value}★`}
                tick={{ fill: '#737373', fontSize: 11 }}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string, props: { payload: { rating: number; percentage: number } }) => [
                  `${value} reviews (${props.payload.percentage}%)`,
                  `${props.payload.rating} Stars`
                ]}
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {distribution.map((entry) => (
                  <Cell key={`cell-${entry.rating}`} fill={getBarColor(entry.rating)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-red-600">
                {distribution.filter(d => d.rating <= 2).reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-xs text-neutral-500">Negative</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-500">
                {distribution.filter(d => d.rating === 3).reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-xs text-neutral-500">Neutral</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600">
                {distribution.filter(d => d.rating >= 4).reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-xs text-neutral-500">Positive</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
