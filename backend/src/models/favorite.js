import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Favorite = mongoose.model("Favorite", favoriteSchema);
