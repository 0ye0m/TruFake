'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { HistoryItem } from '@/lib/history';
import { formatTimestamp, getTrustLabel, removeFromHistory, clearHistory } from '@/lib/history';
import { 
  Clock, 
  Trash2, 
  ExternalLink, 
  Shield, 
  ChevronRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (url: string) => void;
  onRefresh: () => void;
}

export function HistoryPanel({ history, onSelect, onRefresh }: HistoryPanelProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    onRefresh();
  };

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      onRefresh();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-400" />
          <h3 className="text-sm font-medium text-neutral-700">Recent Analyses</h3>
          <span className="text-xs text-neutral-400">({history.length})</span>
        </div>
        <button
          onClick={handleClear}
          className={`text-xs px-3 py-1 rounded-md transition-colors ${
            confirmClear 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'text-neutral-500 hover:text-red-600 hover:bg-neutral-100'
          }`}
        >
          {confirmClear ? 'Confirm Clear?' : 'Clear All'}
        </button>
      </div>
      
      <div className="space-y-2">
        {history.slice(0, 10).map((item) => {
          const trust = getTrustLabel(item.analysisResult.trustScore);
          const fakePercent = Math.round((item.analysisResult.fakeReviews / item.analysisResult.totalReviews) * 100);
          
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.url)}
              className="group flex items-center gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-neutral-300 hover:bg-white cursor-pointer transition-all"
            >
              {/* Trust Score Badge */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-neutral-200 flex flex-col items-center justify-center">
                <span className={`text-lg font-semibold ${trust.color}`}>
                  {item.analysisResult.trustScore}
                </span>
                <span className="text-[10px] text-neutral-400">score</span>
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-900">
                  {item.productInfo.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-neutral-500">
                    {item.productInfo.source}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">{item.analysisResult.genuineReviews}</span>
                </div>
                {item.analysisResult.fakeReviews > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-red-600 font-medium">{item.analysisResult.fakeReviews}</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleRemove(item.id, e)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
