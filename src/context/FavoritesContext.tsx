import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ProductDto } from "../services/api/products";
import { addFavorite, deleteFavorite, getFavorites } from "../services/api/favorites";
import { useAuth } from "./AuthContext";

export type FavoriteToggleResult = { requiresAuth?: boolean; error?: string };

type FavoritesContextValue = {
  favorites: ProductDto[];
  favoriteIds: Set<string>;
  loading: boolean;
  refreshFavorites: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: ProductDto, onAuthRequired?: () => void) => Promise<FavoriteToggleResult>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<ProductDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const items = await getFavorites(token);
      setFavorites(items);
      setFavoriteIds(new Set(items.map((item) => item.id)));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (product: ProductDto, onAuthRequired?: () => void) => {
      if (!token) {
        onAuthRequired?.();
        return { requiresAuth: true };
      }

      const wasFavorite = favoriteIds.has(product.id);
      const nextIds = new Set(favoriteIds);
      if (wasFavorite) {
        nextIds.delete(product.id);
      } else {
        nextIds.add(product.id);
      }
      setFavoriteIds(nextIds);
      setFavorites((prev) => (wasFavorite ? prev.filter((item) => item.id !== product.id) : [product, ...prev]));

      try {
        if (wasFavorite) {
          await deleteFavorite(token, product.id);
        } else {
          await addFavorite(token, product.id);
        }
        return {};
      } catch (error) {
        setFavoriteIds(new Set(favoriteIds));
        setFavorites((prev) => (wasFavorite ? [product, ...prev] : prev.filter((item) => item.id !== product.id)));
        return { error: error instanceof Error ? error.message : "Favori işlemi başarısız." };
      }
    },
    [favoriteIds, token]
  );

  const value = useMemo(
    () => ({ favorites, favoriteIds, loading, refreshFavorites, isFavorite, toggleFavorite }),
    [favorites, favoriteIds, loading, refreshFavorites, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
