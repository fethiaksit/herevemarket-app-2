import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [{ productId: { type: mongoose.Schema.Types.ObjectId, required: true }, quantity: { type: Number, required: true, min: 1 } }],
}, { timestamps: true });

export const Cart = mongoose.model('Cart', cartSchema);
