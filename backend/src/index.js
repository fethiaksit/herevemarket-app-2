import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { Product } from './models/product.js';
import { Review } from './models/review.js';
import { Favorite } from './models/favorite.js';

dotenv.config();

const app = createApp();
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/herevemarket';

mongoose.connect(mongoUri).then(async () => {
  await Promise.all([Product.syncIndexes(), Review.syncIndexes(), Favorite.syncIndexes()]);
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`API listening on port ${port}`));
});
