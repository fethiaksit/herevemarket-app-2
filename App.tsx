import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <RootNavigator />
      </FavoritesProvider>
    </AuthProvider>
  );
}
