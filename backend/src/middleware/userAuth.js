import { verifyAccessToken } from "../utils/tokens.js";

export function UserAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized", error: "AUTH_REQUIRED" });
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded.userId) {
      return res.status(401).json({ message: "Unauthorized", error: "AUTH_REQUIRED" });
    }

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized", error: "AUTH_REQUIRED" });
  }
}
