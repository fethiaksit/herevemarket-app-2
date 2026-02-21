import assert from "node:assert/strict";
import test from "node:test";

import { createIpRateLimiter, __resetRateLimiterForTests } from "../src/middleware/rateLimit.js";
import { createOrderFromRequest } from "../src/services/orders.js";

function createSession() {
  return {
    async withTransaction(fn) {
      await fn();
    },
    async endSession() {},
  };
}

function fakeQuery(value) {
  return {
    session() {
      return Promise.resolve(value);
    },
  };
}

test("guest order success creates snapshot and decrements stock", async () => {
  const milk = {
    _id: "507f1f77bcf86cd799439012",
    clientId: 1001,
    name: "Milk",
    price: 55,
    stock: 4,
    async save() {},
  };

  let savedOrder;
  const ProductModel = {
    findOne(query) {
      if (query.clientId === 1001) return fakeQuery(milk);
      return fakeQuery(null);
    },
  };
  const OrderModel = {
    async create([doc]) {
      savedOrder = { ...doc, id: "order-1", items: doc.items };
      return [savedOrder];
    },
  };

  const result = await createOrderFromRequest(
    {
      customer: { fullName: "Ali Veli", phone: "05551234567", email: "ali@test.com" },
      delivery: { title: "Ev", detail: "Istanbul", note: "3. kat" },
      items: [{ productId: "1001", quantity: 2 }],
      paymentMethod: "cash",
      totalPrice: 1,
    },
    { isGuest: true },
    { ProductModel, OrderModel, startSession: async () => createSession() }
  );

  assert.equal(milk.stock, 2);
  assert.equal(result.summary.total, 110);
  assert.equal(savedOrder.items[0].unitPrice, 55);
  assert.equal(savedOrder.items[0].totalLinePrice, 110);
});

test("invalid productId returns 404", async () => {
  const ProductModel = { findOne: () => fakeQuery(null) };
  const OrderModel = { create: async () => [{ id: "1", items: [], subtotal: 0, discount: 0, total: 0 }] };

  await assert.rejects(
    () =>
      createOrderFromRequest(
        {
          customer: { fullName: "Ali Veli", phone: "05551234567" },
          delivery: { detail: "Istanbul" },
          items: [{ productId: "999", quantity: 1 }],
          paymentMethod: "cash",
        },
        { isGuest: true },
        { ProductModel, OrderModel, startSession: async () => createSession() }
      ),
    { message: /Ürün bulunamadı/ }
  );
});

test("out-of-stock returns conflict", async () => {
  const product = { _id: "507f1f77bcf86cd799439012", clientId: 200, name: "Bread", price: 20, stock: 1, async save() {} };
  const ProductModel = { findOne: () => fakeQuery(product) };
  const OrderModel = { create: async () => [{ id: "1", items: [], subtotal: 0, discount: 0, total: 0 }] };

  await assert.rejects(
    () =>
      createOrderFromRequest(
        {
          customer: { fullName: "Ali Veli", phone: "05551234567" },
          delivery: { detail: "Istanbul" },
          items: [{ productId: "200", quantity: 3 }],
          paymentMethod: "cash",
        },
        { isGuest: true },
        { ProductModel, OrderModel, startSession: async () => createSession() }
      ),
    { message: /stok yetersiz/ }
  );
});

test("rate limiter triggers after max request count", () => {
  __resetRateLimiterForTests();
  const limiter = createIpRateLimiter({ max: 2, windowMs: 1000 * 60 });

  const req = { ip: "127.0.0.1", headers: {}, socket: { remoteAddress: "127.0.0.1" } };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  let nextCalls = 0;
  limiter(req, res, () => {
    nextCalls += 1;
  });
  limiter(req, res, () => {
    nextCalls += 1;
  });
  limiter(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
  assert.equal(res.statusCode, 429);
});

test("totals are computed server-side and ignore client-tampered prices", async () => {
  const apples = { _id: "507f1f77bcf86cd799439013", clientId: 300, name: "Apple", price: 15, stock: 10, async save() {} };
  let created;
  const ProductModel = { findOne: () => fakeQuery(apples) };
  const OrderModel = {
    async create([doc]) {
      created = { ...doc, id: "order-total" };
      return [created];
    },
  };

  const result = await createOrderFromRequest(
    {
      customer: { fullName: "Ayse", phone: "05559876543" },
      delivery: { detail: "Izmir" },
      items: [{ productId: "300", quantity: 2, price: 1, totalLinePrice: 1 }],
      paymentMethod: "card",
      totalPrice: 1,
    },
    { isGuest: true },
    { ProductModel, OrderModel, startSession: async () => createSession() }
  );

  assert.equal(created.subtotal, 30);
  assert.equal(result.summary.total, 30);
});
