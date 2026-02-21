import mongoose from "mongoose";
import { Favorite } from "../models/favorite.js";
import { Product } from "../models/product.js";

export function isValidProductId(productId) {
  return mongoose.isValidObjectId(productId);
}

export async function ensureProductCanBeFavorited(productId) {
  if (!isValidProductId(productId)) {
    return { ok: false, status: 400, message: "Geçersiz productId" };
  }

  const product = await Product.findOne({ _id: productId, isDeleted: { $ne: true } }).lean();
  if (!product) {
    return { ok: false, status: 404, message: "Ürün bulunamadı" };
  }

  return { ok: true };
}

export async function addFavorite(userId, productId) {
  const productCheck = await ensureProductCanBeFavorited(productId);
  if (!productCheck.ok) {
    return productCheck;
  }

  await Favorite.updateOne(
    { userId, productId },
    { $setOnInsert: { userId, productId } },
    { upsert: true }
  );

  return { ok: true, status: 200 };
}

export async function removeFavorite(userId, productId) {
  if (!isValidProductId(productId)) {
    return { ok: false, status: 400, message: "Geçersiz productId" };
  }

  await Favorite.deleteOne({ userId, productId });
  return { ok: true, status: 200 };
}

export async function listFavorites(userId) {
  const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 }).lean();
  const productIds = favorites.map((item) => item.productId);

  if (!productIds.length) {
    return [];
  }

  const products = await Product.find({ _id: { $in: productIds }, isDeleted: { $ne: true } }).lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));

  return productIds.map((id) => byId.get(String(id))).filter(Boolean);
}

export function mapProductForClient(item) {
  const stock = Number(item.stock ?? 0);
  return {
    id: item._id.toString(),
    clientId: item.clientId?.toString?.(),
    name: item.name,
    price: Number(item.price) || 0,
    stock,
    inStock: typeof item.inStock === "boolean" ? item.inStock : stock > 0,
    brand: item.brand,
    barcode: item.barcode,
    description: item.description,
    category: Array.isArray(item.category) ? item.category : [],
    image: item.imageUrl || "",
    isCampaign: Boolean(item.isCampaign),
    isDiscounted: Boolean(item.isDiscounted),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}
