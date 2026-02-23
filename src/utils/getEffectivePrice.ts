import { Product } from "../types";

export function getEffectivePrice(product: Pick<Product, "price" | "saleEnabled" | "salePrice"> | null | undefined) {
  const price = Number(product?.price ?? 0);
  const saleEnabled = Boolean(product?.saleEnabled);
  const salePrice = Number(product?.salePrice ?? 0);

  if (saleEnabled && salePrice > 0 && salePrice < price) {
    return salePrice;
  }

  return price;
}
