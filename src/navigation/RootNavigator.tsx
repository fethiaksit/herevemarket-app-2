import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomePage from "../screens/HomePage";
import AuthLandingScreen from "../screen/AuthLandingScreen";
import LoginScreen from "../screen/LoginScreen";
import RegisterScreen from "../screen/RegisterScreen";
import AddressListScreen from "../screen/AddressListScreen";
import { MainStackParamList } from "./types";

const MainStack = createNativeStackNavigator<MainStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <MainStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Home" component={HomePage} />
        <MainStack.Screen name="AddressList" component={AddressListScreen} />
        <MainStack.Screen name="AuthLanding" component={AuthLandingScreen} />
        <MainStack.Screen name="Login" component={LoginScreen} />
        <MainStack.Screen name="Register" component={RegisterScreen} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
}
