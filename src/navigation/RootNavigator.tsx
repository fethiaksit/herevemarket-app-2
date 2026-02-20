import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomePage from "../screens/HomePage";
import AuthLandingScreen from "../screen/AuthLandingScreen";
import LoginScreen from "../screen/LoginScreen";
import RegisterScreen from "../screen/RegisterScreen";
import AddressListScreen from "../screen/AddressListScreen";
import AccountScreen from "../screen/AccountScreen";
import { MainStackParamList } from "./types";
import { ROUTES } from "./routes";

const MainStack = createNativeStackNavigator<MainStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <MainStack.Navigator initialRouteName={ROUTES.HOME} screenOptions={{ headerShown: false }}>
        <MainStack.Screen name={ROUTES.HOME} component={HomePage} />
        <MainStack.Screen name={ROUTES.ACCOUNT} component={AccountScreen} />
        <MainStack.Screen name={ROUTES.ADDRESS_LIST} component={AddressListScreen} />
        <MainStack.Screen name={ROUTES.AUTH_LANDING} component={AuthLandingScreen} />
        <MainStack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
        <MainStack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
}
