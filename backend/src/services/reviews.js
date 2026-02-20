import { Review } from '../models/review.js';
import { Product } from '../models/product.js';

export const refreshProductRating = async (productId) => {
  const rows = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  const rating = rows[0] || { averageRating: 0, reviewCount: 0 };
  await Product.findByIdAndUpdate(productId, {
    averageRating: Number((rating.averageRating || 0).toFixed(2)),
    reviewCount: rating.reviewCount || 0,
  });
};
