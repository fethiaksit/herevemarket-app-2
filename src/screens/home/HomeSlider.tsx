import React from "react";
import { View, ScrollView, Image } from "react-native";
import { styles } from "../styles";

export default function HomeSlider({
  dailyDeals,
  sliderRef,
  slideWidth,
  activeDealIndex,
  setActiveDealIndex,
}: {
  dailyDeals: number[];
  sliderRef: React.RefObject<ScrollView | null>;
  slideWidth: number;
  activeDealIndex: number;
  setActiveDealIndex: (value: number) => void;
}) {
  return (
    <View style={styles.sliderContainer}>
      {/* Test notu: Slider'da merkez kart büyük, yan kartlar 8-12px boşlukla görünür ve autoplay devam eder. */}
      <ScrollView
        ref={sliderRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.sliderTrack}
        onMomentumScrollEnd={(e) => setActiveDealIndex(Math.round(e.nativeEvent.contentOffset.x / slideWidth))}
      >
        {dailyDeals.map((img, i) => (
          <View key={i} style={[styles.slideItem, styles.slideGap, { width: slideWidth - 10 }]}>
            <View style={styles.slideCard}>
              <Image source={img} style={styles.slideImage} resizeMode="cover" />
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dotsContainer}>{dailyDeals.map((_, i) => <View key={i} style={[styles.dot, i === activeDealIndex && styles.dotActive]} />)}</View>
    </View>
  );
}
