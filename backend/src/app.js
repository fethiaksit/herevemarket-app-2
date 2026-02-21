import express from "express";
import cors from "cors";

import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import ordersRouter from "./routes/orders.js";
import publicOrdersRouter from "./routes/publicOrders.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/products", productsRouter);
  app.use("/categories", categoriesRouter);
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/orders", ordersRouter);
  app.use("/public", publicOrdersRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Not Found", error: "NOT_FOUND" });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: "INTERNAL_SERVER_ERROR" });
  });

  return app;
}
