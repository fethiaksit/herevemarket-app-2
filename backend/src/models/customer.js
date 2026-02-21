import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Product",
    },
  },
  {
    strict: false,
    collection: "customers",
  }
);

export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
