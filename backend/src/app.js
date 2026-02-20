import express from 'express';
import cors from 'cors';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import userRouter from './routes/user.js';
import adminRouter from './routes/admin.js';
import { fail } from './lib/response.js';

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/products', productsRouter);
  app.use('/categories', categoriesRouter);
  app.use('/orders', ordersRouter);
  app.use('/user', userRouter);
  app.use('/admin/api', adminRouter);
  app.use((err, _req, res, _next) => fail(res, 500, err.message || 'Internal server error'));
  return app;
};
