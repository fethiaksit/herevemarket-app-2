import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Product",
    },
  },
  {
    strict: false,
    collection: "users",
  }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
