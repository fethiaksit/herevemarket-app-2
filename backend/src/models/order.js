import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalLinePrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null, index: true },
    isGuest: { type: Boolean, required: true, default: false, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    customerEmail: { type: String, default: "", trim: true, maxlength: 120 },
    addressTitle: { type: String, default: "", trim: true, maxlength: 80 },
    addressDetail: { type: String, required: true, trim: true, maxlength: 500 },
    addressNote: { type: String, default: "", trim: true, maxlength: 300 },
    paymentMethod: { type: String, enum: ["cash", "card"], required: true },
    couponCode: { type: String, default: "", trim: true, maxlength: 50 },
    items: { type: [orderItemSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, default: "pending", trim: true },
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.();
    delete ret._id;
    delete ret.__v;
  },
});

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
