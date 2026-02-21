import mongoose from "mongoose";

import { Customer } from "../models/customer.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";

export function isValidProductId(productId) {
  return mongoose.isValidObjectId(productId);
}

async function findAuthenticatedUserRecord(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  const customer = await Customer.findById(userId);
  if (customer) {
    return customer;
  }

  return User.findById(userId);
}

export async function ensureProductCanBeFavorited(productId) {
  if (!isValidProductId(productId)) {
    return { ok: false, status: 400, message: "Geçersiz productId" };
  }

  const product = await Product.findOne({ _id: productId, isDeleted: { $ne: true }, isActive: { $ne: false } }).lean();
  if (!product) {
    return { ok: false, status: 404, message: "Ürün bulunamadı" };
  }

  return { ok: true };
}

function normalizeFavoriteIds(favorites) {
  return Array.isArray(favorites) ? favorites.map((id) => String(id)) : [];
}

export async function addFavorite(userId, productId) {
  const productCheck = await ensureProductCanBeFavorited(productId);
  if (!productCheck.ok) {
    return productCheck;
  }

  const userRecord = await findAuthenticatedUserRecord(userId);
  if (!userRecord) {
    return { ok: false, status: 404, message: "User not found" };
  }

  const favoriteIds = normalizeFavoriteIds(userRecord.favorites);
  if (!favoriteIds.includes(String(productId))) {
    userRecord.favorites = [...favoriteIds, String(productId)];
    await userRecord.save();
  }

  const favorites = await listFavorites(userId);
  return { ok: true, status: 200, data: favorites };
}

export async function removeFavorite(userId, productId) {
  if (!isValidProductId(productId)) {
    return { ok: false, status: 400, message: "Geçersiz productId" };
  }

  const userRecord = await findAuthenticatedUserRecord(userId);
  if (!userRecord) {
    return { ok: false, status: 404, message: "User not found" };
  }

  const favoriteIds = normalizeFavoriteIds(userRecord.favorites);
  userRecord.favorites = favoriteIds.filter((id) => id !== String(productId));
  await userRecord.save();

  const favorites = await listFavorites(userId);
  return { ok: true, status: 200, data: favorites };
}

export async function listFavorites(userId) {
  const userRecord = await findAuthenticatedUserRecord(userId);

  if (!userRecord) {
    return [];
  }

  const favoriteIds = normalizeFavoriteIds(userRecord.favorites);
  if (!favoriteIds.length) {
    return [];
  }

  const products = await Product.find({
    _id: { $in: favoriteIds },
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).lean();

  const byId = new Map(products.map((product) => [String(product._id), product]));
  return favoriteIds.map((id) => byId.get(id)).filter(Boolean);
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
