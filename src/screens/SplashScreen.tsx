import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Categories');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🍽</Text>
        </View>
        <Text style={styles.appName}>IC101</Text>
        <Text style={styles.appSubtitle}>Food App</Text>
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim }]}>
        <Text style={styles.tagline}>Know what's on your plate</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sidebarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 50,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: 60,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
});
