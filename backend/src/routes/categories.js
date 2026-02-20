import express from 'express';
import { Category } from '../models/category.js';
import { ok } from '../lib/response.js';

const router = express.Router();
router.get('/', async (_req, res) => ok(res, await Category.find({ isActive: true }).sort({ name: 1 })));

export default router;
