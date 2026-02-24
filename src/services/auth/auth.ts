import { apiFetch } from "../api/client";
import { tokenStorage } from "./tokenStorage";

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export async function login(credentials: LoginRequest) {
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response?.accessToken) {
    console.error("[Auth] Login succeeded but accessToken is missing", { email: credentials.email });
    throw new Error("Giriş başarılı görünüyor ancak oturum anahtarı alınamadı. Lütfen tekrar deneyin.");
  }

  await tokenStorage.setAccessToken(response.accessToken);
  console.log("[Auth] token saved");
  return response;
}

export async function logout() {
  await tokenStorage.clear();
}
