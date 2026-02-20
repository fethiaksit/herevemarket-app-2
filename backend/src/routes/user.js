import express from 'express';
import mongoose from 'mongoose';
import { userAuth } from '../middleware/auth.js';
import { fail, ok } from '../lib/response.js';
import { Favorite } from '../models/favorite.js';
import { Product } from '../models/product.js';
import { Cart } from '../models/cart.js';
import { Order } from '../models/order.js';
import { User } from '../models/user.js';
import { isValidExpoToken } from '../services/notifications.js';

const router = express.Router();
router.use(userAuth);

const upsertCartItem = async (userId, productId, quantity) => {
  if (!mongoose.Types.ObjectId.isValid(productId) || quantity < 1) return { error: 'Invalid cart item' };
  const product = await Product.findById(productId);
  if (!product || product.isDeleted) return { error: 'Product not found', status: 404 };
  if (quantity > product.stock) return { error: 'Quantity exceeds stock' };
  const cart = await Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId, items: [] } }, { upsert: true, new: true });
  const idx = cart.items.findIndex((i) => String(i.productId) === String(productId));
  if (idx >= 0) cart.items[idx].quantity = quantity;
  else cart.items.push({ productId, quantity });
  await cart.save();
  return { cart };
};

router.get('/favorites', async (req, res) => ok(res, (await Favorite.find({ userId: req.auth.userId }).populate('productId')).map((r) => r.productId).filter((p) => p && !p.isDeleted)));
router.post('/favorites', async (req, res) => {
  const { productId } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(productId)) return fail(res, 400, 'Invalid productId');
  const product = await Product.findById(productId);
  if (!product || product.isDeleted) return fail(res, 404, 'Product not found');
  await Favorite.updateOne({ userId: req.auth.userId, productId }, { $setOnInsert: { userId: req.auth.userId, productId } }, { upsert: true });
  return ok(res, { added: true });
});
router.delete('/favorites/:productId', async (req, res) => { await Favorite.deleteOne({ userId: req.auth.userId, productId: req.params.productId }); return ok(res, { removed: true }); });

router.get('/cart', async (req, res) => ok(res, (await Cart.findOne({ userId: req.auth.userId }).lean()) || { userId: req.auth.userId, items: [] }));
router.post('/cart/items', async (req, res) => {
  const result = await upsertCartItem(req.auth.userId, req.body?.productId, Number(req.body?.quantity));
  if (result.error) return fail(res, result.status || 400, result.error);
  return ok(res, result.cart);
});
router.put('/cart/items/:productId', async (req, res) => {
  const result = await upsertCartItem(req.auth.userId, req.params.productId, Number(req.body?.quantity));
  if (result.error) return fail(res, result.status || 400, result.error);
  return ok(res, result.cart);
});
router.delete('/cart/items/:productId', async (req, res) => { const cart = await Cart.findOne({ userId: req.auth.userId }); if (cart) { cart.items = cart.items.filter((i) => String(i.productId) !== String(req.params.productId)); await cart.save(); } return ok(res, { removed: true }); });
router.post('/cart/clear', async (req, res) => { await Cart.findOneAndUpdate({ userId: req.auth.userId }, { $set: { items: [] } }, { upsert: true }); return ok(res, { cleared: true }); });

router.get('/orders', async (req, res) => { const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 10); const skip = (page - 1) * limit; const [rows, total] = await Promise.all([Order.find({ userId: req.auth.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments({ userId: req.auth.userId })]); return ok(res, rows, { page, limit, total }); });
router.get('/orders/:id', async (req, res) => { const row = await Order.findOne({ _id: req.params.id, userId: req.auth.userId }); if (!row) return fail(res, 404, 'Order not found'); return ok(res, row); });

router.put('/push-token', async (req, res) => { const { token } = req.body || {}; if (!isValidExpoToken(token)) return fail(res, 400, 'Invalid expo token'); await User.findOneAndUpdate({ externalId: req.auth.userId }, { $set: { pushToken: token, pushTokenUpdatedAt: new Date() } }, { upsert: true }); return ok(res, { saved: true }); });

export default router;
