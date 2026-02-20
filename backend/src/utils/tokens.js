import crypto from "node:crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "dev-access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret";

function base64urlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(`${padded}${"=".repeat(padLength)}`, "base64").toString("utf8");
}

function sign(payload, secret, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, exp: now + expiresInSeconds };

  const headerSegment = base64urlEncode(JSON.stringify(header));
  const payloadSegment = base64urlEncode(JSON.stringify(fullPayload));
  const data = `${headerSegment}.${payloadSegment}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

function verify(token, secret) {
  const [headerSegment, payloadSegment, signature] = token.split(".");

  if (!headerSegment || !payloadSegment || !signature) {
    throw new Error("Invalid token");
  }

  const data = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (expectedSignature !== signature) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(base64urlDecode(payloadSegment));
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) {
    throw new Error("Token expired");
  }

  return payload;
}

export function issueTokens(user) {
  const accessToken = sign(
    {
      sub: user.id,
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    ACCESS_TOKEN_SECRET,
    15 * 60
  );

  const refreshToken = sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    REFRESH_TOKEN_SECRET,
    7 * 24 * 60 * 60
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token) {
  return verify(token, ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  return verify(token, REFRESH_TOKEN_SECRET);
}
