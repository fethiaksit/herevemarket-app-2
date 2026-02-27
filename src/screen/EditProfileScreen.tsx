import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { useAuth } from "../context/AuthContext";
import { styles as sharedStyles } from "../screens/styles";
import { THEME } from "../constants/theme";
import { updateCurrentUserProfile } from "../services/api/auth";
import { normalizeApiError } from "../services/api/client";
import { useNavigation } from "@react-navigation/native";

type FormErrors = {
  name?: string;
  phone?: string;
};

const EMAIL_EDITABLE = false;

function normalizePhone(input: string) {
  return input.replace(/\D+/g, "");
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, token, isGuest, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const shouldBlock = useMemo(() => !token || isGuest, [token, isGuest]);

  const validate = useCallback(() => {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);

    if (!trimmedName) {
      nextErrors.name = "Ad Soyad boş olamaz.";
    }

    if (normalizedPhone.length < 10) {
      nextErrors.phone = "Telefon en az 10 haneli olmalıdır.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [name, phone]);

  const handleSave = useCallback(async () => {
    if (shouldBlock) {
      Alert.alert("Giriş Gerekli", "Profil düzenlemek için giriş yapmalısınız.");
      navigation.goBack();
      return;
    }

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const payload: { name: string; phone: string; email?: string } = {
        name: name.trim(),
        phone: normalizePhone(phone),
      };

      if (EMAIL_EDITABLE) {
        payload.email = email.trim();
      }

      await updateCurrentUserProfile(payload, token);
      await refreshUser();
      Alert.alert("Başarılı", "Profil güncellendi");
      navigation.goBack();
    } catch (error) {
      if (__DEV__) {
        const normalized = normalizeApiError(error);
        console.log("[EditProfile] update failed", normalized.status, normalized.message);
      }
      Alert.alert("Hata", "Güncelleme başarısız. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }, [shouldBlock, validate, name, phone, email, token, refreshUser, navigation]);

  React.useEffect(() => {
    if (shouldBlock) {
      Alert.alert("Giriş Gerekli", "Profil düzenlemek için giriş yapmalısınız.", [{ text: "Tamam", onPress: () => navigation.goBack() }]);
    }
  }, [shouldBlock, navigation]);

  return (
    <SafeAreaView style={sharedStyles.container} edges={["bottom"]}>
      <AppHeader title="Profil Düzenle" showBack />
      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.summaryCard}>
          <Text style={sharedStyles.summarySectionTitle}>Hesap Bilgileri</Text>

          <Text style={sharedStyles.inputLabel}>Ad Soyad</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={sharedStyles.input}
            placeholder="Ad Soyad"
            editable={!saving}
          />
          {errors.name ? <Text style={sharedStyles.errorText}>{errors.name}</Text> : null}

          <Text style={sharedStyles.inputLabel}>Telefon</Text>
          <TextInput
            value={phone}
            onChangeText={(text) => setPhone(normalizePhone(text))}
            style={sharedStyles.input}
            placeholder="Telefon"
            keyboardType="phone-pad"
            maxLength={11}
            editable={!saving}
          />
          {errors.phone ? <Text style={sharedStyles.errorText}>{errors.phone}</Text> : null}

          <Text style={sharedStyles.inputLabel}>E-posta</Text>
          <TextInput
            value={email}
            style={[sharedStyles.input, !EMAIL_EDITABLE ? { backgroundColor: THEME.background } : null]}
            placeholder="E-posta"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={EMAIL_EDITABLE && !saving}
          />
        </View>

        <TouchableOpacity
          style={[sharedStyles.primaryButton, saving ? sharedStyles.disabledButton : null]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={sharedStyles.primaryButtonText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
