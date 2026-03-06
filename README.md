# TruFake - Fake Product Review Detector

![TruFake Logo](public/logo.png)

## 📖 Overview

TruFake is an AI-powered web application that helps users identify fake and suspicious product reviews on e-commerce platforms. By analyzing review patterns, sentiment, and various authenticity indicators, TruFake provides users with a trust score and detailed analysis to make informed purchasing decisions.

## ✨ Features

- **🔍 Multi-Platform Support**: Analyzes reviews from 12 major e-commerce platforms
- **🤖 AI-Powered Analysis**: Uses Groq AI (LLaMA 3.1) for intelligent review detection
- **📊 Comprehensive Dashboard**: Visual representation of review authenticity
- **📈 Trust Score**: Calculated trust percentage for products
- **💡 Pattern Detection**: Identifies suspicious review patterns
- **📝 Sentiment Analysis**: Analyzes sentiment-rating mismatches
- **⏱️ Review Timeline**: Visualizes review distribution over time
- **🔑 Keyword Cloud**: Highlights frequently mentioned terms
- **📜 History Tracking**: Saves previous analyses for quick reference

## 🛒 Supported Platforms

| Platform | Domain |
|----------|--------|
| Amazon | amazon.com, amazon.in, amazon.co.uk |
| Flipkart | flipkart.com |
| eBay | ebay.com |
| Walmart | walmart.com |
| Best Buy | bestbuy.com |
| AliExpress | aliexpress.com |
| Target | target.com |
| Etsy | etsy.com |
| Myntra | myntra.com |
| Snapdeal | snapdeal.com |
| Meesho | meesho.com |
| Newegg | newegg.com |

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Web Scraping | ScraperAPI + Cheerio |
| AI Analysis | Groq API (LLaMA 3.1) |
| Icons | Lucide React |

## 📁 Project Structure

```
TruFake/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── scrape/route.ts      # Web scraping endpoint
│   │   │   └── analyze/route.ts     # AI analysis endpoint
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Main homepage
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── DetailedStatsCards.tsx   # Statistics display
│   │   ├── EnhancedReviewsList.tsx  # Reviews list
│   │   ├── FakeIndicatorsPanel.tsx  # Fake indicators
│   │   ├── HistoryPanel.tsx         # Analysis history
│   │   ├── KeywordCloud.tsx         # Keyword visualization
│   │   ├── ProductInfoCard.tsx      # Product details
│   │   ├── RatingDistributionChart.tsx
│   │   ├── ReviewAnalysisDashboard.tsx
│   │   ├── ReviewTimelineChart.tsx
│   │   ├── SentimentDistributionChart.tsx
│   │   ├── SuspiciousReviewsList.tsx
│   │   └── TrustScoreCard.tsx
│   │
│   ├── lib/
│   │   ├── ai-analyzer.ts           # AI analysis module
│   │   ├── enhanced-analyzer.ts     # Main analysis logic
│   │   ├── scraper.ts               # Multi-platform scraper
│   │   ├── pattern-detector.ts      # Pattern detection
│   │   ├── sentiment-analyzer.ts    # Sentiment analysis
│   │   ├── statistics-calculator.ts # Stats calculation
│   │   ├── trust-score.ts           # Trust score logic
│   │   └── history.ts               # LocalStorage history
│   │
│   ├── hooks/                       # Custom React hooks
│   └── types/                       # TypeScript definitions
│
├── public/
│   └── logo.png                     # Application logo
│
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Installation

### Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TruFake
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure API Keys**

   Update the following files with your API keys:
   
   - `src/lib/scraper.ts` - ScraperAPI key
   - `src/lib/enhanced-analyzer.ts` - Groq API key
   - `src/lib/ai-analyzer.ts` - Groq API key

4. **Run development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 API Configuration

### ScraperAPI
Get your free API key from: https://www.scraperapi.com/

### Groq API
Get your free API key from: https://console.groq.com/

## 📊 How It Works

### 1. Review Scraping
- Uses ScraperAPI to fetch product pages
- Parses HTML with Cheerio
- Extracts product info and reviews
- Supports 12 e-commerce platforms

### 2. Analysis Pipeline

```
Product URL → ScraperAPI → HTML Parsing → Review Extraction
                                              ↓
Trust Score ← AI Analysis ← Pattern Detection ← Sentiment Analysis
```

### 3. Fake Detection Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Review Length | High | Very short reviews flagged |
| Verified Purchase | High | Unverified reviews penalized |
| Extreme Rating + Short Text | Very High | 1★/5★ with brief text |
| Excessive Punctuation | Medium | Too many !!! or ALL CAPS |
| Generic Content | High | "Good product" only |
| Sentiment-Rating Mismatch | High | Positive text, low rating |
| Duplicate Content | Very High | Identical reviews |
| Similar Content | Medium | Near-duplicate reviews |
| Suspicious Reviewer Name | Medium | Auto-generated names |
| No Punctuation | Low | Missing sentence structure |

### 4. Trust Score Calculation

```
Trust Score = (Genuine Reviews / Total Reviews) × 100
```

- **80-100%**: ✅ High Trust - Safe to purchase
- **60-79%**: ⚠️ Moderate Trust - Verify carefully
- **Below 60%**: ❌ Low Trust - Exercise caution

## 🎯 Usage

1. **Enter Product URL**: Paste any product URL from supported platforms
2. **Click Analyze**: System fetches and analyzes reviews
3. **View Results**: 
   - Trust Score
   - Fake/Genuine review breakdown
   - Suspicious reviews highlighted
   - Sentiment distribution
   - Rating patterns
   - Timeline analysis
   - Keyword cloud

## 📈 Dashboard Components

| Component | Description |
|-----------|-------------|
| Trust Score Card | Overall authenticity percentage |
| Product Info Card | Product details and source |
| Rating Distribution | Bar chart of star ratings |
| Sentiment Distribution | Pie chart of sentiments |
| Review Timeline | Reviews over time |
| Keyword Cloud | Frequently used words |
| Suspicious Reviews | Flagged reviews with reasons |
| Detailed Stats | In-depth analysis metrics |

## 🔒 Security Features

- Input validation for URLs
- Rate limiting on API endpoints
- Secure API key handling
- Error handling and fallbacks

## 🌐 API Endpoints

### POST `/api/scrape`
Scrapes product page and extracts reviews

**Request:**
```json
{
  "url": "https://www.amazon.com/dp/..."
}
```

**Response:**
```json
{
  "success": true,
  "productInfo": {...},
  "reviews": [...]
}
```

### POST `/api/analyze`
Analyzes reviews for authenticity

**Request:**
```json
{
  "reviews": [...],
  "productInfo": {...}
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "trustScore": 75,
    "fakeReviews": 2,
    "genuineReviews": 6,
    "suspiciousReviews": [...],
    "reasoning": "...",
    ...
  }
}
```

## 🚧 Future Enhancements

- [ ] User authentication system
- [ ] Save analysis reports as PDF
- [ ] Browser extension for in-page analysis
- [ ] Batch analysis for multiple products
- [ ] Historical price tracking
- [ ] Mobile application
- [ ] More platform support
- [ ] Advanced ML models

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.



## 👨‍💻 Authors

- **Developer** - github.com/0ye0m

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Groq](https://groq.com/)
- [ScraperAPI](https://www.scraperapi.com/)
- [Recharts](https://recharts.org/)

---

**⭐ If you found this project helpful, please give it a star!**