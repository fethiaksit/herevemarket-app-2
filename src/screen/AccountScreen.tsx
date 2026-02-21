import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";
import { MainStackParamList } from "../navigation/types";
import { styles as sharedStyles } from "../screens/styles";
import { THEME } from "../constants/theme";
import AuthGateSheet from "../components/AuthGateSheet";
import { User } from "../types";
import { normalizeApiError } from "../services/api/client";

type Navigation = NativeStackNavigationProp<MainStackParamList>;
type ProfileUser = User & { firstName?: string; lastName?: string; phone?: string };

function getFullName(user: ProfileUser) {
  const combined = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return combined || user.name || "-";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: THEME.borderColor }}>
      <Text style={{ fontSize: 13, color: THEME.textGray, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 15, color: THEME.textDark, fontWeight: "600" }}>{value || "-"}</Text>
    </View>
  );
}

export default function AccountScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, token, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>((user as ProfileUser | null) ?? null);
  const [loading, setLoading] = useState(!user);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const profileRef = useRef<ProfileUser | null>((user as ProfileUser | null) ?? null);
  const unauthorizedHandledRef = useRef(false);

  const handleUnauthorized = useCallback(async () => {
    if (unauthorizedHandledRef.current) {
      return;
    }

    unauthorizedHandledRef.current = true;
    await logout();
    profileRef.current = null;
    setProfile(null);
    setError("Oturumun sona erdi. Lütfen tekrar giriş yap.");
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.HOME }],
    });
  }, [logout, navigation]);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setError("Hesap bilgileri için giriş yapman gerekiyor.");
      setLoading(false);
      return;
    }

    const hasProfile = Boolean(profileRef.current);
    setError(null);
    hasProfile ? setRefreshing(true) : setLoading(true);

    try {
      const me = await refreshUser();
      const nextProfile = (me as ProfileUser | null) ?? null;
      profileRef.current = nextProfile;
      setProfile(nextProfile);
    } catch (e) {
      const normalizedError = normalizeApiError(e);
      if (normalizedError.status === 401) {
        await handleUnauthorized();
        return;
      }
      const message = e instanceof Error ? e.message : "Hesap bilgileri şu anda alınamadı.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshUser, handleUnauthorized]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  useEffect(() => {
    const nextProfile = (user as ProfileUser | null) ?? null;
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, [user]);

  const fullName = useMemo(() => (profile ? getFullName(profile) : "-"), [profile]);


  const handleAuthGateLogin = useCallback(async () => {
    setShowAuthGate(false);
    await logout();
    navigation.navigate(ROUTES.LOGIN);
  }, [logout, navigation]);

  const handleAddressesPress = useCallback(() => {
    if (!token) {
      setShowAuthGate(true);
      return;
    }

    navigation.navigate(ROUTES.ADDRESS_LIST);
  }, [navigation, token]);

  const handleFavoritesPress = useCallback(() => {
    if (!token) {
      setShowAuthGate(true);
      return;
    }

    navigation.navigate(ROUTES.FAVORITES);
  }, [navigation, token]);

  const handleLogout = useCallback(() => {
    Alert.alert("Çıkış Yap", "Hesabından çıkış yapmak istediğine emin misin?", [
      { text: "Hayır", style: "cancel" },
      {
        text: "Evet",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Çıkış Yapıldı", "Ana sayfaya yönlendiriliyorsun.");
          navigation.navigate(ROUTES.HOME);
        },
      },
    ]);
  }, [logout, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="small" color={THEME.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.container}>
      <View style={sharedStyles.headerBar}>
        <TouchableOpacity style={sharedStyles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={sharedStyles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={sharedStyles.headerCenterAbsolute}>
          <Text style={sharedStyles.headerTitle}>Hesabım</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        {refreshing ? <ActivityIndicator size="small" color={THEME.primary} style={{ marginBottom: 12 }} /> : null}

        <View style={sharedStyles.summaryCard}>
          <Text style={sharedStyles.summarySectionTitle}>Hesap Bilgileri</Text>
          {profile ? (
            <>
              <InfoRow label="Ad Soyad" value={fullName} />
              <InfoRow label="E-posta" value={profile.email || "-"} />
              <InfoRow label="Telefon" value={profile.phone || "-"} />
            </>
          ) : (
            <Text style={sharedStyles.emptyText}>Hesap bilgisi bulunamadı.</Text>
          )}
        </View>

        {error ? (
          <View style={sharedStyles.selectionCard}>
            <Text style={sharedStyles.noProductText}>{error}</Text>
            <TouchableOpacity style={[sharedStyles.primaryButton, { marginTop: 12 }]} onPress={loadProfile}>
              <Text style={sharedStyles.primaryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={sharedStyles.summaryCard}>
          <Text style={sharedStyles.summarySectionTitle}>Hesap İşlemleri</Text>
          <TouchableOpacity style={{ paddingVertical: 10 }} onPress={handleAddressesPress}>
            <Text style={{ fontSize: 15, color: THEME.textDark, fontWeight: "600" }}>Adresler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 10 }} onPress={handleFavoritesPress}>
            <Text style={{ fontSize: 15, color: THEME.textDark, fontWeight: "600" }}>Favoriler</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[sharedStyles.secondaryButton, { marginTop: 8, alignItems: "center" }]} onPress={handleLogout}>
          <Text style={sharedStyles.secondaryButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      <AuthGateSheet visible={showAuthGate} onDismiss={() => setShowAuthGate(false)} onLogin={handleAuthGateLogin} />
    </SafeAreaView>
  );
}
