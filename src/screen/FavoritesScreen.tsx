import React, { useCallback } from "react";
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../context/FavoritesContext";
import { styles } from "../screens/styles";
import { THEME } from "../constants/theme";
import { MainStackParamList } from "../navigation/types";
import { ROUTES } from "../navigation/routes";
import { formatPrice } from "../utils/cartPrice";
import { buildImageUrl } from "../utils/buildImageUrl";
import { ProductDto } from "../services/api/products";

type Navigation = NativeStackNavigationProp<MainStackParamList>;

export default function FavoritesScreen() {
  const navigation = useNavigation<Navigation>();
  const { favorites, loading, toggleFavorite } = useFavorites();
  const { increase, decrease, getQuantity } = useCart();

  const handleToggle = useCallback(async (product: ProductDto) => {
    const result = await toggleFavorite(product);
    if (result.error) {
      Alert.alert("Favoriler", result.error);
    }
  }, [toggleFavorite]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenterAbsolute}>
          <Text style={styles.headerTitle}>Favoriler</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator size="small" color={THEME.primary} style={{ marginTop: 20 }} /> : null}

      {!loading && favorites.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Henüz favorin yok</Text>
          <TouchableOpacity style={[styles.primaryButton, { marginTop: 16, paddingHorizontal: 20 }]} onPress={() => navigation.navigate(ROUTES.HOME)}>
            <Text style={styles.primaryButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={favorites}
        numColumns={2}
        columnWrapperStyle={favorites.length > 1 ? styles.gridContainer : undefined}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const qty = getQuantity(item.id);
          const imageUrl = item.imagePath ? buildImageUrl(item.imagePath) : item.image ?? "";

          return (
            <View style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <TouchableOpacity onPress={() => handleToggle(item)} style={styles.favoriteButton}>
                  <Ionicons name="heart" size={20} color={THEME.danger} />
                </TouchableOpacity>
                {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.productImage} /> : null}
              </View>
              <View style={styles.productInfoContainer}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.productBottomRow}>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.addButton} onPress={() => increase(item.id)}>
                      <Text style={styles.addButtonText}>EKLE</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.counterContainer}>
                      <TouchableOpacity onPress={() => decrease(item.id)} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
                      <Text style={styles.counterValue}>{qty}</Text>
                      <TouchableOpacity onPress={() => increase(item.id)} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
