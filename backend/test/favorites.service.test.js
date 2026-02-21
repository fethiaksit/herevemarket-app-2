import test from "node:test";
import assert from "node:assert/strict";

import { Favorite } from "../src/models/favorite.js";
import { Product } from "../src/models/product.js";
import { addFavorite, listFavorites, removeFavorite } from "../src/services/favorites.js";

test("add/list/remove favorites service flow", async (t) => {
  const calls = [];

  const originalFindOne = Product.findOne;
  const originalUpdateOne = Favorite.updateOne;
  const originalDeleteOne = Favorite.deleteOne;
  const originalFind = Favorite.find;
  const originalProductFind = Product.find;

  t.after(() => {
    Product.findOne = originalFindOne;
    Favorite.updateOne = originalUpdateOne;
    Favorite.deleteOne = originalDeleteOne;
    Favorite.find = originalFind;
    Product.find = originalProductFind;
  });

  Product.findOne = () => ({ lean: async () => ({ _id: "507f1f77bcf86cd799439011", name: "Süt", isDeleted: false }) });
  Favorite.updateOne = async (...args) => {
    calls.push(["updateOne", ...args]);
    return { acknowledged: true };
  };
  Favorite.deleteOne = async (...args) => {
    calls.push(["deleteOne", ...args]);
    return { acknowledged: true };
  };
  Favorite.find = () => ({
    sort: () => ({
      lean: async () => [{ userId: "customer-1", productId: "507f1f77bcf86cd799439011" }],
    }),
  });
  Product.find = () => ({
    lean: async () => [{ _id: "507f1f77bcf86cd799439011", name: "Süt", price: 45, imageUrl: "" }],
  });

  const addResult = await addFavorite("customer-1", "507f1f77bcf86cd799439011");
  assert.equal(addResult.ok, true);
  assert.equal(addResult.status, 200);

  const listResult = await listFavorites("customer-1");
  assert.equal(listResult.length, 1);
  assert.equal(listResult[0].name, "Süt");

  const removeResult = await removeFavorite("customer-1", "507f1f77bcf86cd799439011");
  assert.equal(removeResult.ok, true);

  assert.equal(calls.some((item) => item[0] === "updateOne"), true);
  assert.equal(calls.some((item) => item[0] === "deleteOne"), true);
});
