import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { Product } from '../src/models/product.js';
import { Coupon } from '../src/models/coupon.js';
import { Order } from '../src/models/order.js';

let mongod;
const app = createApp();
const userToken = jwt.sign({ userId: 'u1', role: 'user' }, 'dev-secret');
const adminToken = jwt.sign({ sub: 'a1', role: 'admin' }, 'dev-secret');
const user2Token = jwt.sign({ sub: 'u2', role: 'user' }, 'dev-secret');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('favorites add/list/remove idempotent', async () => {
  const p = await Product.create({ name: 'P1', price: 10, stock: 10 });
  await request(app).post('/user/favorites').set('Authorization', `Bearer ${userToken}`).send({ productId: String(p._id) }).expect(200);
  await request(app).post('/user/favorites').set('Authorization', `Bearer ${userToken}`).send({ productId: String(p._id) }).expect(200);
  const list = await request(app).get('/user/favorites').set('Authorization', `Bearer ${userToken}`).expect(200);
  expect(list.body.data).toHaveLength(1);
  await request(app).delete(`/user/favorites/${p._id}`).set('Authorization', `Bearer ${userToken}`).expect(200);
  await request(app).delete(`/user/favorites/${p._id}`).set('Authorization', `Bearer ${userToken}`).expect(200);
});

test('review unique update and product aggregation', async () => {
  const p = await Product.create({ name: 'P1', price: 10, stock: 10 });
  await request(app).post(`/products/${p._id}/reviews`).set('Authorization', `Bearer ${userToken}`).send({ rating: 5, comment: 'good' }).expect(201);
  await request(app).post(`/products/${p._id}/reviews`).set('Authorization', `Bearer ${userToken}`).send({ rating: 3, comment: 'ok' }).expect(201);
  const updated = await Product.findById(p._id);
  expect(updated.reviewCount).toBe(1);
  expect(updated.averageRating).toBe(3);
});

test('coupon validation and discount computation on order create', async () => {
  const p = await Product.create({ name: 'P1', price: 100, stock: 10 });
  await Coupon.create({ code: 'SAVE10', type: 'percent', value: 10, isActive: true, minCartTotal: 50, maxUses: 5, maxUsesPerUser: 1 });
  await request(app).post('/user/cart/items').set('Authorization', `Bearer ${userToken}`).send({ productId: String(p._id), quantity: 2 }).expect(200);
  const res = await request(app).post('/orders').set('Authorization', `Bearer ${userToken}`).send({ paymentMethod: 'cash', couponCode: 'save10' }).expect(201);
  expect(res.body.data.discountAmount).toBe(20);
  expect(res.body.data.discountedTotal).toBe(180);
});

test('cart CRUD', async () => {
  const p = await Product.create({ name: 'P1', price: 10, stock: 10 });
  await request(app).post('/user/cart/items').set('Authorization', `Bearer ${userToken}`).send({ productId: String(p._id), quantity: 1 }).expect(200);
  await request(app).put(`/user/cart/items/${p._id}`).set('Authorization', `Bearer ${userToken}`).send({ quantity: 3 }).expect(200);
  const get = await request(app).get('/user/cart').set('Authorization', `Bearer ${userToken}`).expect(200);
  expect(get.body.data.items[0].quantity).toBe(3);
  await request(app).delete(`/user/cart/items/${p._id}`).set('Authorization', `Bearer ${userToken}`).expect(200);
});

test('order status transition rules', async () => {
  const o = await Order.create({ userId: 'u1', items: [], subtotal: 0, discountedTotal: 0, paymentMethod: 'cash' });
  await request(app).put(`/admin/api/orders/${o._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'preparing' }).expect(200);
  await request(app).put(`/admin/api/orders/${o._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'pending' }).expect(400);
});

test('user vs admin access control and user-only orders', async () => {
  const o1 = await Order.create({ userId: 'u1', items: [], subtotal: 10, discountedTotal: 10, paymentMethod: 'cash' });
  await Order.create({ userId: 'u2', items: [], subtotal: 10, discountedTotal: 10, paymentMethod: 'cash' });
  await request(app).get('/admin/api/orders').set('Authorization', `Bearer ${userToken}`).expect(403);
  const userOrders = await request(app).get('/user/orders').set('Authorization', `Bearer ${userToken}`).expect(200);
  expect(userOrders.body.data).toHaveLength(1);
  await request(app).get(`/user/orders/${o1._id}`).set('Authorization', `Bearer ${user2Token}`).expect(404);
  await request(app).get('/orders').set('Authorization', `Bearer ${userToken}`).expect(403);
});
