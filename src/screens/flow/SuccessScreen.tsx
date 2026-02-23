import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";
import AppHeader from "../../components/AppHeader";

export default function SuccessScreen({ orderId, onReturnHome }: { orderId: string; onReturnHome: () => void }) {
  return (
    <View style={styles.successContainer}>
      <AppHeader title="Sipariş Onayı" showBack={false} />
      <View style={styles.successCircle}><Text style={{ fontSize: 40 }}>🎉</Text></View>
      <Text style={styles.successTitle}>Siparişin Alındı!</Text>
      <Text style={styles.successText}>Sipariş Numaran: <Text style={{fontWeight: 'bold'}}>#{orderId}</Text></Text>
      <Text style={styles.successSubText}>Hazırlanmaya başladığında sana bildirim göndereceğiz. Afiyet olsun!</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onReturnHome}><Text style={styles.primaryButtonText}>Anasayfaya Dön</Text></TouchableOpacity>
    </View>
  );
}
