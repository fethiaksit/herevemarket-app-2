import { apiFetch } from "./client";
import { AuthOrderPayload, GuestOrderPayload } from "../../types";

export async function submitGuestOrder(payload: GuestOrderPayload) {
  return apiFetch<{ id: string; summary: { total: number; subtotal: number; itemCount: number } }>("/public/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitOrder(payload: AuthOrderPayload, accessToken?: string | null) {
  return apiFetch<{ id: string; summary: { total: number; subtotal: number; itemCount: number } }>("/orders", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
