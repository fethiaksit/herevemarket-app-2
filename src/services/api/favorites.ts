import { apiFetch } from "./client";
import { ProductDto } from "./products";

export async function getFavorites(token: string) {
  const response = await apiFetch<{ data?: ProductDto[] }>("/user/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return Array.isArray(response?.data) ? response.data : [];
}

export async function addFavorite(token: string, productId: string) {
  return apiFetch("/user/favorites", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId }),
  });
}

export async function deleteFavorite(token: string, productId: string) {
  return apiFetch(`/user/favorites/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
