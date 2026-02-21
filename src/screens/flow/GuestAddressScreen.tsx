import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { styles } from "../styles";

export default function GuestAddressScreen({ address, guestInfo, errors, onChange, onGuestChange, onBack, onContinue }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBackButton} onPress={onBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenterAbsolute}>
          <Text style={styles.headerTitle}>Teslimat Adresi</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Misafir Bilgileri</Text>
        <Text style={styles.inputLabel}>Ad Soyad</Text>
        <TextInput style={styles.input} value={guestInfo.fullName} onChangeText={(value) => onGuestChange({ ...guestInfo, fullName: value })} />
        {errors?.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

        <Text style={styles.inputLabel}>Telefon</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={guestInfo.phone} onChangeText={(value) => onGuestChange({ ...guestInfo, phone: value })} />
        {errors?.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

        <Text style={styles.inputLabel}>Email (Opsiyonel)</Text>
        <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={guestInfo.email} onChangeText={(value) => onGuestChange({ ...guestInfo, email: value })} />

        <Text style={styles.sectionHeader}>Adres Gir</Text>
        <Text style={styles.inputLabel}>Adres Başlığı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Evim"
          value={address.title}
          onChangeText={(value) => onChange({ ...address, title: value })}
        />
        <Text style={styles.inputLabel}>Adres Detayı</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          placeholder="Mahalle, Cadde, Sokak..."
          value={address.detail}
          onChangeText={(value) => onChange({ ...address, detail: value })}
        />
        {errors?.detail ? <Text style={styles.errorText}>{errors.detail}</Text> : null}

        <Text style={styles.inputLabel}>Not (Opsiyonel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Zile basmayınız vb."
          value={address.note}
          onChangeText={(value) => onChange({ ...address, note: value })}
        />
      </ScrollView>
      <View style={styles.footerSimple}>
        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryButtonText}>Devam Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
