import test from "node:test";
import assert from "node:assert/strict";

import { Customer } from "../src/models/customer.js";
import { Product } from "../src/models/product.js";
import { User } from "../src/models/user.js";
import { addFavorite, listFavorites, removeFavorite } from "../src/services/favorites.js";

test("adding favorite stores product on customer and lists products in order", async (t) => {
  const customerRecord = {
    favorites: ["507f1f77bcf86cd799439011"],
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };

  const originalCustomerFindById = Customer.findById;
  const originalUserFindById = User.findById;
  const originalFindOne = Product.findOne;
  const originalFind = Product.find;

  t.after(() => {
    Customer.findById = originalCustomerFindById;
    User.findById = originalUserFindById;
    Product.findOne = originalFindOne;
    Product.find = originalFind;
  });

  Customer.findById = async () => customerRecord;
  User.findById = async () => null;
  Product.findOne = () => ({ lean: async () => ({ _id: "507f1f77bcf86cd799439012", isDeleted: false, isActive: true }) });
  Product.find = () => ({
    lean: async () => [
      { _id: "507f1f77bcf86cd799439011", name: "Milk", isDeleted: false, isActive: true },
      { _id: "507f1f77bcf86cd799439012", name: "Bread", isDeleted: false, isActive: true },
    ],
  });

  const result = await addFavorite("507f191e810c19729de860ea", "507f1f77bcf86cd799439012");

  assert.equal(result.ok, true);
  assert.deepEqual(customerRecord.favorites, ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]);
  assert.equal(customerRecord.saveCalls, 1);
  assert.deepEqual(result.data.map((p) => p.name), ["Milk", "Bread"]);
});

test("removing favorite is idempotent and works with users fallback", async (t) => {
  const userRecord = {
    favorites: ["507f1f77bcf86cd799439011"],
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };

  const originalCustomerFindById = Customer.findById;
  const originalUserFindById = User.findById;
  const originalFind = Product.find;

  t.after(() => {
    Customer.findById = originalCustomerFindById;
    User.findById = originalUserFindById;
    Product.find = originalFind;
  });

  Customer.findById = async () => null;
  User.findById = async () => userRecord;
  Product.find = () => ({ lean: async () => [] });

  const result = await removeFavorite("507f191e810c19729de860ea", "507f1f77bcf86cd799439999");

  assert.equal(result.ok, true);
  assert.deepEqual(userRecord.favorites, ["507f1f77bcf86cd799439011"]);
  assert.equal(userRecord.saveCalls, 1);
  assert.deepEqual(result.data, []);
});

test("listing favorites excludes deleted/inactive products while preserving order", async (t) => {
  const customerRecord = {
    favorites: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  };

  const originalCustomerFindById = Customer.findById;
  const originalUserFindById = User.findById;
  const originalFind = Product.find;

  t.after(() => {
    Customer.findById = originalCustomerFindById;
    User.findById = originalUserFindById;
    Product.find = originalFind;
  });

  Customer.findById = async () => customerRecord;
  User.findById = async () => null;
  Product.find = () => ({
    lean: async () => [
      { _id: "507f1f77bcf86cd799439013", name: "Third" },
      { _id: "507f1f77bcf86cd799439011", name: "First" },
    ],
  });

  const result = await listFavorites("507f191e810c19729de860ea");
  assert.deepEqual(result.map((p) => p.name), ["First", "Third"]);
});
