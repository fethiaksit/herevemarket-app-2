import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { THEME } from "../constants/theme";

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  leftContent?: React.ReactNode;
};

export default function AppHeader({ title, showBack = true, onBack, leftContent }: AppHeaderProps) {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.row}>
        {leftContent ? (
          <View style={styles.leftContentWrap}>{leftContent}</View>
        ) : showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderColor: THEME.borderColor,
  },
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  leftContentWrap: {
    marginRight: 8,
  },
  backPlaceholder: {
    width: 40,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 22,
    color: THEME.primary,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.textDark,
    flexShrink: 1,
  },
});
