import { tokenStorage } from "../auth/tokenStorage";
import { apiFetch, ApiFetchOptions } from "./client";

export async function apiFetchAuthed<T>(path: string, options: ApiFetchOptions = {}) {
  const storedToken = await tokenStorage.getAccessToken();
  const accessToken = options.accessToken ?? storedToken;

  console.log("[apiFetchAuthed] token exists?", Boolean(accessToken));

  return apiFetch<T>(path, {
    ...options,
    accessToken,
  });
}
