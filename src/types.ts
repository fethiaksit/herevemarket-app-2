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
  name?: string;
  quantity: number;
  price: number;
};

export type PaymentMethodPayload = {
  id: string;
  label: string;
};

export type OrderCustomerPayload = {
  title: string;
  detail: string;
  note: string;
};

export type OrderPayload = {
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  customer: OrderCustomerPayload;
  paymentMethod: PaymentMethodPayload;
};

export type GuestOrderPayload = {
  items: OrderItemPayload[];
  customer: { fullName: string; phone: string; email?: string };
  delivery: { title?: string; detail: string; note?: string };
  paymentMethod: PaymentMethodPayload | "cash" | "card";
  couponCode?: string;
};

export type AuthOrderPayload = OrderPayload;
