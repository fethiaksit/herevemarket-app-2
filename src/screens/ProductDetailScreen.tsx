import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { buildImageUrl } from "../utils/buildImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { getEffectivePrice } from "../utils/getEffectivePrice";
import type { Product } from "../types/home";

type Props = {
  product: Product;
  quantity?: number;
  isFavorite?: boolean;
  onBack: () => void;
  onIncrease?: (id: string) => void;
  onDecrease?: (id: string) => void;
  onGoToCart?: () => void;
  onToggleFavorite?: () => void;
  relatedProducts?: Product[];
  relatedLoading?: boolean;
  onSelectRelatedProduct?: (product: Product) => void;
};

const THEME = {
  primary: "#004AAD",
  secondary: "#FFD700",
  textDark: "#1F2937",
  white: "#FFFFFF",
  background: "#F8F9FA",
  danger: "#EF4444",
  borderColor: "#E5E7EB",
  textGray: "#6B7280",
};

export const ProductDetailScreen: React.FC<Props> = ({
  product,
  quantity = 0,
  isFavorite = false,
  onBack,
  onIncrease = () => undefined,
  onDecrease = () => undefined,
  onGoToCart = () => undefined,
  onToggleFavorite = () => undefined,
  relatedProducts = [],
  relatedLoading = false,
  onSelectRelatedProduct,
}) => {
  const isOutOfStock = product.stock === 0;
  const description =
    product.description && product.description.trim().length > 0
      ? product.description
      : "Bu ürün için açıklama bulunmamaktadır.";
  const imageUrl = product.imagePath ? buildImageUrl(product.imagePath) : product.image ?? "";
  const activePrice = getEffectivePrice(product);
  const isOnSale = activePrice < Number(product.price);

  const renderRelatedItem = ({ item }: { item: Product }) => {
    const relatedImage = item.imagePath ? buildImageUrl(item.imagePath) : item.image ?? "";
    const relatedPrice = getEffectivePrice(item);

    return (
      <TouchableOpacity style={styles.relatedCard} onPress={() => onSelectRelatedProduct?.(item)} activeOpacity={0.9}>
        <View style={styles.relatedImageWrap}>
          {relatedImage ? <Image source={{ uri: relatedImage }} style={styles.relatedImage} resizeMode="contain" /> : null}
        </View>
        <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.relatedPrice}>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(relatedPrice)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <AppHeader title="Ürün Detayı" onBack={onBack} />
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.favoriteHeaderBtn} onPress={onToggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? THEME.danger : "#6B7280"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" /> : <View style={[styles.image, { backgroundColor: "#eee" }]} />}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(activePrice)}</Text>
              {isOnSale ? <Text style={styles.originalPrice}>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.price)}</Text> : null}
            </View>
            {isOutOfStock ? (
              <View style={[styles.stockBadge, styles.bgRed]}>
                <Text style={[styles.stockText, styles.stockTextOutOfStock]}>Tükendi</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          {product.barcode && <Text style={styles.meta}>Barkod: <Text style={styles.metaValue}>{product.barcode}</Text></Text>}

          <Text style={styles.sectionTitle}>Ürün Açıklaması</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {relatedLoading ? (
          <View style={styles.relatedLoading}>
            <ActivityIndicator size="small" color={THEME.primary} />
          </View>
        ) : null}

        {relatedProducts.length > 0 ? (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Önerilen Ürünler</Text>
            {/* Test notu: Ürün detay altında random öneriler yatay kaydırılabiliyor ve karta basınca ürüne gidiyor. */}
            <FlatList
              horizontal
              data={relatedProducts}
              keyExtractor={(item) => item.id}
              renderItem={renderRelatedItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              removeClippedSubviews
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {quantity === 0 ? (
          <TouchableOpacity style={[styles.addButton, isOutOfStock && styles.disabledButton]} onPress={() => onIncrease(product.id)} disabled={isOutOfStock}>
            <Text style={[styles.addButtonText, isOutOfStock && { color: "#999" }]}>{isOutOfStock ? "Stokta Yok" : "Sepete Ekle"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeFooterRow}>
            <View style={styles.counterWrapper}>
              <TouchableOpacity style={styles.counterBtnSmall} onPress={() => onDecrease(product.id)}>
                <Text style={styles.counterBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValueText}>{quantity}</Text>
              <TouchableOpacity style={[styles.counterBtnSmall, isOutOfStock && styles.counterBtnDisabled]} onPress={() => onIncrease(product.id)} disabled={isOutOfStock}>
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.goToCartButton} onPress={onGoToCart}>
              <Text style={styles.goToCartText}>Sepete Git ➔</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  headerActions: { alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 8, backgroundColor: THEME.white },
  favoriteHeaderBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  imageContainer: { backgroundColor: THEME.white, height: 300, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  image: { width: "80%", height: "80%" },
  infoCard: { backgroundColor: THEME.white, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 400, marginTop: -20, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  brand: { fontSize: 14, color: "#6B7280", fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
  name: { fontSize: 22, fontWeight: "bold", color: THEME.textDark, marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  price: { fontSize: 24, fontWeight: "bold", color: THEME.primary },
  originalPrice: { fontSize: 13, color: THEME.textGray, textDecorationLine: "line-through", marginTop: 4 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bgRed: { backgroundColor: "#FEE2E2" },
  stockText: { fontWeight: "700", fontSize: 12 },
  stockTextOutOfStock: { color: THEME.danger },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginBottom: 16 },
  meta: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  metaValue: { color: THEME.textDark, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: THEME.textDark, marginTop: 12, marginBottom: 8 },
  description: { fontSize: 14, color: "#4B5563", lineHeight: 22 },
  relatedSection: { marginTop: 14, paddingLeft: 16, paddingBottom: 8 },
  relatedTitle: { fontSize: 18, fontWeight: "700", color: THEME.textDark, marginBottom: 10 },
  relatedCard: { width: 132, borderRadius: 14, backgroundColor: THEME.white, padding: 10, marginRight: 10, borderWidth: 1, borderColor: THEME.borderColor },
  relatedImageWrap: { width: "100%", height: 90, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA", borderRadius: 10, marginBottom: 8 },
  relatedImage: { width: "80%", height: "80%" },
  relatedName: { fontSize: 12, color: THEME.textDark, minHeight: 34 },
  relatedPrice: { marginTop: 6, fontSize: 13, fontWeight: "700", color: THEME.primary },
  relatedLoading: { paddingVertical: 12 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: THEME.white, padding: 16, borderTopWidth: 1, borderColor: "#E5E7EB" },
  addButton: { backgroundColor: THEME.secondary, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  disabledButton: { backgroundColor: "#E5E7EB" },
  addButtonText: { fontSize: 16, fontWeight: "bold", color: THEME.textDark },
  activeFooterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  counterWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4 },
  counterBtnSmall: { width: 44, height: 44, borderRadius: 10, backgroundColor: THEME.white, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  counterBtnDisabled: { backgroundColor: "#E5E7EB" },
  counterBtnText: { fontSize: 20, fontWeight: "bold", color: THEME.primary },
  counterValueText: { fontSize: 18, fontWeight: "bold", color: THEME.textDark, marginHorizontal: 16 },
  goToCartButton: { flex: 1, backgroundColor: THEME.primary, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  goToCartText: { color: THEME.white, fontSize: 16, fontWeight: "bold" },
});
