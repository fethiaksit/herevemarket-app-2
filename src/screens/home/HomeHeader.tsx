import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { THEME } from "../../constants/theme";
import { styles } from "../styles";
import { CategoryDto } from "../../services/api/categories";
import { Screen } from "../../types/home";
import { ROUTES } from "../../navigation/routes";

export default function HomeHeader({
  isCategoryScreen,
  setActiveScreen,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  navigation,
  isGuest,
  token,
  handleAccountPress,
  categoryListRef,

  // ✅ Arama prop'ları
  searchQuery,
  setSearchQuery,
}: {
  isCategoryScreen: boolean;
  setActiveScreen: React.Dispatch<React.SetStateAction<Screen>>;
  categories: CategoryDto[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<string | null>>;
  navigation: any;
  isGuest: boolean;
  token: string | null;
  handleAccountPress: () => void;
  categoryListRef: React.RefObject<ScrollView>;

  // ✅ Arama prop'ları
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}) {
  // ✅ Hook component içinde olmalı
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.mainHeader}>
      <View style={styles.logoRow}>
        {isCategoryScreen && (
          <TouchableOpacity
            onPress={() => setActiveScreen("home")}
            style={{
              marginRight: 10,
              position: "absolute",
              left: 16,
              zIndex: 10,
            }}
          >
            <Text style={{ color: THEME.white, fontSize: 24 }}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerLogoContainer}>
  <Image
    source={require("../../../assets/newlogo1.png")}
    style={styles.headerLogo}
    resizeMode="contain"
  />
</View>
      </View>

      <View style={styles.accountRow}>
        {!isGuest && token ? (
          <>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={() => navigation.navigate(ROUTES.ADDRESS_LIST)}
            >
              <Text style={styles.accountButtonText}>Adreslerim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountButton}
              onPress={handleAccountPress}
            >
              <Text style={styles.accountButtonText}>Hesabım</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.accountButton} onPress={handleAccountPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.accountButtonText}>Hesabım</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView
          ref={categoryListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategoryId === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => {
                setSelectedCategoryId(cat.id);

                // Kategori seçilince aramayı temizlemek istersen:
                // setSearchQuery("");

                if (!isCategoryScreen) setActiveScreen("category");
              }}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategoryId === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ✅ ARAMA BAR (basınca klavye kesin açılsın) */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={{
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: THEME.white, fontSize: 16, marginRight: 8 }}>
              🔎
            </Text>

            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ürün ara..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={{
                flex: 1,
                color: THEME.white,
                fontSize: 15,
                paddingVertical: 0,
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
              // Android için daha iyi focus davranışı
              underlineColorAndroid="transparent"
            />

            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  // temizleyince tekrar focus kalsın
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                style={{ paddingLeft: 10, paddingVertical: 6 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ color: THEME.white, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
