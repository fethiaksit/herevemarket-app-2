export type Category = {
  id: string;
  name: string;
  image?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  saleEnabled?: boolean;
  salePrice?: number;
  brand?: string;
  barcode?: string;
  stock: number;
  inStock: boolean;
  isCampaign?: boolean;
  categoryId?: string;
  imagePath?: string;
  image?: string;
  description?: string;
  category?: string;
};

export type CartItem = Product & { quantity: number };

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Address = {
  id: string;
  _id?: string;
  title: string;
  detail: string;
  note?: string;
  isDefault?: boolean;
};

export type OrderItemPayload = {
  productId: string;
  quantity: number;
};

export type GuestOrderPayload = {
  items: OrderItemPayload[];
  customer: { fullName: string; phone: string; email?: string };
  delivery: { title?: string; detail: string; note?: string };
  paymentMethod: "cash" | "card";
  couponCode?: string;
};

export type AuthOrderPayload = GuestOrderPayload;
