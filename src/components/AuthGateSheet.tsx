import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomSheetModal from "./BottomSheetModal";
import { THEME } from "../constants/theme";

type AuthGateSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  onLogin: () => void;
  children?: React.ReactNode;
};

export default function AuthGateSheet({ visible, onDismiss, onLogin, children }: AuthGateSheetProps) {
  return (
    <BottomSheetModal visible={visible} onDismiss={onDismiss}>
      <TouchableOpacity onPress={onDismiss} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Kapat">
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {children ?? (
        <View style={styles.content}>
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.message}>Siparişlerini takip etmek ve hızlı ödeme için hesabına giriş yap.</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
            <Text style={styles.primaryButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
            <Text style={styles.secondaryButtonText}>Şimdi Değil</Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    right: 16,
    top: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.primaryLight,
  },
  closeButtonText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.textDark,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME.textGray,
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.borderColor,
  },
  secondaryButtonText: {
    color: THEME.textDark,
    fontSize: 15,
    fontWeight: "600",
  },
});
