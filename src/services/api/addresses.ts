import { apiFetch } from "./client";
import { Address } from "../../types";

export type AddressPayload = Pick<Address, "title" | "detail" | "note" | "isDefault">;

type GetAddressesResponse = {
  addresses: Address[];
};

function normalizeAddress(address: Address, index: number): Address {
  const resolvedId = String(address.id ?? address._id ?? `${address.title}-${index}`);
  return {
    ...address,
    id: resolvedId,
    _id: address._id ? String(address._id) : undefined,
  };
}

export async function getAddresses(token: string): Promise<Address[]> {
  const res = await apiFetch<GetAddressesResponse>("/user/addresses", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const safeAddresses = Array.isArray(res?.addresses) ? res.addresses : [];
  return safeAddresses.map((address, index) => normalizeAddress(address, index));
}

export async function createAddress(token: string, payload: AddressPayload): Promise<Address> {
  const created = await apiFetch<Address>("/user/addresses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return normalizeAddress(created, Date.now());
}

export async function updateAddress(token: string, id: string, payload: AddressPayload): Promise<Address> {
  const updated = await apiFetch<Address>(`/user/addresses/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return normalizeAddress(updated, Date.now());
}

export async function deleteAddress(token: string, id: string) {
  return apiFetch<void>(`/user/addresses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
