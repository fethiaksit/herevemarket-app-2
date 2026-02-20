import dotenv from "dotenv";
import mongoose from "mongoose";

import { createApp } from "./app.js";

dotenv.config();

const app = createApp();

const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb+srv://fethi35aksit_db_user:_4iG3K@7kt5@dKM@herevemarket.wtveln1.mongodb.net/?appName=herevemarket";

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Mongo connection failed", err);
  });

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
