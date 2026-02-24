import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  Linking,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// --- IMPORT ---
import { ProductDetailScreen } from "./ProductDetailScreen";

// --- HOOKS / UTILS / API ---
import { useCart } from "../hooks/useCart";
import { formatPrice } from "../utils/cartPrice";
import { getEffectivePrice } from "../utils/getEffectivePrice";
import { buildImageUrl } from "../utils/buildImageUrl";
import { getProducts } from "../services/api/products";
import { getCategories, CategoryDto } from "../services/api/categories";
import { createAddress, deleteAddress, getAddresses, updateAddress } from "../services/api/addresses";
import { normalizeApiError } from "../services/api/client";
import { submitGuestOrder, submitOrder } from "../services/api/orders";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { ROUTES } from "../navigation/routes";

// --- TYPES / STYLES / CONSTANTS ---
import { Address, AuthOrderPayload, GuestOrderPayload } from "../types";
import { styles } from "./styles";
import { THEME } from "../constants/theme";
import {
  CAMPAIGN_CATEGORY_ID,
  dailyDeals,
  fallbackCategories,
  fallbackProducts,
  initialAddresses,
  initialPaymentMethods,
  markalar,
  placeholderImage,
  ensureCampaignCategory,
} from "../constants/mockData";
import { LEGAL_URLS } from "../constants/legalUrls";
import { CartLineItem, LegalUrlKey, PaymentMethod, Product, Screen } from "../types/home";

// --- SCREENS ---
import CartSheetContent from "../components/CartSheetContent";
import AddressScreen from "./flow/AddressScreen";
import GuestAddressScreen from "./flow/GuestAddressScreen";
import PaymentScreen from "./flow/PaymentScreen";
import AddAddressScreen from "./flow/AddAddressScreen";
import AddCardScreen from "./flow/AddCardScreen";
import SummaryScreen from "./flow/SummaryScreen";
import SuccessScreen from "./flow/SuccessScreen";

// --- HOME COMPONENTS ---
import HomeHeader from "./home/HomeHeader";
import HomeSlider from "./home/HomeSlider";
import BrandScroller from "./home/BrandScroller";
import AuthGateSheet from "../components/AuthGateSheet";
import BottomSheetModal from "../components/BottomSheetModal";

const buildGuestOrderPayload = (
  cartDetails: CartLineItem[],
  address: Address,
  payment: PaymentMethod,
  guestContact?: { fullName: string; phone: string; email?: string }
): GuestOrderPayload => ({
  items: cartDetails.map(({ product, quantity, unitPrice }) => ({
    productId: String(product.id),
    quantity,
    price: Number(unitPrice),
  })),
  customer: {
    fullName: (guestContact?.fullName || "Müşteri").trim(),
    phone: (guestContact?.phone || "05550000000").trim(),
    ...(guestContact?.email?.trim() ? { email: guestContact.email.trim() } : {}),
  },
  delivery: {
    title: String(address.title || "").trim(),
    detail: String(address.detail || "").trim(),
    note: String(address.note || "").trim(),
  },
  paymentMethod: {
    id: String(payment.id || "").trim(),
    label: String(payment.label || "").trim(),
  },
});

const buildAuthOrderPayload = (cartDetails: CartLineItem[], address: Address, payment: PaymentMethod): AuthOrderPayload => ({
  items: cartDetails
    .map(({ product, quantity, unitPrice }) => ({
      productId: String(product.id || "").trim(),
      name: String(product.name || "").trim(),
      price: Number(unitPrice),
      quantity: Number(quantity),
    }))
    .filter((item) => item.productId && item.name && Number.isFinite(item.price) && Number.isFinite(item.quantity) && item.quantity > 0),
  totalPrice: Number(
    cartDetails.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
  ),
  customer: {
    title: String(address.title || "").trim(),
    detail: String(address.detail || "").trim(),
    note: String(address.note || "").trim(),
  },
  paymentMethod: {
    id: String(payment.id || "").trim(),
    label: String(payment.label || "").trim(),
  },
});

