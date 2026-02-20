import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";
import { normalizeApiError } from "../services/api/client";
import { ROUTES } from "../navigation/routes";

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    try {
      await login(email.trim(), password);
    } catch (error) {
      const { status, message } = normalizeApiError(error);
      const normalized = message.toLowerCase();
      const isInvalidCredentials =
        status === 401 ||
        status === 403 ||
        normalized.includes("invalid credentials") ||
        normalized.includes("wrong password");

      if (isInvalidCredentials) {
        Alert.alert("Giriş başarısız", "E-posta veya şifre hatalı.");
      } else {
        Alert.alert("Giriş başarısız", message || "Giriş sırasında bir hata oluştu.");
      }

      console.error("[Login] login failed", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
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
