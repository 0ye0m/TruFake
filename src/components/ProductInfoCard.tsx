'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProductInfo } from '@/types';
import { Star, ExternalLink } from 'lucide-react';

interface ProductInfoCardProps {
  productInfo: ProductInfo;
}

export function ProductInfoCard({ productInfo }: ProductInfoCardProps) {
  return (
    <Card className="bg-white border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900 line-clamp-2">
          {productInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
              <img
                src={productInfo.imageUrl}
                alt={productInfo.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/96?text=No+Image';
                }}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 space-y-3">
            {/* Price */}
            <div>
              <span className="text-lg font-semibold text-neutral-900">{productInfo.price}</span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-neutral-900">{productInfo.averageRating.toFixed(1)}</span>
                <span className="text-neutral-500">rating</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-medium text-neutral-900">{productInfo.totalReviews.toLocaleString()}</span>
                <span className="text-neutral-500">reviews</span>
              </div>
            </div>

            {/* Source */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-100 font-normal">
                {productInfo.source}
              </Badge>
              
              {productInfo.url && (
                <a
                  href={productInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
                >
                  <ExternalLink className="h-3 w-3" />
                  View product
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
