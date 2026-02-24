import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "../constants/theme";

type AccountMenuItemProps = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
};

export default function AccountMenuItem({ iconName, label, onPress }: AccountMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: THEME.borderColor,
      }}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={iconName} size={18} color={THEME.primary} />
        <Text style={{ fontSize: 15, color: THEME.textDark, fontWeight: "600" }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={THEME.textGray} />
    </TouchableOpacity>
  );
}
