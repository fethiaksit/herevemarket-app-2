import express from 'express';
import { userAuth } from '../middleware/auth.js';
import { fail, ok } from '../lib/response.js';
import { Cart } from '../models/cart.js';
import { Product } from '../models/product.js';
import { Order } from '../models/order.js';
import { Coupon } from '../models/coupon.js';
import { computeDiscount } from '../services/coupons.js';
import { sendUserNotification } from '../services/notifications.js';

const router = express.Router();

router.post('/', userAuth, async (req, res) => {
  const { paymentMethod = 'cash', couponCode } = req.body || {};
  const cart = await Cart.findOne({ userId: req.auth.userId });
  if (!cart || cart.items.length === 0) return fail(res, 400, 'Cart is empty');

  const expanded = [];
  for (const item of cart.items) {
    const p = await Product.findById(item.productId);
    if (!p || p.isDeleted || !p.isActive) return fail(res, 400, 'Invalid product in cart');
    if (item.quantity > p.stock) return fail(res, 400, 'Insufficient stock');
    expanded.push({ productId: p._id, name: p.name, price: p.price, quantity: item.quantity });
  }
  const subtotal = expanded.reduce((a, i) => a + i.price * i.quantity, 0);
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true });
    if (!coupon) return fail(res, 400, 'Invalid coupon');
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) return fail(res, 400, 'Coupon not started');
    if (coupon.expiresAt && coupon.expiresAt < now) return fail(res, 400, 'Coupon expired');
    if (subtotal < coupon.minCartTotal) return fail(res, 400, 'Cart total below coupon minimum');
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return fail(res, 400, 'Coupon usage exceeded');
    const userUses = coupon.usedBy.get(req.auth.userId) || 0;
    if (coupon.maxUsesPerUser > 0 && userUses >= coupon.maxUsesPerUser) return fail(res, 400, 'Coupon per-user usage exceeded');
  }
  const { discountAmount, discountedTotal } = computeDiscount({ coupon, subtotal });
  const order = await Order.create({
    userId: req.auth.userId,
    items: expanded,
    paymentMethod,
    subtotal,
    discountAmount,
    discountedTotal,
    couponCode: coupon?.code || '',
  });
  for (const item of expanded) {
    await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } });
  }
  if (coupon) {
    coupon.usedCount += 1;
    coupon.usedBy.set(req.auth.userId, (coupon.usedBy.get(req.auth.userId) || 0) + 1);
    await coupon.save();
  }
  cart.items = [];
  await cart.save();
  await sendUserNotification({ userId: req.auth.userId, type: 'order_created', title: 'Order created', body: `Order ${order._id} created`, data: { orderId: String(order._id) } });
  return ok(res, order, undefined, 201);
});

router.get('/', (_req, res) => fail(res, 403, 'Use /user/orders or /admin/api/orders'));

export default router;
