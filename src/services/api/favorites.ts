import { apiFetchAuthed } from "./authedClient";
import { ProductDto } from "./products";

export async function getFavorites(accessToken?: string | null) {
  const response = await apiFetchAuthed<{ data?: ProductDto[] }>("/user/favorites", {
    accessToken,
  });

  return Array.isArray(response?.data) ? response.data : [];
}

export async function addFavorite(accessToken: string | null | undefined, productId: string) {
  return apiFetchAuthed("/user/favorites", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ productId }),
  });
}

export async function deleteFavorite(accessToken: string | null | undefined, productId: string) {
  return apiFetchAuthed(`/user/favorites/${productId}`, {
    method: "DELETE",
    accessToken,
  });
}
