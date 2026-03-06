// History storage utility for TruFake
// Uses localStorage to persist analysis history

import type { ProductInfo, AnalysisResult } from '@/types';

export interface HistoryItem {
  id: string;
  timestamp: number;
  productInfo: ProductInfo;
  analysisResult: {
    trustScore: number;
    fakeReviews: number;
    genuineReviews: number;
    totalReviews: number;
  };
  url: string;
}

const STORAGE_KEY = 'trufake_history';
const MAX_HISTORY_ITEMS = 50;

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get all history items
export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as HistoryItem[];
    return history.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

// Add item to history
export function addToHistory(
  productInfo: ProductInfo,
  analysisResult: AnalysisResult,
  url: string
): HistoryItem {
  const item: HistoryItem = {
    id: generateId(),
    timestamp: Date.now(),
    productInfo: {
      title: productInfo.title,
      price: productInfo.price,
      imageUrl: productInfo.imageUrl,
      totalReviews: productInfo.totalReviews,
      averageRating: productInfo.averageRating,
      source: productInfo.source,
      url: productInfo.url
    },
    analysisResult: {
      trustScore: analysisResult.trustScore.score,
      fakeReviews: analysisResult.fakeReviews,
      genuineReviews: analysisResult.genuineReviews,
      totalReviews: analysisResult.fakeReviews + analysisResult.genuineReviews
    },
    url
  };
  
  try {
    const history = getHistory();
    
    // Check if this product already exists (same URL)
    const existingIndex = history.findIndex(h => h.url === url);
    if (existingIndex >= 0) {
      // Remove old entry and add new one at the top
      history.splice(existingIndex, 1);
    }
    
    // Add new item at the beginning
    history.unshift(item);
    
    // Keep only the last MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    
    return item;
  } catch (error) {
    console.error('Failed to save to history:', error);
    return item;
  }
}

// Remove item from history
export function removeFromHistory(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from history:', error);
  }
}

// Clear all history
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Get trust score label
export function getTrustLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600' };
  if (score >= 60) return { label: 'Good', color: 'text-emerald-600' };
  if (score >= 40) return { label: 'Fair', color: 'text-amber-600' };
  if (score >= 20) return { label: 'Poor', color: 'text-red-600' };
  return { label: 'Very Poor', color: 'text-red-600' };
}
