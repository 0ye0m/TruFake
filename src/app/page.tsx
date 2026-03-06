'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ReviewAnalysisDashboard } from '@/components/ReviewAnalysisDashboard';
import { HistoryPanel } from '@/components/HistoryPanel';
import type { ProductInfo, Review, AnalysisResult } from '@/types';
import type { HistoryItem } from '@/lib/history';
import { addToHistory, getHistory } from '@/lib/history';
import {
  Shield,
  Loader2,
  RefreshCw,
  Eye,
  Brain,
  Zap,
  Globe,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';

type AppState = 'idle' | 'scraping' | 'analyzing' | 'results' | 'error';

const SUPPORTED_PLATFORMS = [
  { name: 'Amazon', domains: 'amazon.com, amazon.in, amazon.co.uk', icon: '🛒' },
  { name: 'Flipkart', domains: 'flipkart.com', icon: '📦' },
  { name: 'eBay', domains: 'ebay.com', icon: '🏷️' },
  { name: 'Walmart', domains: 'walmart.com', icon: '🏪' },
  { name: 'Best Buy', domains: 'bestbuy.com', icon: '💻' },
  { name: 'AliExpress', domains: 'aliexpress.com', icon: '🌐' },
  { name: 'Target', domains: 'target.com', icon: '🎯' },
  { name: 'Etsy', domains: 'etsy.com', icon: '🎨' },
  { name: 'Myntra', domains: 'myntra.com', icon: '👕' },
  { name: 'Snapdeal', domains: 'snapdeal.com', icon: '💳' },
  { name: 'Meesho', domains: 'meesho.com', icon: '📱' },
  { name: 'Newegg', domains: 'newegg.com', icon: '🥚' },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryUrl, setCurrentHistoryUrl] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const handleSubmit = async (e: React.FormEvent | null, urlToAnalyze?: string) => {
    const targetUrl = urlToAnalyze || url;
    
    if (e) e.preventDefault();

    if (!targetUrl.trim()) {
      setError('Please enter a product URL');
      return;
    }

    setError(null);
    setState('scraping');
    setProgress(0);
    setCurrentHistoryUrl(targetUrl);

    try {
      // Step 1: Scrape the product (REAL DATA ONLY)
      setProgress(15);
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() })
      });

      const scrapeData = await scrapeResponse.json();

      if (!scrapeData.success) {
        throw new Error(scrapeData.error || 'Failed to fetch product data');
      }

      setProductInfo(scrapeData.productInfo);
      setReviews(scrapeData.reviews);
      setProgress(50);

      // Step 2: Analyze the reviews
      setState('analyzing');
      setProgress(60);

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: scrapeData.reviews,
          productInfo: scrapeData.productInfo
        })
      });

      setProgress(90);
      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success) {
        throw new Error(analyzeData.error || 'Failed to analyze reviews');
      }

      setProgress(100);
      setAnalysisResult(analyzeData.result);
      setState('results');
      
      // Save to history
      addToHistory(scrapeData.productInfo, analyzeData.result, targetUrl.trim());
      refreshHistory();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('error');
    }
  };

  const handleRetry = () => {
    setUrl('');
    setError(null);
    setProductInfo(null);
    setReviews([]);
    setAnalysisResult(null);
    setProgress(0);
    setState('idle');
    setCurrentHistoryUrl(null);
  };

  const handleHistorySelect = (historyUrl: string) => {
    setUrl(historyUrl);
    handleSubmit(null, historyUrl);
  };

  const displayedPlatforms = showAllPlatforms ? SUPPORTED_PLATFORMS : SUPPORTED_PLATFORMS.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-neutral-900 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-neutral-900">TruFake</span>
            </div>
            <div className="flex items-center gap-4">
              {history.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Clock className="h-4 w-4" />
                  <span>{history.length} analyses</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Globe className="h-4 w-4" />
                <span>{SUPPORTED_PLATFORMS.length} Platforms</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        {state === 'idle' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-neutral-900 mb-4">
                Detect Fake Reviews
              </h1>
              <p className="text-lg text-neutral-600">
                Paste a product URL from any supported e-commerce platform to analyze reviews for authenticity.
              </p>
            </div>

            {/* URL Input Form */}
            <Card className="border-neutral-200 shadow-sm">
              <CardContent className="p-6">
                <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium text-neutral-700">
                      Product URL
                    </label>
                    <div className="relative">
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://www.amazon.com/dp/... or any supported platform"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="h-12 text-base bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-neutral-900"
                      />
                    </div>
                    <p className="text-xs text-neutral-500">
                      Supports Amazon, Flipkart, eBay, Walmart, Best Buy, AliExpress, Target, Etsy, Myntra, Snapdeal, Meesho, Newegg
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white"
                    disabled={!url.trim()}
                  >
                    {url.trim() ? (
                      <>
                        Analyze Reviews
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      'Enter a URL to analyze'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Supported Platforms */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-700">Supported Platforms</h3>
                <button
                  onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                >
                  {showAllPlatforms ? 'Show less' : `Show all ${SUPPORTED_PLATFORMS.length}`}
                  {showAllPlatforms ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayedPlatforms.map((platform) => (
                  <div
                    key={platform.name}
                    className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <span className="text-lg">{platform.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{platform.name}</p>
                      <p className="text-xs text-neutral-500">{platform.domains}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <HistoryPanel
                history={history}
                onSelect={handleHistorySelect}
                onRefresh={refreshHistory}
              />
            )}

            {/* Features */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              {[
                { icon: Brain, title: 'AI Analysis', desc: 'Powered by Gemini' },
                { icon: Eye, title: 'Real Data', desc: 'Live fetching' },
                { icon: Zap, title: 'Fast Results', desc: 'Under 30 seconds' }
              ].map((feature, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex p-2.5 rounded-lg bg-neutral-100 mb-3">
                    <feature.icon className="h-5 w-5 text-neutral-600" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900">{feature.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading States */}
        {(state === 'scraping' || state === 'analyzing') && (
          <div className="max-w-md mx-auto">
            <Card className="border-neutral-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mx-auto mb-4" />
                <h3 className="text-base font-medium text-neutral-900 mb-1">
                  {state === 'scraping' ? 'Fetching Product Data' : 'Analyzing Reviews'}
                </h3>
                <p className="text-sm text-neutral-500 mb-6">
                  {state === 'scraping'
                    ? 'Extracting reviews from the product page'
                    : 'Running AI analysis to detect patterns'}
                </p>
                
                {/* Progress Steps */}
                <div className="space-y-2 text-left">
                  {[
                    { label: 'Connect to product page', done: progress >= 15 },
                    { label: 'Extract reviews', done: progress >= 50 },
                    { label: 'AI analysis', done: progress >= 70 },
                    { label: 'Generate report', done: progress >= 100 }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        step.done 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-neutral-100 text-neutral-400'
                      }`}>
                        {step.done ? '✓' : i + 1}
                      </div>
                      <span className={step.done ? 'text-neutral-900' : 'text-neutral-400'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="max-w-md mx-auto">
            <Card className="border-red-200 bg-white">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-10 w-10 mx-auto mb-4 text-red-500" />
                <h3 className="text-base font-medium text-neutral-900 mb-2">Unable to Fetch Data</h3>
                <p className="text-sm text-neutral-500 mb-6 whitespace-pre-line">{error}</p>
                <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs font-medium text-neutral-700 mb-2">Suggestions:</p>
                  <ul className="text-xs text-neutral-500 space-y-1">
                    <li>• Check if the URL is a valid product page</li>
                    <li>• Make sure the product has reviews</li>
                    <li>• Try a different product URL</li>
                    <li>• We support 12 e-commerce platforms</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleRetry} className="border-neutral-300 text-neutral-700 hover:bg-neutral-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {state === 'results' && productInfo && analysisResult && (
          <ReviewAnalysisDashboard
            productInfo={productInfo}
            reviews={reviews}
            analysisResult={analysisResult}
            onRetry={handleRetry}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-900">TruFake</span>
            </div>
            <div className="flex items-center gap-4">
              {history.length > 0 && (
                <span className="text-xs text-neutral-400">
                  {history.length} analyses saved
                </span>
              )}
              <p className="text-xs text-neutral-500">
                Supports {SUPPORTED_PLATFORMS.length} e-commerce platforms
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
