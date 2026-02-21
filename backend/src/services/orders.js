import mongoose from "mongoose";

import { Order } from "../models/order.js";
import { Product } from "../models/product.js";

const PHONE_REGEX = /^(?:\+?90|0)?5\d{9}$/;

class OrderError extends Error {
  constructor(status, message, error) {
    super(message);
    this.status = status;
    this.error = error;
  }
}

function normalizeString(value, maxLen, { required = false, field = "field" } = {}) {
  const normalized = String(value ?? "").trim();
  if (required && !normalized) throw new OrderError(400, `${field} zorunludur.`, "VALIDATION_ERROR");
  if (normalized.length > maxLen) throw new OrderError(400, `${field} çok uzun.`, "VALIDATION_ERROR");
  return normalized;
}

function normalizePhone(phone) {
  const raw = normalizeString(phone, 20, { required: true, field: "phone" }).replace(/\s+/g, "");
  if (!PHONE_REGEX.test(raw)) {
    throw new OrderError(400, "Telefon formatı geçersiz.", "VALIDATION_ERROR");
  }
  return raw;
}

function normalizePaymentMethod(value) {
  if (value === "cash" || value === "card") return value;
  const maybeLabel = String(value?.label || value || "").toLowerCase();
  if (maybeLabel.includes("kapı") || maybeLabel.includes("cash")) return "cash";
  if (maybeLabel.includes("card") || maybeLabel.includes("kart")) return "card";
  throw new OrderError(400, "paymentMethod geçersiz.", "VALIDATION_ERROR");
}

function parseProductId(productId) {
  const raw = String(productId ?? "").trim();
  if (!raw) throw new OrderError(400, "productId zorunludur.", "VALIDATION_ERROR");
  if (mongoose.Types.ObjectId.isValid(raw)) return { raw, objectId: new mongoose.Types.ObjectId(raw) };
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return { raw, numeric };
  return { raw };
}

async function loadProduct(ProductModel, parsedId, session) {
  if (parsedId.objectId) {
    const byObjectId = await ProductModel.findOne({ _id: parsedId.objectId, isDeleted: { $ne: true }, isActive: { $ne: false } }).session(session);
    if (byObjectId) return byObjectId;
  }
  if (parsedId.numeric != null) {
    return ProductModel.findOne({ clientId: parsedId.numeric, isDeleted: { $ne: true }, isActive: { $ne: false } }).session(session);
  }
  return null;
}

export async function createOrderFromRequest(payload, context = {}, deps = {}) {
  const ProductModel = deps.ProductModel || Product;
  const OrderModel = deps.OrderModel || Order;
  const startSession = deps.startSession || mongoose.startSession;

  const isGuest = Boolean(context.isGuest);
  const userId = context.userId || null;

  const customerSource = payload?.customer || {};
  const deliverySource = payload?.delivery || payload?.customer || {};

  const customerName = normalizeString(customerSource.fullName || customerSource.name || "", 100, { required: true, field: "fullName" });
  const customerPhone = normalizePhone(customerSource.phone);
  const customerEmail = normalizeString(customerSource.email || "", 120);
  const addressTitle = normalizeString(deliverySource.title || "", 80);
  const addressDetail = normalizeString(deliverySource.detail || "", 500, { required: true, field: "addressDetail" });
  const addressNote = normalizeString(deliverySource.note || "", 300);
  const couponCode = normalizeString(payload?.couponCode || "", 50);
  const paymentMethod = normalizePaymentMethod(payload?.paymentMethod || payload?.paymentMethod?.id);

  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) throw new OrderError(400, "Sepet boş olamaz.", "VALIDATION_ERROR");

  const session = await startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        const parsedProductId = parseProductId(item?.productId);
        const quantity = Number(item?.quantity);

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
          throw new OrderError(400, "quantity 1-50 aralığında olmalıdır.", "VALIDATION_ERROR");
        }

        const product = await loadProduct(ProductModel, parsedProductId, session);
        if (!product) {
          throw new OrderError(404, `Ürün bulunamadı: ${parsedProductId.raw}`, "PRODUCT_NOT_FOUND");
        }

        const currentStock = Number(product.stock ?? 0);
        if (currentStock < quantity) {
          throw new OrderError(409, `${product.name} için stok yetersiz.`, "OUT_OF_STOCK");
        }

        const unitPrice = Number(product.price ?? 0);
        const lineTotal = unitPrice * quantity;

        product.stock = currentStock - quantity;
        await product.save({ session });

        orderItems.push({
          productId: product._id?.toString?.() || parsedProductId.raw,
          name: product.name,
          unitPrice,
          quantity,
          totalLinePrice: lineTotal,
        });
        subtotal += lineTotal;
      }

      const discount = 0;
      const total = subtotal - discount;

      const order = await OrderModel.create(
        [
          {
            userId,
            isGuest,
            customerName,
            customerPhone,
            customerEmail,
            addressTitle,
            addressDetail,
            addressNote,
            paymentMethod,
            couponCode,
            items: orderItems,
            subtotal,
            discount,
            total,
          },
        ],
        { session }
      );

      [createdOrder] = order;
    });
  } finally {
    await session.endSession();
  }

  return {
    id: createdOrder.id || createdOrder._id?.toString?.(),
    summary: {
      subtotal: createdOrder.subtotal,
      discount: createdOrder.discount,
      total: createdOrder.total,
      itemCount: createdOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      isGuest: createdOrder.isGuest,
    },
  };
}

export function handleOrderError(error, res, next) {
  if (error instanceof OrderError) {
    return res.status(error.status).json({ message: error.message, error: error.error });
  }
  return next(error);
}
