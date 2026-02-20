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
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.ADDRESS_LIST]: undefined;
  [ROUTES.AUTH_LANDING]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
};
