import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";
import { MainStackParamList } from "../navigation/types";
import { styles as sharedStyles } from "../screens/styles";
import { THEME } from "../constants/theme";
import { User } from "../types";

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

  const loadProfile = useCallback(async () => {
    if (!token) {
      setError("Hesap bilgileri için giriş yapman gerekiyor.");
      setLoading(false);
      return;
    }

    const hasProfile = Boolean(profile);
    setError(null);
    hasProfile ? setRefreshing(true) : setLoading(true);

    try {
      const me = await refreshUser();
      setProfile((me as ProfileUser | null) ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Hesap bilgileri şu anda alınamadı.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, profile, refreshUser]);

  useEffect(() => {
    setProfile((user as ProfileUser | null) ?? null);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fullName = useMemo(() => (profile ? getFullName(profile) : "-"), [profile]);

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

        <TouchableOpacity style={[sharedStyles.secondaryButton, { marginTop: 8, alignItems: "center" }]} onPress={handleLogout}>
          <Text style={sharedStyles.secondaryButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
