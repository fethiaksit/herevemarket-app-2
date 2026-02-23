import { useState } from "react";

export type CartItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const increase = (item: { productId: string; title: string; unitPrice: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, title: item.title, unitPrice: item.unitPrice, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const decrease = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const getQuantity = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity ?? 0;

  const clearCart = () => setCart([]);

  return { cart, increase, decrease, getQuantity, clearCart };
}
