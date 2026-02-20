import express from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/product.js';
import { Review } from '../models/review.js';
import { userAuth } from '../middleware/auth.js';
import { fail, ok } from '../lib/response.js';
import { refreshProductRating } from '../services/reviews.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search = '', category } = req.query;
    const query = { isDeleted: false, isActive: true };
    if (category) query.category = category;
    let sort = { createdAt: -1 };
    if (search) {
      query.$text = { $search: search };
      sort = { score: { $meta: 'textScore' } };
    }
    let docs;
    try {
      docs = await Product.find(query, search ? { score: { $meta: 'textScore' } } : {}).sort(sort).lean();
    } catch {
      delete query.$text;
      query.name = { $regex: String(search), $options: 'i' };
      docs = await Product.find(query).sort({ createdAt: -1 }).lean();
    }
    return ok(res, docs);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, price } = req.body || {};
    if (!name || typeof price !== 'number') return fail(res, 400, 'name and price required');
    const product = await Product.create(req.body);
    return ok(res, product, undefined, 201);
  } catch (e) { next(e); }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sort = 'latest', page = 1, limit = 10 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, 400, 'Invalid product id');
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = sort === 'top' ? { rating: -1, createdAt: -1 } : { createdAt: -1 };
    const [rows, total] = await Promise.all([
      Review.find({ productId: id }).sort(sortOrder).skip(skip).limit(Number(limit)).lean(),
      Review.countDocuments({ productId: id }),
    ]);
    return ok(res, rows, { page: Number(page), limit: Number(limit), total });
  } catch (e) { next(e); }
});

router.post('/:id/reviews', userAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment = '' } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, 400, 'Invalid product id');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 400, 'Rating must be 1..5');
    const product = await Product.findById(id);
    if (!product || product.isDeleted) return fail(res, 404, 'Product not found');
    const review = await Review.findOneAndUpdate(
      { productId: id, userId: req.auth.userId },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await refreshProductRating(product._id);
    return ok(res, review, undefined, 201);
  } catch (e) { next(e); }
});

router.delete('/:id/reviews/me', userAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Review.deleteOne({ productId: id, userId: req.auth.userId });
    await refreshProductRating(new mongoose.Types.ObjectId(id));
    return ok(res, { removed: true });
  } catch (e) { next(e); }
});

export default router;
