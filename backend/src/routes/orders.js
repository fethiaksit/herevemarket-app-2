import express from "express";

import { UserAuth } from "../middleware/userAuth.js";
import { createOrderFromRequest, handleOrderError } from "../services/orders.js";

const router = express.Router();

router.post("/", UserAuth, async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const customer = payload.customer || {};

    if (!customer.fullName) {
      customer.fullName = req.user?.email ? req.user.email.split("@")[0] : "Müşteri";
    }

    if (!customer.phone) {
      customer.phone = "05550000000";
    }

    const result = await createOrderFromRequest({ ...payload, customer }, { isGuest: false, userId: req.user.userId });
    return res.status(201).json(result);
  } catch (error) {
    return handleOrderError(error, res, next);
  }
});

export default router;
