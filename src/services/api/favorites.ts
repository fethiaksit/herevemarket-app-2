import { apiFetch } from "./client";
import { ProductDto } from "./products";

export async function getFavorites(accessToken: string) {
  const response = await apiFetch<{ data?: ProductDto[] }>("/user/favorites", {
    accessToken,
  });

  return Array.isArray(response?.data) ? response.data : [];
}

export async function addFavorite(accessToken: string, productId: string) {
  return apiFetch("/user/favorites", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ productId }),
  });
}

export async function deleteFavorite(accessToken: string, productId: string) {
  return apiFetch(`/user/favorites/${productId}`, {
    method: "DELETE",
    accessToken,
  });
}
