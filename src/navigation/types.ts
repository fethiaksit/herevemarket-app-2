import { ProductDto } from "../services/api/products";
import { ROUTES } from "./routes";

export type RootStackParamList = {
  Home: undefined;
  CategoryProducts: {
    categoryId: string;
    categoryName: string;
    products: ProductDto[];
  };
};

export type AuthStackParamList = {
  AuthLanding: undefined;
  Login: {
    prefillEmail?: string;
  } | undefined;
  Register: undefined;
};

export type MainStackParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.ACCOUNT]: undefined;
  [ROUTES.EDIT_PROFILE]: undefined;
  [ROUTES.ADDRESS_LIST]: undefined;
  [ROUTES.FAVORITES]: undefined;
  [ROUTES.PAYMENT_METHODS]: undefined;
  [ROUTES.AUTH_LANDING]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
};
