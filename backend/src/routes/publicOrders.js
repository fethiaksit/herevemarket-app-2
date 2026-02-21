import express from "express";

import { createIpRateLimiter } from "../middleware/rateLimit.js";
import { createOrderFromRequest, handleOrderError } from "../services/orders.js";

const router = express.Router();
const guestOrderLimiter = createIpRateLimiter({
  windowMs: Number(process.env.GUEST_ORDER_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.GUEST_ORDER_RATE_LIMIT_MAX || 10),
});

router.post("/orders", guestOrderLimiter, async (req, res, next) => {
  try {
    const result = await createOrderFromRequest(req.body ?? {}, { isGuest: true, userId: null });
    return res.status(201).json(result);
  } catch (error) {
    return handleOrderError(error, res, next);
  }
});

export default router;
