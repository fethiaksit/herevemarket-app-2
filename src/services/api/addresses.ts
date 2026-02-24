import { apiFetchAuthed } from "./authedClient";
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

export async function getAddresses(accessToken?: string | null): Promise<Address[]> {
  const res = await apiFetchAuthed<GetAddressesResponse>("/user/addresses", {
    accessToken,
  });

  const safeAddresses = Array.isArray(res?.addresses) ? res.addresses : [];
  return safeAddresses.map((address, index) => normalizeAddress(address, index));
}

export async function createAddress(accessToken: string | null | undefined, payload: AddressPayload): Promise<Address> {
  const created = await apiFetchAuthed<Address>("/user/addresses", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });

  return normalizeAddress(created, Date.now());
}

export async function updateAddress(accessToken: string | null | undefined, id: string, payload: AddressPayload): Promise<Address> {
  const updated = await apiFetchAuthed<Address>(`/user/addresses/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });

  return normalizeAddress(updated, Date.now());
}

export async function deleteAddress(accessToken: string | null | undefined, id: string) {
  return apiFetchAuthed<void>(`/user/addresses/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
