import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { styles as sharedStyles } from "../screens/styles";

export default function PaymentMethodsScreen() {
  return (
    <SafeAreaView style={sharedStyles.container} edges={["bottom"]}>
      <AppHeader title="Kayıtlı Kartlar" showBack />
      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.summaryCard}>
          <Text style={sharedStyles.summarySectionTitle}>Ödeme Yöntemi</Text>
          <Text style={sharedStyles.summaryText}>Bu alanda kayıtlı kartlarınızı görüntüleyebileceksiniz.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
