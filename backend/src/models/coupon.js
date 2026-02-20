import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minCartTotal: { type: Number, default: 0, min: 0 },
  maxUses: { type: Number, default: 0 },
  maxUsesPerUser: { type: Number, default: 0 },
  startsAt: Date,
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  usedCount: { type: Number, default: 0 },
  usedBy: { type: Map, of: Number, default: {} },
}, { timestamps: true });

couponSchema.pre('validate', function normalize(next) {
  if (this.code) this.code = this.code.trim().toUpperCase();
  next();
});

export const Coupon = mongoose.model('Coupon', couponSchema);
