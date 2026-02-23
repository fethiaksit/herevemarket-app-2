import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <RootNavigator />
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
