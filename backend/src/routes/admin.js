import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import { fail, ok } from '../lib/response.js';
import { Order } from '../models/order.js';
import { Coupon } from '../models/coupon.js';
import { Product } from '../models/product.js';
import { sendUserNotification } from '../services/notifications.js';

const router = express.Router();
router.use(adminAuth);

const transitions = {
  pending: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body || {};
  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, 404, 'Order not found');
  if (!transitions[order.status]?.includes(status)) return fail(res, 400, 'Invalid status transition');
  order.status = status;
  await order.save();
  await sendUserNotification({ userId: order.userId, type: 'order_status', title: 'Order status updated', body: `Your order is now ${status}`, data: { orderId: String(order._id), status } });
  return ok(res, order);
});

router.get('/orders', async (req, res) => {
  const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 10);
  const query = {};
  if (req.query.status) query.status = req.query.status;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
  return ok(res, rows, { page, limit, total });
});

router.post('/coupons', async (req, res) => ok(res, await Coupon.create(req.body), undefined, 201));
router.get('/coupons', async (req, res) => {
  const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 10); const search = req.query.search || '';
  const query = search ? { code: { $regex: String(search).toUpperCase(), $options: 'i' } } : {};
  const [rows, total] = await Promise.all([Coupon.find(query).skip((page - 1) * limit).limit(limit), Coupon.countDocuments(query)]);
  return ok(res, rows, { page, limit, total });
});
router.put('/coupons/:id', async (req, res) => ok(res, await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete('/coupons/:id', async (req, res) => ok(res, await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })));

router.get('/products/low-stock', async (req, res) => {
  const threshold = Number(req.query.threshold || 5); const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 20);
  const query = { stock: { $lte: threshold }, isDeleted: false };
  const [rows, total] = await Promise.all([Product.find(query).skip((page - 1) * limit).limit(limit), Product.countDocuments(query)]);
  return ok(res, rows, { page, limit, total, threshold });
});

router.get('/analytics/summary', async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const toDate = to ? new Date(to) : new Date();
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) return fail(res, 400, 'Invalid date range');
  const match = { createdAt: { $gte: fromDate, $lte: toDate } };
  const [summary] = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, totalRevenue: { $sum: '$discountedTotal' }, totalOrders: { $sum: 1 } } },
  ]);
  const topProducts = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }, name: { $first: '$items.name' } } },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);
  const dailyRevenue = await Order.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$discountedTotal' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const totalRevenue = summary?.totalRevenue || 0;
  const totalOrders = summary?.totalOrders || 0;
  return ok(res, { totalRevenue, totalOrders, avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0, topProducts, dailyRevenue });
});

export default router;