export default function HomePage() {
  const navigation = useNavigation<any>();
  const { user, token, authChecked, isGuest, logout } = useAuth();
  const { cart, increase, decrease, getQuantity, clearCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const products = items;
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(CAMPAIGN_CATEGORY_ID);

  // ✅ Arama state
  const [searchQuery, setSearchQuery] = useState("");

  // Detay sayfası state'leri
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>("home");

  // Diğer State'ler
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(initialAddresses[0]?.id ?? "");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(initialPaymentMethods[0]?.id ?? "");
  const [orderId, setOrderId] = useState<string>("");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressSubmitLoading, setAddressSubmitLoading] = useState(false);
  const [guestAddress, setGuestAddress] = useState({ title: "", detail: "", note: "" });
  const [guestInfo, setGuestInfo] = useState({ fullName: "", phone: "", email: "" });
  const [guestErrors, setGuestErrors] = useState<{ fullName?: string; phone?: string; detail?: string }>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);

  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const sliderRef = useRef<ScrollView | null>(null);
  const categoryListRef = useRef<ScrollView | null>(null);
  const productListRef = useRef<FlatList<Product> | null>(null);
  const productListOffset = useRef(0);
  const onEndReachedCalledDuringMomentum = useRef(true);
  const requestedPagesRef = useRef<Set<number>>(new Set());

  const { width } = Dimensions.get("window");
  const slideWidth = width - 32;

  const handleApiError = useCallback(
    async (error: unknown, title: string) => {
      const normalized = normalizeApiError(error);

      if (normalized.status === 401) {
        Alert.alert("Oturum", "Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
        await logout();
        navigation.navigate(ROUTES.LOGIN);
        return;
      }

      if (normalized.status === 400) {
        Alert.alert(title, "İstek doğrulanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.");
        return;
      }

      if (normalized.status === 0) {
        Alert.alert(title, "İnternet bağlantınızı kontrol edip tekrar deneyin.");
        return;
      }

      Alert.alert(title, normalized.message || "İşlem sırasında bir hata oluştu.");
    },
    [logout, navigation]
  );

  const fetchPage = useCallback(
    async (nextPage: number) => {
      return getProducts({
        page: nextPage,
        limit,
      });
    },
    [limit]
  );

  const loadFirstPage = useCallback(async () => {
    try {
      setError(null);
      const response = await fetchPage(1);
      const firstItems = response.items;
      setItems(firstItems.length ? firstItems : fallbackProducts);
      setPage(1);
      setTotalPages(response.pagination?.totalPages ?? null);
      requestedPagesRef.current = new Set([1]);
      if (response.pagination) {
        const reachedTotal = firstItems.length >= response.pagination.total;
        setHasMore(!reachedTotal && firstItems.length >= limit);
      } else {
        setHasMore(firstItems.length >= limit);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ürünler alınamadı.";
      setError(message);
      setItems(fallbackProducts);
      setPage(1);
      setTotalPages(1);
      setHasMore(false);
      requestedPagesRef.current = new Set([1]);
    }
  }, [fetchPage, limit]);

  useEffect(() => {
    (async () => {
      setProductsLoading(true);
      try {
        await loadFirstPage();
      } catch (error) {
        console.error("[Home] first page load failed", error);
      } finally {
        setProductsLoading(false);
      }
    })();
  }, [loadFirstPage]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    setShowAuthGate(!user);
  }, [authChecked, user]);

  const handleAuthGateLogin = useCallback(async () => {
    setShowAuthGate(false);
    await logout();
    navigation.navigate(ROUTES.LOGIN);
  }, [logout, navigation]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || productsLoading || isFetchingNextPage) return;
    setIsRefreshing(true);
    try {
      await loadFirstPage();
    } catch (error) {
      console.error("[Home] refresh failed", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, productsLoading, isFetchingNextPage, loadFirstPage]);

  const fetchNextPage = useCallback(async () => {
    console.log("[Products] fetchNextPage before", { page, isFetchingNextPage, hasMore });
    if (isFetchingNextPage || productsLoading || isRefreshing || !hasMore) return;
    if (totalPages !== null && page >= totalPages) {
      setHasMore(false);
      return;
    }

    const nextPage = page + 1;
    if (requestedPagesRef.current.has(nextPage)) return;
    requestedPagesRef.current.add(nextPage);
    setIsFetchingNextPage(true);

    try {
      const response = await fetchPage(nextPage);
      const nextItems = response.items;
      const mergedCount = items.length + nextItems.length;

      setItems((prev) => [...prev, ...nextItems]);
      setPage(nextPage);
      setError(null);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        const reachedByTotal = mergedCount >= response.pagination.total;
        const reachedByPage = nextPage >= response.pagination.totalPages;
        const reachedByShortPage = nextItems.length < limit;
        setHasMore(!(reachedByTotal || reachedByPage || reachedByShortPage));
      } else {
        setHasMore(nextItems.length >= limit);
      }
    } catch (e) {
      requestedPagesRef.current.delete(nextPage);
      const message = e instanceof Error ? e.message : "Daha fazla ürün alınamadı.";
      setError(message);
    } finally {
      setIsFetchingNextPage(false);
      console.log("[Products] fetchNextPage after", { page: nextPage, isFetchingNextPage: false, hasMore });
    }
  }, [
    isFetchingNextPage,
    productsLoading,
    isRefreshing,
    hasMore,
    totalPages,
    page,
    fetchPage,
    items.length,
    limit,
  ]);

  const handleEndReached = useCallback(() => {
    console.log("[Products] onEndReached", { page, isFetchingNextPage, hasMore });
    if (onEndReachedCalledDuringMomentum.current) return;
    onEndReachedCalledDuringMomentum.current = true;
    fetchNextPage();
  }, [fetchNextPage, hasMore, isFetchingNextPage, page]);

  const loadAddresses = useCallback(async () => {
    if (!token) {
      setAddresses([]);
      setSelectedAddressId("");
      return;
    }
    setAddressesLoading(true);
    try {
      const data = await getAddresses(token);
      const safeData = Array.isArray(data) ? data : [];
      setAddresses(safeData);
      const defaultAddress = safeData.find((address) => address.isDefault) ?? safeData[0];
      setSelectedAddressId(defaultAddress?.id ?? "");
    } catch (error) {
      await handleApiError(error, "Adresler");
      console.error("[Home] load addresses failed", error);
    } finally {
      setAddressesLoading(false);
    }
  }, [handleApiError, token]);

  useEffect(() => {
    if (token && activeScreen === "address") loadAddresses();
  }, [activeScreen, loadAddresses, token]);

  useEffect(() => {
    if (isGuest) {
      setAddresses([]);
      setSelectedAddressId("");
    }
  }, [isGuest]);

  // Categories
  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        const data = await getCategories();
        const active = (data || []).filter((c) => c.isActive);
        setCategories(ensureCampaignCategory(active.length ? active : fallbackCategories));
      } catch {
        setCategories(ensureCampaignCategory(fallbackCategories));
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId && categories.length) setSelectedCategoryId(CAMPAIGN_CATEGORY_ID);
  }, [categories, selectedCategoryId]);

  // Slider auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDealIndex((prev) => {
        const next = (prev + 1) % dailyDeals.length;
        sliderRef.current?.scrollTo({ x: next * slideWidth, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [slideWidth]);

  // Filtreleme
  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(selectedCategoryId)),
    [categories, selectedCategoryId]
  );

  const campaignProducts = useMemo(
    () => products.filter((product) => product.isCampaign && product.inStock && product.stock > 0),
    [products]
  );

  const selectedCategoryProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    if (selectedCategoryId === CAMPAIGN_CATEGORY_ID) return campaignProducts;

    return products.filter((product) => {
      const productCategoryIds = [...(product.category || []), ...(product.categoryIds || [])].map(String);
      return productCategoryIds.includes(String(selectedCategoryId));
    });
  }, [products, selectedCategoryId, campaignProducts]);

  const isCategoryScreen = activeScreen === "category";

  // ✅ Arama yoksa: mevcut ekran mantığı (home tüm ürünler / kategoriye göre filtre)
  // ✅ Arama varsa: TÜM ürünlerde arama
  const displayProductsBase = isCategoryScreen ? selectedCategoryProducts : products;

  const displayProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayProductsBase;

    const categoryNameById = new Map<string, string>();
    categories.forEach((c) => categoryNameById.set(String(c.id), (c.name || "").toLowerCase()));

    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();

      const rawCats = [...(p.category || []), ...(p.categoryIds || [])].map(String);
      const catNames = rawCats
        .map((x) => categoryNameById.get(x) || x.toLowerCase())
        .join(" ");

      return name.includes(q) || brand.includes(q) || desc.includes(q) || catNames.includes(q);
    });
  }, [searchQuery, displayProductsBase, products, categories]);

  const pageTitle = isCategoryScreen ? (selectedCategory?.name || "Ürünler") : "Kampanyalı Fırsatlar";

  // Swipe (arama varken swipe input'a dokunmayı çalmasın)
  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderEnd: (_, gestureState) => {
          const { dx } = gestureState;
          if (Math.abs(dx) > 50) {
            const currentIndex = categories.findIndex((c) => String(c.id) === String(selectedCategoryId));
            if (currentIndex < 0) return;

            if (dx > 0 && currentIndex > 0) {
              const prevCat = categories[currentIndex - 1];
              setSelectedCategoryId(String(prevCat.id));
              setSearchQuery("");
              if (!isCategoryScreen) setActiveScreen("category");
              categoryListRef.current?.scrollTo({ x: (currentIndex - 1) * 100, animated: true });
            } else if (dx < 0 && currentIndex < categories.length - 1) {
              const nextCat = categories[currentIndex + 1];
              setSelectedCategoryId(String(nextCat.id));
              setSearchQuery("");
              if (!isCategoryScreen) setActiveScreen("category");
              categoryListRef.current?.scrollTo({ x: (currentIndex + 1) * 100, animated: true });
            }
          }
        },
      }),
    [categories, selectedCategoryId, isCategoryScreen]
  );

  useEffect(() => {
    if (activeScreen === "home" || activeScreen === "category") {
      requestAnimationFrame(() => {
        productListRef.current?.scrollToOffset({ offset: productListOffset.current, animated: false });
      });
    }
  }, [activeScreen]);

  // Sepet
  const cartDetails = useMemo(
    () =>
      cart
        .map((item) => {
          const p = products.find((x) => x.id === item.productId);
          return p
            ? { product: p, quantity: item.quantity, unitPrice: item.unitPrice, title: item.title }
            : null;
        })
        .filter(Boolean) as CartLineItem[],
    [cart, products]
  );

  const cartTotal = useMemo(
    () => cartDetails.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartDetails]
  );

  const isOutOfStock = useCallback((product: Product) => !product.inStock || product.stock === 0, []);

  const handleIncrease = useCallback(
    async (productId: string) => {
      console.log("[CART][ADD] start", { hasToken: !!token });
      if (cartLoading) {
        console.log("[CART][ADD] return", { reason: "done" });
        return;
      }

      setCartLoading(true);
      try {
        const product = products.find((item) => item.id === productId);
        if (!product) {
          Alert.alert("Ürün", "Ürün bilgisi alınamadı.");
          console.log("[CART][ADD] return", { reason: "done" });
          return;
        }

        if (isOutOfStock(product)) {
          Alert.alert("Bu ürün stokta bulunmuyor");
          console.log("[CART][ADD] return", { reason: "done" });
          return;
        }

        // Login yokken sadece local state + AsyncStorage kullanılır (protected endpoint çağrısı yok).
        if (!token) {
          increase({
            productId: product.id,
            title: product.name,
            unitPrice: getEffectivePrice(product),
          });
          console.log("[CART][ADD] return", { reason: "no_token" });
          return;
        }

        increase({
          productId: product.id,
          title: product.name,
          unitPrice: getEffectivePrice(product),
        });
        console.log("[CART][ADD] return", { reason: "done" });
      } catch (error) {
        console.error("[CART][ADD] error", error);
        Alert.alert("Hata", "Sepete eklenemedi.");
      } finally {
        setCartLoading(false);
        console.log("[CART][ADD] finally");
      }
    },
    [increase, cartLoading, isOutOfStock, products, token]
  );

  // Ürün Tıklama
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setPreviousScreen(activeScreen);
    setActiveScreen("productDetail");
  };

  const handleCloseDetail = () => {
    setActiveScreen(previousScreen);
    setSelectedProduct(null);
  };

  // Floating Cart
  const pan = useRef(new Animated.ValueXY({ x: 16, y: Dimensions.get("window").height - 120 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const handleFavoriteToggle = useCallback(async (product: Product) => {
    const result = await toggleFavorite(product, () => setShowAuthGate(true));
    if (result.error) {
      Alert.alert("Favoriler", result.error);
    }
  }, [toggleFavorite]);

  const renderProductCard = (urun: Product) => {
    const qty = getQuantity(urun.id);
    const outOfStock = isOutOfStock(urun);
    const isFav = isFavorite(urun.id);
    const imageUrl = urun.imagePath ? buildImageUrl(urun.imagePath) : urun.image ?? "";
    const activePrice = getEffectivePrice(urun);
    const isOnSale = activePrice < Number(urun.price);

    return (
      <TouchableOpacity
        style={[styles.productCard, outOfStock && styles.productCardDisabled]}
        onPress={() => handleProductPress(urun)}
        activeOpacity={0.9}
      >
        <View style={styles.productImageContainer}>
          <TouchableOpacity
            onPress={() => handleFavoriteToggle(urun)}
            style={styles.favoriteButton}
            hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={20}
              color={isFav ? THEME.danger : THEME.textGray}
            />
          </TouchableOpacity>
          <Image source={imageUrl ? { uri: imageUrl } : placeholderImage} style={styles.productImage} />
        </View>

        <View style={styles.productInfoContainer}>
          <Text style={styles.productName} numberOfLines={2}>
            {urun.name}
          </Text>

          {urun.brand ? <Text style={styles.productBrand}>{urun.brand}</Text> : null}

          {urun.description && urun.description.trim().length > 0 ? (
            <Text style={styles.productDescriptionPreview} numberOfLines={1} ellipsizeMode="tail">
              {urun.description}
            </Text>
          ) : null}

          {outOfStock ? <Text style={styles.outOfStockBadge}>TÜKENDİ</Text> : null}

          <View style={styles.productBottomRow}>
            <View style={styles.productPriceGroup}>
              <Text style={styles.productPrice}>{formatPrice(activePrice)}</Text>
              {isOnSale ? <Text style={styles.productOriginalPrice}>{formatPrice(urun.price)}</Text> : null}
            </View>

            {qty === 0 ? (
              <TouchableOpacity
                style={[styles.addButton, outOfStock && styles.addButtonDisabled]}
                onPress={() => handleIncrease(urun.id)}
                disabled={outOfStock}
              >
                <Text style={[styles.addButtonText, outOfStock && styles.addButtonTextDisabled]}>
                  {outOfStock ? "YOK" : "EKLE"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => decrease(urun.id)} style={styles.counterBtn}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{qty}</Text>
                <TouchableOpacity onPress={() => handleIncrease(urun.id)} style={styles.counterBtn}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Navigasyonlar
  const handleCheckout = () => {
    if (!cartDetails.length) return Alert.alert("Sepet Boş");
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    setActiveScreen("address");
  };

  const handleSaveAddress = async (data: any) => {
    if (!token) return;
    setAddressSubmitLoading(true);
    try {
      const created = await createAddress(token, { ...data, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id || created._id || "");
      await loadAddresses();
      Alert.alert("Başarılı", "Adres kaydedildi.");
      setActiveScreen("address");
    } catch (error) {
      await handleApiError(error, "Adres");
      console.error("[Home] create address failed", error);
    } finally {
      setAddressSubmitLoading(false);
    }
  };

  const handleSaveCard = (data: any) => {
    const id = Date.now().toString();
    setPaymentMethods([...paymentMethods, { id, label: data.holder, description: `**** ${data.number.slice(-4)}` }]);
    setSelectedPaymentId(id);
    setActiveScreen("payment");
  };

  const handleDeleteAddress = (id: string) => {
    if (!token) return;
    Alert.alert("Adres Sil", "Adresi silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddress(token, id);
            setAddresses((prev) => prev.filter((address) => address.id !== id));
          } catch (error) {
            await handleApiError(error, "Adres");
          }
        },
      },
    ]);
  };

  const handleSetDefaultAddress = async (address: Address) => {
    if (!token) return;
    try {
      const currentDefault = addresses.find((item) => item.isDefault);

      if (currentDefault && currentDefault.id !== address.id) {
        await updateAddress(token, currentDefault.id, {
          title: currentDefault.title,
          detail: currentDefault.detail,
          note: currentDefault.note,
          isDefault: false,
        });
      }

      const updated = await updateAddress(token, address.id, {
        title: address.title,
        detail: address.detail,
        note: address.note,
        isDefault: true,
      });

      setAddresses((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? updated
            : { ...item, isDefault: item.id === currentDefault?.id ? false : item.isDefault }
        )
      );
      setSelectedAddressId(updated.id);
    } catch (error) {
      await handleApiError(error, "Adres");
    }
  };

  const handleSubmitOrder = async () => {
    if (!cartDetails.length) return Alert.alert("Sepet Boş");
    if (isSubmittingOrder) return;

    if (!isGuest && !token) {
      Alert.alert("Oturum", "Devam etmek için tekrar giriş yapın.");
      navigation.navigate(ROUTES.LOGIN);
      return;
    }

    if (!isGuest && !selectedAddressId) {
      Alert.alert("Adres Gerekli", "Lütfen teslimat adresi seçin.");
      return;
    }

    const selectedAddress = isGuest ? ({ id: "guest", ...guestAddress } as any) : addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress) {
      Alert.alert("Adres Gerekli", "Lütfen teslimat adresi seçin.");
      return;
    }

    if (isGuest) {
      const nextErrors: { fullName?: string; phone?: string; detail?: string } = {};
      if (!guestInfo.fullName.trim()) nextErrors.fullName = "Ad Soyad zorunludur.";
      if (!guestInfo.phone.trim()) nextErrors.phone = "Telefon zorunludur.";
      if (!guestAddress.detail.trim()) nextErrors.detail = "Adres detayı zorunludur.";
      setGuestErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }

    const selectedPayment = paymentMethods.find((p) => p.id === selectedPaymentId);
    if (!selectedPayment) {
      Alert.alert("Ödeme", "Lütfen ödeme yöntemi seçin.");
      return;
    }

    const payload = isGuest
      ? buildGuestOrderPayload(cartDetails, selectedAddress, selectedPayment, guestInfo)
      : buildAuthOrderPayload(cartDetails, selectedAddress, selectedPayment);

    try {
      setIsSubmittingOrder(true);
      const response = isGuest ? await submitGuestOrder(payload as GuestOrderPayload) : await submitOrder(payload as AuthOrderPayload, token);
      setOrderId(response?.id ?? Math.floor(100000 + Math.random() * 900000).toString());
      clearCart();
      setActiveScreen("success");
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 429) {
        Alert.alert("Sipariş", "Çok sık deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.");
      } else if (normalized.status === 409) {
        Alert.alert("Stok", normalized.message || "Bazı ürünlerde stok yetersiz.");
      } else {
        await handleApiError(error, "Sipariş");
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleAccountPress = () => {
    if (!token) {
      setShowAuthGate(true);
      return;
    }

    navigation.navigate(ROUTES.ACCOUNT);
  };

  // --- MAIN HOME UI ---
  const showTopSlider = !isCategoryScreen && searchQuery.trim().length === 0;

  const listFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={THEME.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  const listHeader = useMemo(
    () => (
      <>
        {showTopSlider && (
          <View style={styles.sliderSection}>
            <HomeSlider
              dailyDeals={dailyDeals}
              sliderRef={sliderRef}
              slideWidth={slideWidth}
              activeDealIndex={activeDealIndex}
              setActiveDealIndex={setActiveDealIndex}
            />
            <BrandScroller markalar={markalar} />
          </View>
        )}

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>{pageTitle}</Text>
          {productsLoading ? <ActivityIndicator size="small" color={THEME.primary} /> : null}
          {error ? <Text style={styles.noProductText}>{error}</Text> : null}
        </View>
      </>
    ),
    [showTopSlider, slideWidth, activeDealIndex, pageTitle, productsLoading, error]
  );

  if (!authChecked) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  // --- RENDER ROUTES ---
  if (activeScreen === "productDetail" && selectedProduct) {
    const currentQty = getQuantity(selectedProduct.id);
    return (
      <ProductDetailScreen
        product={selectedProduct}
        quantity={currentQty}
        isFavorite={isFavorite(selectedProduct.id)}
        onToggleFavorite={() => handleFavoriteToggle(selectedProduct)}
        onBack={handleCloseDetail}
        onIncrease={handleIncrease}
        onDecrease={decrease}
        onGoToCart={() => setShowCartSheet(true)}
      />
    );
  }

  if (activeScreen === "address") {
    if (isGuest) {
      return (
        <GuestAddressScreen
          address={guestAddress}
          guestInfo={guestInfo}
          errors={guestErrors}
          onChange={setGuestAddress}
          onGuestChange={setGuestInfo}
          onBack={() => {
            setActiveScreen("home");
            setShowCartSheet(true);
          }}
          onContinue={() => setActiveScreen("payment")}
        />
      );
    }
    return (
      <AddressScreen
        addresses={addresses}
        selectedId={selectedAddressId}
        onSelect={setSelectedAddressId}
        onBack={() => {
          setActiveScreen("home");
          setShowCartSheet(true);
        }}
        onContinue={() => setActiveScreen("payment")}
        onAddAddress={() => setActiveScreen("addAddress")}
        onDelete={handleDeleteAddress}
        onSetDefault={handleSetDefaultAddress}
        onManageAddresses={() => navigation.navigate(ROUTES.ADDRESS_LIST)}
        showManageButton
        loading={addressesLoading}
      />
    );
  }

  if (activeScreen === "addAddress") return <AddAddressScreen loading={addressSubmitLoading} onSave={handleSaveAddress} onCancel={() => setActiveScreen("address")} />;
  if (activeScreen === "payment")
    return (
      <PaymentScreen
        methods={paymentMethods}
        selectedId={selectedPaymentId}
        onSelect={setSelectedPaymentId}
        onBack={() => setActiveScreen("address")}
        onContinue={() => setActiveScreen("summary")}
        onAddCard={() => setActiveScreen("addCard")}
        onDelete={(id: string) => setPaymentMethods(paymentMethods.filter((p) => p.id !== id))}
      />
    );

  if (activeScreen === "addCard") return <AddCardScreen onSave={handleSaveCard} onCancel={() => setActiveScreen("payment")} />;

  if (activeScreen === "summary") {
    const summaryAddress = isGuest ? ({ id: "guest", ...guestAddress } as any) : addresses.find((a) => a.id === selectedAddressId);
    return (
      <SummaryScreen
        cartDetails={cartDetails}
        total={cartTotal}
        address={summaryAddress}
        payment={paymentMethods.find((p) => p.id === selectedPaymentId)}
        onBack={() => setActiveScreen("payment")}
        onSubmit={handleSubmitOrder}
        isSubmitting={isSubmittingOrder}
        onPressLegal={(key: LegalUrlKey) => Linking.openURL(LEGAL_URLS[key])}
      />
    );
  }

  if (activeScreen === "success") return <SuccessScreen orderId={orderId} onReturnHome={() => setActiveScreen("home")} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />

      <HomeHeader
        isCategoryScreen={isCategoryScreen}
        setActiveScreen={setActiveScreen}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={(id) => {
          setSelectedCategoryId(id);
          setSearchQuery("");
        }}
        handleAccountPress={handleAccountPress}
        categoryListRef={categoryListRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <View
        style={styles.contentArea}
        {...(searchQuery.trim().length > 0 ? {} : swipeResponder.panHandlers)}
      >
        <FlatList
          ref={productListRef}
          data={displayProducts}
          numColumns={2}
          columnWrapperStyle={displayProducts.length > 1 ? styles.gridContainer : undefined}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => renderProductCard(item)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={!productsLoading ? <Text style={styles.noProductText}>Bu kategoride henüz ürün bulunmuyor.</Text> : null}
          onScroll={(event) => {
            productListOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        />
      </View>

      {cart.length > 0 && (
        <Animated.View
          style={[styles.floatingCart, { transform: pan.getTranslateTransform() }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity onPress={() => setShowCartSheet(true)} style={styles.floatingBtnInner}>
            <View style={styles.cartIconWrapper}>
              <Text style={{ fontSize: 24 }}>🛒</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.reduce((a, b) => a + b.quantity, 0)}</Text>
              </View>
            </View>
            <View style={styles.floatingTotal}>
              <Text style={styles.floatingTotalText}>{formatPrice(cartTotal)}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <AuthGateSheet visible={showAuthGate} onDismiss={() => setShowAuthGate(false)} onLogin={handleAuthGateLogin} />
      <BottomSheetModal visible={showCartSheet} onDismiss={() => setShowCartSheet(false)}>
        <CartSheetContent
          cartDetails={cartDetails}
          total={cartTotal}
          onDismiss={() => setShowCartSheet(false)}
          onCheckout={() => {
            setShowCartSheet(false);
            handleCheckout();
          }}
          onIncrease={handleIncrease}
          onDecrease={decrease}
          isOutOfStock={isOutOfStock}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}
