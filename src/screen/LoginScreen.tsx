import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";
import { ROUTES } from "../navigation/routes";
import AppHeader from "../components/AppHeader";

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login, loading, token, authChecked } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handledInitialAuthRedirect = useRef(false);

  const isSubmitDisabled = useMemo(() => loading, [loading]);

  const handleBackHome = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    (navigation as any).navigate(ROUTES.HOME);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen e-posta ve şifre alanlarını doldurun.");
      return;
    }

    const result = await login(email.trim(), password);

    if (result.ok) {
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.HOME }],
      });
      return;
    }

    const normalized = result.message.toLowerCase();
    const isInvalidCredentials =
      result.status === 401 ||
      result.status === 403 ||
      normalized.includes("invalid credentials") ||
      normalized.includes("wrong password");

    if (isInvalidCredentials) {
      Alert.alert("Giriş başarısız", "E-posta veya şifre hatalı.");
      return;
    }

    Alert.alert("Giriş başarısız", result.message || "Giriş sırasında bir hata oluştu.");
  };

  useEffect(() => {
    if (!authChecked || handledInitialAuthRedirect.current) {
      return;
    }

    handledInitialAuthRedirect.current = true;
    if (token) {
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.HOME }],
      });
    }
  }, [authChecked, navigation, token]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppHeader title="Giriş Yap" />
      <View style={styles.content}>
        <View style={styles.card}>
        <Text style={styles.title}>Giriş Yap</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
        <TouchableOpacity style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={isSubmitDisabled}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Giriş Yap</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleBackHome}>
          <Text style={styles.backButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.footerText}>Hesabın yok mu? Üye ol</Text>
        </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1F2937",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#004AAD",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#004AAD",
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 16,
  },
});
