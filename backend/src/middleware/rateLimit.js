const buckets = new Map();

export function createIpRateLimiter({ windowMs = 10 * 60 * 1000, max = 10 } = {}) {
  return function ipRateLimiter(req, res, next) {
    const now = Date.now();
    const ipKey = String(req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown");
    const entry = buckets.get(ipKey);

    if (!entry || now > entry.resetAt) {
      buckets.set(ipKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(1, retryAfterSeconds)));
      return res.status(429).json({ message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.", error: "RATE_LIMITED" });
    }

    entry.count += 1;
    return next();
  };
}

export function __resetRateLimiterForTests() {
  buckets.clear();
}
