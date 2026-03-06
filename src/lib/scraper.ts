import * as cheerio from 'cheerio';
import type { Review, ProductInfo } from '@/types';

// ScraperAPI Key - Public for this project
const SCRAPER_API_KEY = '8a6579aaa1407773b10176136aabc047';

// Supported e-commerce platforms
export type Platform = 
  | 'amazon' 
  | 'flipkart' 
  | 'ebay' 
  | 'walmart' 
  | 'bestbuy' 
  | 'aliexpress' 
  | 'target' 
  | 'etsy' 
  | 'myntra'
  | 'snapdeal' 
  | 'meesho' 
  | 'newegg' 
  | 'unknown';

export const SUPPORTED_PLATFORMS: { name: string; domain: string; icon: string }[] = [
  { name: 'Amazon', domain: 'amazon.com, amazon.in, amazon.co.uk, amazon.de', icon: '🛒' },
  { name: 'Flipkart', domain: 'flipkart.com', icon: '📦' },
  { name: 'eBay', domain: 'ebay.com', icon: '🏷️' },
  { name: 'Walmart', domain: 'walmart.com', icon: '🏪' },
  { name: 'Best Buy', domain: 'bestbuy.com', icon: '💻' },
  { name: 'AliExpress', domain: 'aliexpress.com', icon: '🌐' },
  { name: 'Target', domain: 'target.com', icon: '🎯' },
  { name: 'Etsy', domain: 'etsy.com', icon: '🎨' },
  { name: 'Myntra', domain: 'myntra.com', icon: '👕' },
  { name: 'Snapdeal', domain: 'snapdeal.com', icon: '💳' },
  { name: 'Meesho', domain: 'meesho.com', icon: '📱' },
  { name: 'Newegg', domain: 'newegg.com', icon: '🥚' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Detect platform from URL
function detectPlatform(url: string): Platform {
  const hostname = url.toLowerCase();
  
  if (hostname.includes('amazon.')) return 'amazon';
  if (hostname.includes('flipkart.')) return 'flipkart';
  if (hostname.includes('ebay.')) return 'ebay';
  if (hostname.includes('walmart.')) return 'walmart';
  if (hostname.includes('bestbuy.')) return 'bestbuy';
  if (hostname.includes('aliexpress.')) return 'aliexpress';
  if (hostname.includes('target.')) return 'target';
  if (hostname.includes('etsy.')) return 'etsy';
  if (hostname.includes('myntra.')) return 'myntra';
  if (hostname.includes('snapdeal.')) return 'snapdeal';
  if (hostname.includes('meesho.')) return 'meesho';
  if (hostname.includes('newegg.')) return 'newegg';
  
  return 'unknown';
}

// Check if HTML is an error page
function isErrorPage(html: string, platform: Platform): { isError: boolean; reason?: string } {
  const $ = cheerio.load(html);
  const title = $('title').text().toLowerCase();
  const bodyText = $('body').text().toLowerCase();
  
  // Common error indicators
  const errorIndicators = [
    'page not found',
    '404',
    'error',
    'sorry',
    'not available',
    'access denied',
    'blocked',
    'captcha',
    'robot check',
    'dogsofamazon', // Amazon error page
  ];
  
  for (const indicator of errorIndicators) {
    if (title.includes(indicator) || bodyText.includes(indicator)) {
      // Check if it's actually an error or just a product with these words
      if (platform === 'amazon' && bodyText.includes('dogsofamazon')) {
        return { isError: true, reason: 'Amazon returned an error page (blocked or not found)' };
      }
      if (title.includes('404') || title.includes('not found')) {
        return { isError: true, reason: 'Page not found (404)' };
      }
      if (title.includes('error') && !bodyText.includes('review')) {
        return { isError: true, reason: 'Website returned an error page' };
      }
    }
  }
  
  // Platform-specific checks
  switch (platform) {
    case 'amazon':
      if (!html.includes('productTitle') && !html.includes('dp/') && !html.includes('customerReviews')) {
        if (bodyText.length < 5000) {
          return { isError: true, reason: 'Amazon product page not loaded correctly' };
        }
      }
      break;
    case 'flipkart':
      if (!html.includes('B_NuCI') && !html.includes('_30jeq3') && !html.includes('product')) {
        if (bodyText.length < 5000) {
          return { isError: true, reason: 'Flipkart product page not loaded correctly' };
        }
      }
      break;
  }
  
  return { isError: false };
}

// Extract ASIN from Amazon URL
function extractAmazonAsin(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/exec\/obidos\/asin\/([A-Z0-9]{10})/i,
    /\/product-reviews\/([A-Z0-9]{10})/i
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch page using ScraperAPI with better error handling
async function fetchWithScraperAPI(url: string): Promise<string> {
  const encodedUrl = encodeURIComponent(url);
  
  // Try different ScraperAPI configurations
  const scraperConfigs = [
    // Standard config
    `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodedUrl}&render=true`,
    // With country code for better results
    `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodedUrl}&render=true&country_code=us`,
    // Without render (faster, sometimes works better)
    `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodedUrl}`,
  ];
  
  let lastError: string = 'Unknown error';
  
  for (let i = 0; i < scraperConfigs.length; i++) {
    try {
      console.log(`[SCRAPERAPI] Attempt ${i + 1}: ${url}`);
      
      const response = await fetch(scraperConfigs[i], {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(45000) // 45 second timeout
      });
      
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }
      
      const html = await response.text();
      
      // Validate response
      if (!html || html.length < 500) {
        lastError = 'Response too short';
        continue;
      }
      
      // Check for ScraperAPI error page (HTML that contains error messages)
      if (html.includes('ScraperAPI Error') || html.includes('Invalid API key')) {
        lastError = 'ScraperAPI error or invalid key';
        continue;
      }
      
      console.log(`[SCRAPERAPI] Success: ${html.length} characters`);
      return html;
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request failed';
      console.log(`[SCRAPERAPI] Attempt ${i + 1} failed: ${lastError}`);
    }
  }
  
  throw new Error(`Failed to fetch page after multiple attempts. Last error: ${lastError}`);
}

// Parse product info based on platform
function parseProductInfo(html: string, url: string, platform: Platform): ProductInfo | null {
  const $ = cheerio.load(html);
  
  let title = '';
  let price = '';
  let imageUrl = '';
  let averageRating = 0;
  let totalReviews = 0;

  switch (platform) {
    case 'amazon':
      title = $('#productTitle').text().trim() || 
              $('#title span').text().trim() ||
              $('[data-automation-id="title"]').text().trim() ||
              $('h1.a-size-large').text().trim() ||
              $('span#productTitle').text().trim();
      
      price = $('.a-price .a-offscreen').first().text().trim() ||
              $('#priceblock_ourprice').text().trim() ||
              $('#priceblock_dealprice').text().trim() ||
              $('.a-price-whole').first().text().trim();
      
      imageUrl = $('#landingImage').attr('src') || 
                 $('#landingImage').attr('data-old-hires') ||
                 $('#imgBlkFront').attr('src') ||
                 $('.a-dynamic-image').first().attr('src') || '';
      
      const amazonRating = $('.a-icon-star .a-icon-alt, [data-hook="rating-out-of-text"]').first().text();
      const amazonRatingMatch = amazonRating.match(/(\d+\.?\d*)/);
      if (amazonRatingMatch) averageRating = parseFloat(amazonRatingMatch[1]);
      
      const amazonReviewCount = $('#acrCustomerReviewText, [data-hook="total-review-count"]').first().text();
      const amazonReviewMatch = amazonReviewCount.match(/[\d,]+/);
      if (amazonReviewMatch) totalReviews = parseInt(amazonReviewMatch[0].replace(/,/g, ''), 10);
      break;

    case 'flipkart':
      title = $('.B_NuCI, span.B_NuCI, h1.yhB1nd span').first().text().trim() ||
              $('h1').first().text().trim();
      
      price = $('._30jeq3, div._30jeq3').first().text().trim() ||
              $('[class*="price"]').first().text().trim();
      
      imageUrl = $('._396cs4, img._396cs4, img[class*="_396"]').first().attr('src') || '';
      
      const flipkartRating = $('._3LWZlK, div._3LWZlK').first().text();
      const flipkartRatingMatch = flipkartRating.match(/(\d+\.?\d*)/);
      if (flipkartRatingMatch) averageRating = parseFloat(flipkartRatingMatch[1]);
      
      const flipkartReviewCount = $('._2_R_DZ span, [class*="rating-count"]').first().text();
      const flipkartReviewMatch = flipkartReviewCount.match(/[\d,]+/);
      if (flipkartReviewMatch) totalReviews = parseInt(flipkartReviewMatch[0].replace(/,/g, ''), 10);
      break;

    case 'ebay':
      title = $('#x-item-title').text().trim() ||
              $('.x-item-title__mainTitle').text().trim() ||
              $('h1.x-item-title').text().trim() ||
              $('.it-ttl').text().trim();
      
      price = $('.x-price-primary').text().trim() ||
              $('#prcIsum').text().trim() ||
              $('.display-price').first().text().trim();
      
      imageUrl = $('#icImg').attr('src') ||
                 $('.ux-image-carousel-image img').first().attr('src') || '';
      
      const ebayRating = $('.ebay-review-start-rating').text() ||
                         $('[itemprop="ratingValue"]').text() || '';
      const ebayRatingMatch = ebayRating.match(/(\d+\.?\d*)/);
      if (ebayRatingMatch) averageRating = parseFloat(ebayRatingMatch[1]);
      
      const ebayReviewCount = $('.ebay-reviews-count').text() ||
                              $('[itemprop="reviewCount"]').text();
      const ebayReviewMatch = ebayReviewCount.match(/[\d,]+/);
      if (ebayReviewMatch) totalReviews = parseInt(ebayReviewMatch[0].replace(/,/g, ''), 10);
      break;

    case 'walmart':
      title = $('[data-automation-id="product-title"]').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('[data-automation-id="product-price"]').text().trim() ||
              $('.price-characteristic').first().text().trim();
      
      imageUrl = $('[data-automation-id="product-image"]').attr('src') ||
                 $('.product-image img').first().attr('src') || '';
      
      const walmartRating = $('[itemprop="ratingValue"]').text() ||
                            $('.stars-container').attr('aria-label') || '';
      const walmartRatingMatch = walmartRating.match(/(\d+\.?\d*)/);
      if (walmartRatingMatch) averageRating = parseFloat(walmartRatingMatch[1]);
      
      const walmartReviewCount = $('[itemprop="reviewCount"]').text();
      const walmartReviewMatch = walmartReviewCount.match(/[\d,]+/);
      if (walmartReviewMatch) totalReviews = parseInt(walmartReviewMatch[0].replace(/,/g, ''), 10);
      break;

    case 'bestbuy':
      title = $('[data-testid="product-title"]').text().trim() ||
              $('.sku-title').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('[data-testid="customer-price"]').text().trim() ||
              $('.priceView-customer-price span').first().text().trim();
      
      imageUrl = $('.primary-image').attr('src') ||
                 $('[data-testid="product-image"]').attr('src') || '';
      
      const bestbuyRating = $('[itemprop="ratingValue"]').text() || '';
      const bestbuyRatingMatch = bestbuyRating.match(/(\d+\.?\d*)/);
      if (bestbuyRatingMatch) averageRating = parseFloat(bestbuyRatingMatch[1]);
      
      const bestbuyReviewCount = $('[itemprop="reviewCount"]').text();
      const bestbuyReviewMatch = bestbuyReviewCount.match(/[\d,]+/);
      if (bestbuyReviewMatch) totalReviews = parseInt(bestbuyReviewMatch[0].replace(/,/g, ''), 10);
      break;

    case 'aliexpress':
      title = $('.product-title-text').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('.product-price-value').text().trim() ||
              $('.current-price').text().trim();
      
      imageUrl = $('.magnifier-image').attr('src') ||
                 $('.product-preview img').first().attr('src') || '';
      
      const aliRating = $('.rating-value').text() || '';
      const aliRatingMatch = aliRating.match(/(\d+\.?\d*)/);
      if (aliRatingMatch) averageRating = parseFloat(aliRatingMatch[1]);
      
      const aliReviewCount = $('.rating-num').text();
      const aliReviewMatch = aliReviewCount.match(/[\d,]+/);
      if (aliReviewMatch) totalReviews = parseInt(aliReviewMatch[0].replace(/,/g, ''), 10);
      break;

    case 'target':
      title = $('[data-test="product-title"]').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('[data-test="product-price"]').text().trim() ||
              $('.current-price').text().trim();
      
      imageUrl = $('[data-test="product-image"]').attr('src') ||
                 $('img[class*="slide"]').first().attr('src') || '';
      
      const targetRating = $('[data-test="rating-value"]').text() || '';
      const targetRatingMatch = targetRating.match(/(\d+\.?\d*)/);
      if (targetRatingMatch) averageRating = parseFloat(targetRatingMatch[1]);
      break;

    case 'etsy':
      title = $('[data-product-title]').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('[data-product-price]').text().trim() ||
              $('.currency-value').text().trim();
      
      imageUrl = $('#image-main').attr('src') ||
                 $('.listing-image img').first().attr('src') || '';
      
      const etsyRating = $('[data-rating]').text() || '';
      const etsyRatingMatch = etsyRating.match(/(\d+\.?\d*)/);
      if (etsyRatingMatch) averageRating = parseFloat(etsyRatingMatch[1]);
      break;

    case 'myntra':
      title = $('.pdp-title').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('.pdp-price').text().trim();
      
      imageUrl = $('.image-grid-image').attr('src') ||
                 $('.pdp-image img').first().attr('src') || '';
      
      const myntraRating = $('.index-overallRating').text() || '';
      const myntraRatingMatch = myntraRating.match(/(\d+\.?\d*)/);
      if (myntraRatingMatch) averageRating = parseFloat(myntraRatingMatch[1]);
      break;

    case 'snapdeal':
      title = $('.product-title').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('.payBlkBig').text().trim();
      
      imageUrl = $('#bx-slider-left-image-panel img').first().attr('src') || '';
      
      const snapdealRating = $('.avrg-rating').text() || '';
      const snapdealRatingMatch = snapdealRating.match(/(\d+\.?\d*)/);
      if (snapdealRatingMatch) averageRating = parseFloat(snapdealRatingMatch[1]);
      break;

    case 'meesho':
      title = $('[class*="ProductName"]').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('[class*="ProductPrice"]').text().trim();
      
      imageUrl = $('[class*="ProductImage"]').attr('src') || '';
      break;

    case 'newegg':
      title = $('.product-title').text().trim() ||
              $('h1').first().text().trim();
      
      price = $('.price-current').text().trim();
      
      imageUrl = $('.product-view-img-origin').attr('src') ||
                 $('#productGallery img').first().attr('src') || '';
      
      const neweggRating = $('.rating-content').attr('title') ||
                           $('[itemprop="ratingValue"]').text() || '';
      const neweggRatingMatch = neweggRating.match(/(\d+\.?\d*)/);
      if (neweggRatingMatch) averageRating = parseFloat(neweggRatingMatch[1]);
      break;
  }

  // Final fallback
  if (!title) {
    title = $('title').text().trim().split('|')[0].split('-')[0].trim() || 'Unknown Product';
  }

  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  return {
    title: title || 'Unknown Product',
    price: price || 'Price not available',
    imageUrl: imageUrl || '',
    totalReviews: totalReviews || 0,
    averageRating: averageRating || 0,
    source: platformName,
    url
  };
}

// Parse reviews based on platform
function parseReviews(html: string, platform: Platform): Review[] {
  const $ = cheerio.load(html);
  const reviews: Review[] = [];

  switch (platform) {
    case 'amazon':
      $('[data-hook="review"]').each((_, el) => {
        const reviewEl = $(el);
        const text = reviewEl.find('[data-hook="review-body"] span, [data-hook="review-body"]').text().trim();
        const ratingText = reviewEl.find('[data-hook="review-star-rating"] .a-icon-alt, .a-icon-star .a-icon-alt').text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
        const reviewerName = reviewEl.find('.a-profile-name').first().text().trim();
        const dateText = reviewEl.find('[data-hook="review-date"]').text().trim();
        const verified = reviewEl.find('[data-hook="avp-badge"]').length > 0;

        if (text && text.length > 5 && rating > 0) {
          reviews.push({
            id: generateId(),
            text,
            rating,
            reviewerName: reviewerName || 'Anonymous',
            date: dateText.replace(/Reviewed in|on/gi, '').trim() || new Date().toISOString().split('T')[0],
            verifiedPurchase: verified
          });
        }
      });
      break;

    case 'flipkart':
      $('._1AtVbE, [class*="review-card"], .col._2wzgFH').each((_, el) => {
        const reviewEl = $(el);
        const text = reviewEl.find('._6K-7Co, [class*="review-text"], .t-ZTKy div').text().trim();
        const ratingText = reviewEl.find('._3LWZlK').first().text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
        const reviewerName = reviewEl.find('._2sc7ZR').first().text().trim();
        const dateText = reviewEl.find('._2sc7ZR._3L2l4p').text().trim();
        const certified = reviewEl.find('._3KLY0g').length > 0;

        if (text && text.length > 5 && rating > 0) {
          reviews.push({
            id: generateId(),
            text,
            rating,
            reviewerName: reviewerName || 'Anonymous',
            date: dateText || new Date().toISOString().split('T')[0],
            verifiedPurchase: certified
          });
        }
      });
      break;

    case 'ebay':
      $('.ebay-review-item, [class*="review-item"]').each((_, el) => {
        const reviewEl = $(el);
        const text = reviewEl.find('.review-item-content, [class*="review-text"]').text().trim();
        const ratingText = reviewEl.find('.ebay-review-start-rating, [class*="rating"]').text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 5;
        const reviewerName = reviewEl.find('.review-author, [class*="author"]').text().trim();
        const dateText = reviewEl.find('.review-date').text().trim();

        if (text && text.length > 5 && rating > 0) {
          reviews.push({
            id: generateId(),
            text,
            rating,
            reviewerName: reviewerName || 'Anonymous',
            date: dateText || new Date().toISOString().split('T')[0],
            verifiedPurchase: false
          });
        }
      });
      break;

    case 'walmart':
      $('[data-testid="review-item"], .review-item').each((_, el) => {
        const reviewEl = $(el);
        const text = reviewEl.find('[data-testid="review-text"], .review-text').text().trim();
        const ariaLabel = reviewEl.find('[class*="rating"]').attr('aria-label') || '';
        const ratingMatch = ariaLabel.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 5;
        const reviewerName = reviewEl.find('[class*="author"]').text().trim();
        const dateText = reviewEl.find('[class*="date"]').text().trim();

        if (text && text.length > 5 && rating > 0) {
          reviews.push({
            id: generateId(),
            text,
            rating,
            reviewerName: reviewerName || 'Anonymous',
            date: dateText || new Date().toISOString().split('T')[0],
            verifiedPurchase: false
          });
        }
      });
      break;

    default:
      // Generic parsing for other platforms
      $('[class*="review"]').each((_, el) => {
        const reviewEl = $(el);
        const text = reviewEl.find('[class*="text"], [class*="content"], p').first().text().trim();
        const ratingText = reviewEl.find('[class*="rating"], [class*="star"]').text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 5;
        const reviewerName = reviewEl.find('[class*="author"], [class*="name"]').text().trim();
        const dateText = reviewEl.find('[class*="date"]').text().trim();

        if (text && text.length > 5 && rating > 0) {
          reviews.push({
            id: generateId(),
            text,
            rating,
            reviewerName: reviewerName || 'Anonymous',
            date: dateText || new Date().toISOString().split('T')[0],
            verifiedPurchase: false
          });
        }
      });
  }

  // Remove duplicates
  const uniqueReviews = reviews.filter((review, index, self) =>
    index === self.findIndex((r) => r.text.substring(0, 50) === review.text.substring(0, 50))
  );

  console.log(`[PARSER] Extracted ${uniqueReviews.length} reviews from ${platform}`);
  return uniqueReviews;
}

// Main scraper function
export async function scrapeProduct(url: string): Promise<{ productInfo: ProductInfo; reviews: Review[] }> {
  const platform = detectPlatform(url);
  console.log(`[SCRAPER] Starting scrape for ${platform} URL: ${url}`);

  if (platform === 'unknown') {
    throw new Error('Unsupported website. Please use a URL from: Amazon, Flipkart, eBay, Walmart, Best Buy, AliExpress, Target, Etsy, Myntra, Snapdeal, Meesho, or Newegg.');
  }

  try {
    // Fetch the product page
    console.log('[SCRAPER] Fetching product page...');
    const html = await fetchWithScraperAPI(url);
    
    // Check if it's an error page
    const errorCheck = isErrorPage(html, platform);
    if (errorCheck.isError) {
      throw new Error(`${errorCheck.reason}. The product may not exist or may be blocked. Try a different product URL.`);
    }
    
    // Parse product info
    const productInfo = parseProductInfo(html, url, platform);
    console.log(`[SCRAPER] Found product: ${productInfo.title}`);
    
    // Parse reviews
    let reviews = parseReviews(html, platform);
    console.log(`[SCRAPER] Found ${reviews.length} reviews on product page`);

    // For Amazon, try the reviews page if main page has no reviews
    if (reviews.length === 0 && platform === 'amazon') {
      const asin = extractAmazonAsin(url);
      if (asin) {
        console.log(`[SCRAPER] Trying Amazon reviews page for ASIN: ${asin}`);
        try {
          const domain = new URL(url).hostname;
          const reviewsUrl = `https://${domain}/product-reviews/${asin}`;
          const reviewsHtml = await fetchWithScraperAPI(reviewsUrl);
          
          const reviewsErrorCheck = isErrorPage(reviewsHtml, platform);
          if (!reviewsErrorCheck.isError) {
            const additionalReviews = parseReviews(reviewsHtml, platform);
            reviews = additionalReviews;
            console.log(`[SCRAPER] Found ${reviews.length} reviews on reviews page`);
          }
        } catch (e) {
          console.log('[SCRAPER] Reviews page fetch failed:', e);
        }
      }
    }

    // No reviews error
    if (reviews.length === 0) {
      throw new Error(
        `No reviews found for this product.\n\n` +
        `Possible reasons:\n` +
        `• The product has no reviews yet\n` +
        `• Reviews are loaded via JavaScript (try refreshing)\n` +
        `• The website is blocking access\n\n` +
        `Please try a product with existing reviews.`
      );
    }

    if (productInfo.totalReviews === 0) {
      productInfo.totalReviews = reviews.length;
    }

    console.log(`[SCRAPER] SUCCESS: ${reviews.length} reviews for "${productInfo.title}"`);

    return { productInfo, reviews };

  } catch (error) {
    console.error('[SCRAPER] Error:', error);
    throw error;
  }
}
