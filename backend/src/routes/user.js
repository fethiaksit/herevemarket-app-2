import express from "express";
import { UserAuth } from "../middleware/userAuth.js";
import { addFavorite, listFavorites, mapProductForClient, removeFavorite } from "../services/favorites.js";

const router = express.Router();

router.get("/favorites", UserAuth, async (req, res, next) => {
  try {
    const products = await listFavorites(req.user.userId);
    return res.json({ data: products.map(mapProductForClient) });
  } catch (error) {
    return next(error);
  }
});

router.post("/favorites", UserAuth, async (req, res, next) => {
  try {
    const { productId } = req.body ?? {};
    const result = await addFavorite(req.user.userId, productId);

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json({ message: "Favorilere eklendi" });
  } catch (error) {
    return next(error);
  }
});

router.delete("/favorites/:productId", UserAuth, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await removeFavorite(req.user.userId, productId);

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json({ message: "Favorilerden kaldırıldı" });
  } catch (error) {
    return next(error);
  }
});

export default router;
