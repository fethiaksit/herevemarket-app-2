import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, SafeAreaView, StyleSheet, TextInput, View } from "react-native";
import { Header } from "./components/Header";
import { Cart } from "./components/Cart";
import { LoginModal } from "./components/LoginModal";
import { AddressModal } from "./components/AddressModal";
import { CategorySelector } from "./components/CategorySelector";
import { ProductList } from "./components/ProductList";
import { PromoSlider } from "./components/PromoSlider";
import { categories, products } from "./data";
import { ProductDetailScreen } from "./screens/ProductDetailScreen";
import { CartItem, Product } from "./types";

const PROMO_CATEGORY_ID = "promo";
const HOME_CATEGORY_ID = "home";
const DETAIL_SCREEN = "productDetail";
const HOME_SCREEN = "home";

type ScreenKey = typeof DETAIL_SCREEN | typeof HOME_SCREEN;

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(HOME_CATEGORY_ID);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenKey>(HOME_SCREEN);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<FlatList<Product>>(null);

  const handleAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (!product.inStock || product.stock === 0) {
      Alert.alert("Bu ürün stokta bulunmuyor");
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === productId);
      if (existing) return prev.map((i) => (i.id === productId ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const product = products.find((p) => p.id === id);
    if (product && (!product.inStock || product.stock === 0)) {
      Alert.alert("Bu ürün stokta bulunmuyor");
      return;
    }
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const handleRemove = (id: string) => setCartItems((prev) => prev.filter((i) => i.id !== id));

  const getQty = (id: string) => cartItems.find((i) => i.id === id)?.quantity || 0;

  const selectCategory = (categoryId: string, options?: { disableAutoScroll?: boolean }) => {
    setSelectedCategoryId(categoryId);

    if (!options?.disableAutoScroll) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setActiveScreen(DETAIL_SCREEN);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedProduct(null);
    setActiveScreen(HOME_SCREEN);
  }, []);

  const goHome = useCallback(() => {
    setSelectedCategoryId(HOME_CATEGORY_ID);
    setSelectedProduct(null);
    setActiveScreen(HOME_SCREEN);
  }, []);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name.toLowerCase();
      return acc;
    }, {});
  }, []);

  const productsByCategory = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((acc, product) => {
      if (!acc[product.categoryId]) acc[product.categoryId] = [];
      acc[product.categoryId].push(product);
      return acc;
    }, {});
  }, []);

  const isHome = selectedCategoryId === HOME_CATEGORY_ID;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const displayedProducts: Product[] = useMemo(() => {
    const baseProducts = isHome ? productsByCategory[PROMO_CATEGORY_ID] || [] : productsByCategory[selectedCategoryId] || [];
    if (!normalizedQuery) return baseProducts;
    return baseProducts.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(normalizedQuery);
      const brandMatch = product.brand?.toLowerCase().includes(normalizedQuery) ?? false;
      const categoryName = product.categoryId ? categoryNameById[product.categoryId] : "";
      const categoryMatch = categoryName?.includes(normalizedQuery) ?? false;
      return nameMatch || brandMatch || categoryMatch;
    });
  }, [categoryNameById, isHome, normalizedQuery, productsByCategory, selectedCategoryId]);

  const handleEndReached = useCallback(() => {
    // Kategori değişimi artık yalnızca kategori tıklamasından tetiklenir.
  }, []);

  const isDetailScreen = activeScreen === DETAIL_SCREEN && selectedProduct !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        cartCount={cartItems.length}
        onCartPress={() => setIsCartOpen(true)}
        onAddressPress={() => setIsAddressOpen(true)}
        onHomePress={goHome}
      />

      <View style={styles.container}>
        {isDetailScreen && selectedProduct ? (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={handleBackToList}
          />
        ) : (
          <>
            <View style={styles.searchWrapper}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ürün, kategori veya marka ara..."
                placeholderTextColor="#98a0ad"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {!isSearching ? (
              <CategorySelector
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={(categoryId) => selectCategory(categoryId, { disableAutoScroll: isHome })}
                homeOptionLabel="Anasayfa"
                homeCategoryId={HOME_CATEGORY_ID}
              />
            ) : null}

            {isHome && !isSearching ? <PromoSlider /> : null}

            <View style={styles.listWrapper}>
              <ProductList
                products={displayedProducts}
                getQuantity={getQty}
                onAdd={handleAddToCart}
                onRemove={(id) => handleUpdateQuantity(id, Math.max(0, getQty(id) - 1))}
                onProductPress={handleProductPress}
                listRef={listRef}
                onEndReached={handleEndReached}
              />
            </View>
          </>
        )}
      </View>

      <Cart
        visible={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
      <LoginModal visible={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <AddressModal visible={isAddressOpen} onClose={() => setIsAddressOpen(false)} onSelect={(a) => setSelectedAddress(a)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  listWrapper: {
    flex: 1,
    paddingTop: 4,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1d2433",
    borderWidth: 1,
    borderColor: "#e5e8ef",
  },
});
