import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../constants/theme";

type AuthGateSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  onLogin: () => void;
  children?: React.ReactNode;
};

export default function AuthGateSheet({ visible, onDismiss, onLogin, children }: AuthGateSheetProps) {
  const screenHeight = Dimensions.get("window").height;
  const sheetHeight = useMemo(() => Math.round(screenHeight * 0.65), [screenHeight]);

  const [shouldRender, setShouldRender] = useState(visible);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [backdropOpacity, sheetHeight, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 6,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > sheetHeight * 0.22 || gestureState.vy > 1.1) {
            onDismiss();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onDismiss, sheetHeight, translateY]
  );

  if (!shouldRender) return null;

  return (
    <Modal visible={shouldRender} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]} {...panResponder.panHandlers}>
          <View style={styles.handle} />
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheet: {
    width: "100%",
    backgroundColor: THEME.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: THEME.borderColor,
    marginTop: 10,
    marginBottom: 8,
  },
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
