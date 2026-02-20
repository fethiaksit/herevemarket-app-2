import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles";

export default function AddAddressScreen({ onSave, onCancel, loading = false }: any) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [note, setNote] = useState("");

  const isDisabled = useMemo(() => loading, [loading]);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBackButton} onPress={onCancel} disabled={isDisabled}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenterAbsolute}>
          <Text style={styles.headerTitle}>Adres Ekle</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.inputLabel}>Adres Başlığı</Text>
        <TextInput style={styles.input} placeholder="Örn: Evim" value={title} onChangeText={setTitle} editable={!isDisabled} />
        <Text style={styles.inputLabel}>Adres Detayı</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          placeholder="Mahalle, Cadde, Sokak..."
          value={detail}
          onChangeText={setDetail}
          editable={!isDisabled}
        />
        <Text style={styles.inputLabel}>Not (Opsiyonel)</Text>
        <TextInput style={styles.input} placeholder="Zile basmayınız vb." value={note} onChangeText={setNote} editable={!isDisabled} />
      </ScrollView>
      <View style={styles.footerSimple}>
        <TouchableOpacity style={[styles.primaryButton, isDisabled && { opacity: 0.6 }]} onPress={() => onSave({ title, detail, note })} disabled={isDisabled}>
          {isDisabled ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
