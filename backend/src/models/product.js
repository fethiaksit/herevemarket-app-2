import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: [String], default: [] },
  imageUrl: { type: String, default: '', trim: true },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  isCampaign: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
