import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CommonActions } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { MainStackParamList } from "../navigation/types";
import { Address } from "../types";
import { createAddress, deleteAddress, getAddresses, updateAddress } from "../services/api/addresses";
import { normalizeApiError } from "../services/api/client";
import { ROUTES } from "../navigation/routes";

export type AddressListProps = NativeStackScreenProps<MainStackParamList, "AddressList">;

const emptyForm = { title: "", detail: "", note: "", isDefault: false };

export default function AddressListScreen({ navigation }: AddressListProps) {
  const { token, logout } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadAddresses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAddresses(token);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      const { message } = normalizeApiError(error);
      Alert.alert("Hata", message || "Adresler alınamadı.");
      console.error("[AddressList] load failed", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.title.trim() || !form.detail.trim()) {
      Alert.alert("Eksik bilgi", "Adres başlığı ve detayı gerekli.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const updated = await updateAddress(token, editing.id, form);
        setAddresses((prev) => prev.map((addr) => (addr.id === editing.id ? updated : addr)));
        Alert.alert("Başarılı", "Adres güncellendi.");
      } else {
        await createAddress(token, form);
        await loadAddresses();
        Alert.alert("Başarılı", "Adres kaydedildi.");
      }
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      const { message } = normalizeApiError(error);
      Alert.alert("Hata", message || "Adres kaydedilemedi.");
      console.error("[AddressList] save failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (address: Address) => {
    if (!token) return;
    Alert.alert("Adresi Sil", "Bu adresi silmek istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setIsSubmitting(true);
          try {
            await deleteAddress(token, address.id);
            setAddresses((prev) => prev.filter((item) => item.id !== address.id));
            Alert.alert("Başarılı", "Adres silindi.");
          } catch (error) {
            const { message } = normalizeApiError(error);
            Alert.alert("Hata", message || "Adres silinemedi.");
            console.error("[AddressList] delete failed", error);
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleDefault = async (address: Address) => {
    if (!token) return;
    setIsSubmitting(true);
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
      Alert.alert("Başarılı", "Varsayılan adres güncellendi.");
    } catch (error) {
      const { message } = normalizeApiError(error);
      Alert.alert("Hata", message || "Varsayılan adres ayarlanamadı.");
      console.error("[AddressList] set default failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditing(address);
    setForm({
      title: address.title,
      detail: address.detail,
      note: address.note ?? "",
      isDefault: Boolean(address.isDefault),
    });
  };

  const handleLogout = () => {
    Alert.alert("Çıkış", "Çıkış yapmak istiyor musun?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: ROUTES.HOME }],
            })
          );
        },
      },
    ]);
  };

  const keyExtractor = useCallback((item: Address) => String(item.id || item._id), []);

  const renderItem: ListRenderItem<Address> = ({ item: address }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{address.title}</Text>
        {address.isDefault ? <Text style={styles.defaultBadge}>Varsayılan</Text> : null}
      </View>
      <Text style={styles.cardDetail}>{address.detail}</Text>
      {address.note ? <Text style={styles.cardNote}>Not: {address.note}</Text> : null}
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(address)}>
          <Text style={styles.link}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDefault(address)}>
          <Text style={styles.link}>Varsayılan Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(address)}>
          <Text style={styles.deleteLink}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isBusy = loading || isSubmitting;
  const submitLabel = useMemo(() => (editing ? "Güncelle" : "Kaydet"), [editing]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adreslerim</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {isBusy ? <ActivityIndicator style={styles.spinner} /> : null}

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Adres başlığı"
          value={form.title}
          onChangeText={(v) => setForm((prev) => ({ ...prev, title: v }))}
          editable={!isSubmitting}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Adres detayı"
          value={form.detail}
          onChangeText={(v) => setForm((prev) => ({ ...prev, detail: v }))}
          multiline
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder="Not (opsiyonel)"
          value={form.note}
          onChangeText={(v) => setForm((prev) => ({ ...prev, note: v }))}
          editable={!isSubmitting}
        />

        <TouchableOpacity style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{submitLabel}</Text>}
        </TouchableOpacity>

        {!addresses.length && !loading ? <Text style={styles.emptyText}>Henüz kayıtlı adresiniz yok.</Text> : null}

        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backText: { fontSize: 24, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  logoutText: { color: "#EF4444", fontWeight: "600" },
  spinner: { marginVertical: 8 },
  content: { flex: 1, paddingHorizontal: 16 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  multiline: { minHeight: 76, textAlignVertical: "top" },
  primaryButton: {
    backgroundColor: "#004AAD",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 10,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  listContent: { paddingBottom: 24 },
  emptyText: { textAlign: "center", color: "#6B7280", marginVertical: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  defaultBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cardDetail: { color: "#374151" },
  cardNote: { color: "#6B7280", marginTop: 4 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  link: { color: "#004AAD", fontWeight: "600" },
  deleteLink: { color: "#EF4444", fontWeight: "600" },
});
