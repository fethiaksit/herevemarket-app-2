import { apiFetch } from "./client";
import { User } from "../../types";
import { login as loginWithStorage } from "../auth/auth";
import { apiFetchAuthed } from "./authedClient";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
};

export async function loginUser(payload: LoginRequest) {
  return loginWithStorage(payload);
}

export async function registerUser(payload: RegisterRequest) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(accessToken?: string | null) {
  return apiFetchAuthed<User>("/auth/me", {
    accessToken,
  });
}

export type UpdateProfileRequest = {
  name: string;
  phone: string;
  email?: string;
};

export async function updateCurrentUserProfile(payload: UpdateProfileRequest, accessToken?: string | null) {
  const endpoints = ["/user/me", "/user/profile", "/auth/me"];
  let lastError: unknown;

  for (const path of endpoints) {
    try {
      return await apiFetchAuthed<User>(path, {
        method: "PATCH",
        body: JSON.stringify(payload),
        accessToken,
      });
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: number }).status) : 0;
      if (status === 404 || status === 405) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Profil güncelleme endpoint'i bulunamadı.");
}
