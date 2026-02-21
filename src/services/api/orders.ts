import { apiFetch } from "./client";
import { OrderPayload } from "../../types";

export async function submitOrder(payload: OrderPayload, accessToken?: string | null) {
  return apiFetch<{ id: string }>("/orders", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}
