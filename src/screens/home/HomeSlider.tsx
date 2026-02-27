import React from "react";
import { View, ScrollView, Image } from "react-native";
import { styles } from "../styles";

export default function HomeSlider({
  dailyDeals,
  sliderRef,
  itemWidth,
  sidePeek,
  gap,
  snapInterval,
  setActiveDealIndex,
  onUserInteraction,
}: {
  dailyDeals: number[];
  sliderRef: React.RefObject<ScrollView | null>;
  itemWidth: number;
  sidePeek: number;
  gap: number;
  snapInterval: number;
  setActiveDealIndex: (value: number) => void;
  onUserInteraction: () => void;
}) {
  return (
    <View style={styles.sliderContainer}>
      <ScrollView
        ref={sliderRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={[styles.sliderTrack, { paddingHorizontal: sidePeek }]}
        onScrollBeginDrag={onUserInteraction}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          setActiveDealIndex(Math.round(offsetX / snapInterval));
        }}
      >
        {dailyDeals.map((img, i) => (
          <View key={i} style={[styles.slideItem, { width: itemWidth, marginRight: i === dailyDeals.length - 1 ? 0 : gap }]}>
            <View style={styles.slideCard}>
              <Image source={img} style={styles.slideImage} resizeMode="cover" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
