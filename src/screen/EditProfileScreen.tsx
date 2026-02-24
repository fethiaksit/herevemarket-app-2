import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { useAuth } from "../context/AuthContext";
import { styles as sharedStyles } from "../screens/styles";
import { THEME } from "../constants/theme";
import { User } from "../types";

type ProfileUser = User & { firstName?: string; lastName?: string; phone?: string };

function getFullName(user: ProfileUser | null) {
  if (!user) return "-";
  const combined = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return combined || user.name || "-";
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: THEME.borderColor }}>
      <Text style={{ fontSize: 13, color: THEME.textGray, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 15, color: THEME.textDark, fontWeight: "600" }}>{value || "-"}</Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const profile = user as ProfileUser | null;
  const fullName = useMemo(() => getFullName(profile), [profile]);

  return (
    <SafeAreaView style={sharedStyles.container} edges={["bottom"]}>
      <AppHeader title="Hesap Bilgilerini Düzenle" showBack />
      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.summaryCard}>
          <Text style={sharedStyles.summarySectionTitle}>Hesap Bilgileri</Text>
          <ReadOnlyRow label="Ad Soyad" value={fullName} />
          <ReadOnlyRow label="E-posta" value={profile?.email || "-"} />
          <ReadOnlyRow label="Telefon" value={profile?.phone || "-"} />
          <Text style={[sharedStyles.emptyText, { marginTop: 12, marginBottom: 0 }]}>Düzenleme özelliği yakında eklenecek.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
