import { apiFetch } from "./client";


type RawProduct = {
  id?: string;
  name?: string;
  price?: number | string;
  saleEnabled?: boolean;
  salePrice?: number | string | null;
  brand?: string;
  barcode?: string;
  stock?: number | string;
  inStock?: boolean;
  imagePath?: string;
  image?: string;
  imageUrl?: string;
  category?: string | string[];
  description?: string;
  isCampaign?: boolean;
  isDiscounted?: boolean;
  _id?: string;
  clientId?: string | number;
};
export type ProductInput = {
  name: string;
  price: number;
  saleEnabled?: boolean;
  salePrice?: number;
  brand?: string;
  barcode?: string;
  stock?: number;
  inStock?: boolean;
  image?: string;
  category?: string[];
  description?: string;
  isCampaign?: boolean;
  isDiscounted?: boolean;
};
export type ProductDto = {
  id: string;
  name: string;
  price: number;
  saleEnabled: boolean;
  salePrice?: number;
  brand?: string;
  barcode?: string;
  stock: number;
  inStock: boolean;
  imagePath?: string;
  image?: string;
  imageUrl?: string;
  category: string[];
  description?: string;
  isCampaign?: boolean;
  isDiscounted?: boolean;
};

type ProductsResponse =
  | RawProduct[]
  | { data?: RawProduct[]; pagination?: RawPagination }
  | { data?: { data?: RawProduct[]; pagination?: unknown } };

type RawPagination = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type ProductsQuery = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
};

export type ProductsResult = {
  items: ProductDto[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};


  export async function fetchProducts() {
    return apiFetch("/products"); // resolves to https://api.herevemarket.com/products when API_BASE_URL is set
  }

  export async function createProduct(payload: ProductInput) {
    return apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
const mapRawProducts = (rawData: RawProduct[]): ProductDto[] => {
  return rawData
    .map((item) => {
      const stock = Number(item.stock ?? 0);
      const inStock = typeof item.inStock === "boolean" ? item.inStock : stock > 0;

      return {
        id: String(item.id ?? item._id ?? item.clientId ?? ""),
        name: item.name ?? "Adsız Ürün",
        price: Number(item.price) || 0,
        saleEnabled: Boolean(item.saleEnabled),
        salePrice: item.salePrice == null ? undefined : Number(item.salePrice) || 0,
        brand: item.brand,
        barcode: item.barcode,
        stock,
        inStock,
        imagePath: item.imagePath,
        image: item.image ?? item.imageUrl,
        description: item.description,
        category: Array.isArray(item.category) ? item.category : item.category ? [item.category] : [],
        isCampaign: Boolean(item.isCampaign),
        isDiscounted: Boolean(item.isDiscounted),
      };
    })
    .filter((item) => item.id);
};

const mapPagination = (pagination?: RawPagination) => {
  if (!pagination) return undefined;
  const page = Number(pagination.page);
  const limit = Number(pagination.limit);
  const total = Number(pagination.total);
  const totalPages = Number(pagination.totalPages);

  if (![page, limit, total, totalPages].every((value) => Number.isFinite(value) && value >= 0)) {
    return undefined;
  }

  return { page, limit, total, totalPages };
};

export async function getProducts(query: ProductsQuery = {}): Promise<ProductsResult> {
  console.log("[getProducts] request started");
  console.log("[getProducts] public request, no token");
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);

  const path = params.toString().length ? `/products?${params.toString()}` : "/products";

  const response = await apiFetch<ProductsResponse>(path, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const rawData = Array.isArray(response)
    ? response
    : Array.isArray((response as { data?: RawProduct[] })?.data)
    ? ((response as { data?: RawProduct[] }).data ?? [])
    : Array.isArray((response as { data?: { data?: RawProduct[] } })?.data?.data)
    ? ((response as { data?: { data?: RawProduct[] } }).data?.data ?? [])
    : [];

  const pagination = !Array.isArray(response)
    ? mapPagination((response as { pagination?: RawPagination })?.pagination)
    : undefined;

  return {
    items: mapRawProducts(rawData),
    pagination,
  };
}
