import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type CartItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

export function useCart() {
  const CART_STORAGE_KEY = "herevemarket_cart";
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      try {
        const rawCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (!mounted || !rawCart) return;
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) {
          setCart(
            parsed
              .map((item) => ({
                productId: String(item?.productId ?? ""),
                title: String(item?.title ?? ""),
                unitPrice: Number(item?.unitPrice ?? 0),
                quantity: Number(item?.quantity ?? 0),
              }))
              .filter((item) => item.productId && item.quantity > 0)
          );
        }
      } catch (error) {
        console.warn("[Cart] failed to restore cart", error);
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    };

    loadCart().catch((error) => {
      console.warn("[Cart] unhandled restore error", error);
      if (mounted) {
        setIsHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const persistCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.warn("[Cart] failed to persist cart", error);
      }
    };

    persistCart().catch((error) => {
      console.warn("[Cart] unhandled persist error", error);
    });
  }, [CART_STORAGE_KEY, cart, isHydrated]);

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
