'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type { TimelineData } from '@/types';
import { Calendar } from 'lucide-react';

interface ReviewTimelineChartProps {
  data: TimelineData[];
}

export function ReviewTimelineChart({ data }: ReviewTimelineChartProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-900">
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-neutral-400 text-sm">
            No timeline data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by month
  const monthlyData = data.reduce((acc, item) => {
    const month = item.date.substring(0, 7);
    const existing = acc.find(d => d.date === month);
    if (existing) {
      existing.count += item.count;
      existing.averageRating = Math.round(
        ((existing.averageRating * (existing.count - item.count)) + (item.averageRating * item.count)) / existing.count * 10
      ) / 10;
      existing.verifiedCount += item.verifiedCount;
    } else {
      acc.push({
        date: month,
        count: item.count,
        averageRating: item.averageRating,
        verifiedCount: item.verifiedCount
      });
    }
    return acc;
  }, [] as TimelineData[]).sort((a, b) => a.date.localeCompare(b.date));

  const displayData = monthlyData.slice(-12);

  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900">
          Review Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#171717" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#171717" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1]} '${year.slice(2)}`;
                }}
                tick={{ fill: '#737373', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#737373', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Reviews"
                stroke="#171717"
                strokeWidth={1.5}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats */}
        <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-500">
          <span>Peak: <strong className="text-neutral-700">{Math.max(...displayData.map(d => d.count))} reviews</strong> in a month</span>
        </div>
      </CardContent>
    </Card>
  );
}
