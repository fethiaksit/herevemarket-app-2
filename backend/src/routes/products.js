import express from "express";
import { Product } from "../models/product.js";

const router = express.Router();

const normalizeProduct = (item) => {
  const id = item.id || item._id?.toString?.() || "";

  return {
    id,
    name: item.name,
    price: Number(item.price) || 0,
    saleEnabled: Boolean(item.saleEnabled),
    salePrice: item.salePrice == null ? undefined : Number(item.salePrice) || 0,
    category: Array.isArray(item.category) ? item.category : [],
    image: item.imageUrl || "",
    stock: Number(item.stock) || 0,
    inStock: Number(item.stock) > 0,
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt?.toISOString?.() || new Date().toISOString(),
  };
};

const parseSaleFields = (body = {}) => {
  const saleEnabled = Boolean(body.saleEnabled);
  const salePriceRaw = body.salePrice;
  const salePrice = salePriceRaw == null || salePriceRaw === "" ? null : Number(salePriceRaw);

  if (saleEnabled) {
    if (salePrice == null || !Number.isFinite(salePrice) || salePrice <= 0) {
      return { ok: false, message: "İndirimli ürün için 'salePrice' zorunludur ve 0'dan büyük olmalıdır." };
    }
  }

  return { ok: true, saleEnabled, salePrice };
};

router.get("/", (req, res) => {
  res.json({ message: "products ok" });
});


router.post("/", async (req, res, next) => {
  try {
    const { name, price, stock = 0, category = [], imageUrl = "", isActive = true, createdAt } = req.body ?? {};
    const sale = parseSaleFields(req.body ?? {});

    if (!name || typeof price !== "number") {
      return res.status(400).json({ message: "'name' ve 'price' alanları zorunludur." });
    }

    if (!sale.ok) {
      return res.status(400).json({ message: sale.message });
    }

    if (sale.saleEnabled && sale.salePrice >= Number(price)) {
      return res.status(400).json({ message: "'salePrice', 'price' değerinden küçük olmalıdır." });
    }

    const product = await Product.create({
      name: String(name).trim(),
      price: Number(price),
      saleEnabled: sale.saleEnabled,
      salePrice: sale.saleEnabled ? sale.salePrice : null,
      stock: Number(stock),
      category: Array.isArray(category) ? category : [category].filter(Boolean),
      imageUrl: String(imageUrl || ""),
      isActive: Boolean(isActive),
      createdAt: createdAt ? new Date(createdAt) : undefined,
    });

    res.status(201).json({ data: normalizeProduct(product.toJSON()) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, stock = 0, category = [], imageUrl = "", isActive = true } = req.body ?? {};
    const sale = parseSaleFields(req.body ?? {});

    if (!name || typeof price !== "number") {
      return res.status(400).json({ message: "'name' ve 'price' alanları zorunludur." });
    }

    if (!sale.ok) {
      return res.status(400).json({ message: sale.message });
    }

    if (sale.saleEnabled && sale.salePrice >= Number(price)) {
      return res.status(400).json({ message: "'salePrice', 'price' değerinden küçük olmalıdır." });
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        price: Number(price),
        saleEnabled: sale.saleEnabled,
        salePrice: sale.saleEnabled ? sale.salePrice : null,
        stock: Number(stock),
        category: Array.isArray(category) ? category : [category].filter(Boolean),
        imageUrl: String(imageUrl || ""),
        isActive: Boolean(isActive),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    return res.status(200).json({ data: normalizeProduct(updated.toJSON()) });
  } catch (error) {
    return next(error);
  }
});

export default router;
