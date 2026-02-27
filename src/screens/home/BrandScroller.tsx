import React from "react";
import { FlatList, View, Image } from "react-native";
import { styles } from "../styles";
import { Brand } from "../../types/home";

type Props = {
  markalar: Brand[];
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
};

export default function BrandScroller({ markalar, onTouchStart, onTouchEnd }: Props) {
  return (
    <FlatList
      horizontal
      data={markalar}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.brandScroll}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      renderItem={({ item }) => (
        <View style={styles.brandCircle}>
          <Image source={item.image} style={styles.brandImg} resizeMode="contain" />
        </View>
      )}
    />
  );
}
