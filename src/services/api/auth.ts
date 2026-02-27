import { apiFetch } from "./client";
import { User } from "../../types";
import { login as loginWithStorage } from "../auth/auth";
import { apiFetchAuthed } from "./authedClient";
import { API_BASE_URL } from "../../config/env";

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
  accessToken?: string;
  message?: string;
  success?: boolean;
  error?: string;
  details?: string;
};

export type RegisterResult = {
  ok: boolean;
  status: number;
  data: AuthResponse;
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

export async function registerUserRaw(payload: RegisterRequest): Promise<RegisterResult> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  return {
    ok: res.ok,
    status: res.status,
    data: (data ?? {}) as AuthResponse,
  };
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
  return apiFetchAuthed<User>("/auth/me", {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
    }),
    accessToken,
  });
}
