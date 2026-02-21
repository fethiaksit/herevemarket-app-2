import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    saleEnabled: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    clientId: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret.clientId ?? ret._id?.toString?.();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const Product = mongoose.model("Product", productSchema);
