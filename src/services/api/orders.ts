import { apiFetch } from "./client";
import { apiFetchAuthed } from "./authedClient";
import { AuthOrderPayload, GuestOrderPayload } from "../../types";

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce((acc, [key, item]) => {
      if (item === undefined) return acc;
      acc[key] = removeUndefinedDeep(item);
      return acc;
    }, {} as Record<string, unknown>) as T;
  }

  return value;
}

export async function submitGuestOrder(payload: GuestOrderPayload) {
  const cleanPayload = removeUndefinedDeep(payload);
  return apiFetch<{ id: string; summary: { total: number; subtotal: number; itemCount: number } }>("/public/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanPayload),
  });
}

export async function submitOrder(payload: AuthOrderPayload, accessToken?: string | null) {
  const cleanPayload = removeUndefinedDeep({
    ...payload,
    items: payload.items.map((item) => ({
      ...item,
      productId: String(item.productId ?? "").trim(),
    })),
    paymentMethod: {
      id: String(payload.paymentMethod?.id ?? "").trim(),
      label: String(payload.paymentMethod?.label ?? "").trim(),
    },
    customer: {
      title: String(payload.customer?.title ?? "").trim(),
      detail: String(payload.customer?.detail ?? "").trim(),
      note: String(payload.customer?.note ?? "").trim(),
    },
  });

  return apiFetchAuthed<{ id: string; summary: { total: number; subtotal: number; itemCount: number } }>("/orders", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanPayload),
  });
}
