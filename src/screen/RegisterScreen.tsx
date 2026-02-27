import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";
import { ROUTES } from "../navigation/routes";
import { registerUserRaw } from "../services/api/auth";
import AppHeader from "../components/AppHeader";

export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { setAuthenticatedSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitDisabled = useMemo(
    () => isSubmitting || !name.trim() || !email.trim() || !password.trim(),
    [email, isSubmitting, name, password]
  );

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    setIsSubmitting(true);

    try {
      const result = await registerUserRaw({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      const data = result.data ?? {};

      if (!result.ok) {
        const errorMessage =
          (typeof data.error === "string" && data.error) ||
          (typeof data.details === "string" && data.details) ||
          (typeof data.message === "string" && data.message) ||
          "Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.";

        Alert.alert("Kayıt başarısız", errorMessage);

        if (__DEV__) {
          console.log("[RegisterScreen] register failed", { status: result.status });
        }
        return;
      }

      Alert.alert("Başarılı", "Kayıt başarılı");

      if (data.accessToken) {
        await setAuthenticatedSession(data.accessToken);
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.HOME }],
        });
        return;
      }

      navigation.replace(ROUTES.LOGIN, {
        prefillEmail: email.trim(),
      });
    } catch {
      Alert.alert("Hata", "Bir hata oluştu, tekrar deneyin.");
      if (__DEV__) {
        console.log("[RegisterScreen] unexpected register error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppHeader title="Kayıt Ol" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Üye Ol</Text>
          <TextInput style={styles.input} placeholder="Ad Soyad" value={name} onChangeText={setName} editable={!isSubmitting} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Üye Ol</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.replace(ROUTES.LOGIN, { prefillEmail: email.trim() || undefined })}>
            <Text style={styles.footerText}>Zaten hesabın var mı? Giriş yap</Text>
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
  footerText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 16,
  },
});
