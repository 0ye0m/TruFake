import type { Review, ProductInfo } from '@/types';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface AIAnalysisResponse {
  fake_reviews: number;
  genuine_reviews: number;
  reasoning: string;
  suspicious_review_indices: number[];
}

export async function analyzeWithAI(
  reviews: Review[],
  productInfo: ProductInfo
): Promise<AIAnalysisResponse | null> {
  try {
    const reviewsData = reviews.map((review, index) => ({
      index,
      text: review.text,
      rating: review.rating,
      reviewerName: review.reviewerName,
      verifiedPurchase: review.verifiedPurchase,
      date: review.date
    }));

    const systemPrompt = `You are an expert AI system specialized in detecting fake and suspicious product reviews on e-commerce platforms.

## Signs of Fake Reviews:
1. Extremely Short Reviews (< 15 characters)
2. Repetitive/Duplicate Content
3. Overly Exaggerated Language ("AMAZING!!!")
4. Rating-Text Mismatch
5. Unverified Purchases with Extreme Ratings
6. Generic/Vague Reviews
7. Suspicious Reviewer Patterns
8. Marketing Language

Respond ONLY with valid JSON:
{
  "fake_reviews": number,
  "genuine_reviews": number,
  "reasoning": "brief explanation",
  "suspicious_review_indices": [array of indices]
}`;

    const userPrompt = `## Product: ${productInfo.title}
## Reviews (${reviews.length} total):
 ${JSON.stringify(reviewsData, null, 2)}

Analyze these reviews and return JSON.`;

    console.log('Sending request to Groq API...');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    
    if (!responseText) {
      console.error('No response text from AI');
      return null;
    }

    console.log('AI response received, parsing...');

    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON object found in response');
      return null;
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as AIAnalysisResponse;

    if (
      typeof parsedResponse.fake_reviews !== 'number' ||
      typeof parsedResponse.genuine_reviews !== 'number' ||
      typeof parsedResponse.reasoning !== 'string' ||
      !Array.isArray(parsedResponse.suspicious_review_indices)
    ) {
      console.error('Invalid response structure');
      return null;
    }

    const totalAnalyzed = parsedResponse.fake_reviews + parsedResponse.genuine_reviews;
    if (totalAnalyzed !== reviews.length) {
      parsedResponse.fake_reviews = Math.min(parsedResponse.fake_reviews, reviews.length);
      parsedResponse.genuine_reviews = reviews.length - parsedResponse.fake_reviews;
    }

    parsedResponse.suspicious_review_indices = parsedResponse.suspicious_review_indices.filter(
      idx => idx >= 0 && idx < reviews.length
    );

    console.log(`AI Analysis complete: ${parsedResponse.fake_reviews} fake, ${parsedResponse.genuine_reviews} genuine`);
    
    return parsedResponse;
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}