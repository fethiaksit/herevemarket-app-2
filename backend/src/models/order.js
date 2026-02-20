import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  items: [{ productId: { type: mongoose.Schema.Types.ObjectId, required: true }, name: String, price: Number, quantity: Number }],
  status: { type: String, enum: ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card'], default: 'cash' },
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  discountedTotal: { type: Number, required: true },
  couponCode: { type: String, default: '' },
}, { timestamps: true });

orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
