import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

function SkeletonBox({ width, height, style }: {
  width?: number | string;
  height: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, backgroundColor: '#dde3ed', borderRadius: 4, opacity }, style]}
    />
  );
}

export function CategorySkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={32} height={32} style={{ borderRadius: 8, marginRight: 12 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox height={14} style={{ width: '72%' }} />
        <SkeletonBox height={11} style={{ width: '45%' }} />
      </View>
      <SkeletonBox width={14} height={14} style={{ marginLeft: 8 }} />
    </View>
  );
}

export function FoodSkeleton() {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1, gap: 7 }}>
        <SkeletonBox height={15} style={{ width: '65%' }} />
        <SkeletonBox height={11} style={{ width: '85%' }} />
      </View>
      <SkeletonBox width={14} height={14} style={{ marginLeft: 8 }} />
    </View>
  );
}

export function SearchSkeleton() {
  return (
    <View style={styles.searchCard}>
      <View style={styles.searchCardTop}>
        <SkeletonBox height={15} style={{ flex: 1 }} />
        <SkeletonBox width={96} height={22} style={{ borderRadius: 20 }} />
      </View>
      <SkeletonBox height={11} style={{ width: '60%', marginBottom: 12 }} />
      <View style={styles.divider} />
      <SkeletonBox height={13} style={{ width: '80%', marginTop: 8 }} />
      <SkeletonBox height={11} style={{ width: '55%', marginTop: 5 }} />
    </View>
  );
}

export function SkeletonList({ count, type }: {
  count: number;
  type: 'category' | 'food' | 'search';
}) {
  const Component =
    type === 'category' ? CategorySkeleton :
    type === 'food'     ? FoodSkeleton :
                          SearchSkeleton;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <Component />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Colors.radius,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Colors.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});