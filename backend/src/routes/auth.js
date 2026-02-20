import express from "express";

import { findUserByEmail, findUserById } from "../authStore.js";
import { UserAuth } from "../middleware/userAuth.js";
import { issueTokens, verifyRefreshToken } from "../utils/tokens.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const tokens = issueTokens(user);
  return res.json(tokens);
});

router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tokens = issueTokens(user);
    return res.json(tokens);
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.get("/me", UserAuth, (req, res) => {
  const user = findUserById(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ id: user.id, email: user.email, role: user.role });
});

export default router;
