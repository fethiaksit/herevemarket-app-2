import express from "express";
import cors from "cors";

import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/products", productsRouter);
  app.use("/categories", categoriesRouter);
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  return app;
}
