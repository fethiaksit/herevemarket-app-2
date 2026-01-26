import { API_BASE_URL } from "../config/env";

const normalizedBase = API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "";

export function buildImageUrl(imagePath?: string): string {
  if (!imagePath) return "";
  const normalizedPath = imagePath.replace(/^\/+/, "");
  if (!normalizedBase) {
    return `/public/${normalizedPath}`;
  }
  return `${normalizedBase}/public/${normalizedPath}`;
}
