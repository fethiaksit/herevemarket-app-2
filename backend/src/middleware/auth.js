import jwt from 'jsonwebtoken';
import { fail } from '../lib/response.js';

const decodeAuth = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
};

export const userAuth = (req, res, next) => {
  const claims = decodeAuth(req);
  if (!claims) return fail(res, 401, 'Unauthorized');
  const userId = claims.userId || claims.sub;
  if (!userId) return fail(res, 401, 'Invalid token payload');
  req.auth = { userId: String(userId), role: claims.role || 'user' };
  next();
};

export const adminAuth = (req, res, next) => {
  userAuth(req, res, () => {
    if (req.auth.role !== 'admin') return fail(res, 403, 'Admin only');
    next();
  });
};
