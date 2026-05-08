import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Modal,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { SkeletonList } from '../components/Skeleton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { Category, RootStackParamList } from '../types';
import { API_BASE_URL } from '../config/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Categories'>;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.72;

const MENU_ITEMS = [
  { key: 'categories', label: 'Categories List', icon: '📋' },
  { key: 'search',     label: 'Food Search',     icon: '🔍' },
  { key: 'ai',         label: 'AI Help',          icon: '🤖' },
  { key: 'about',      label: 'About Us',         icon: 'ℹ️' },
];

// Custom category display order — most-used food types first, supplements/additives last
const CATEGORY_ORDER = [
  'Fruits & Vegetables',
  'Grains, Breads & Pastries',
  'Dairy',
  'Meats',
  'Beverages (Coffee, Tea, Juice, Alcohol)',
  'Snacks & Sweets',
  'Spices',
  'Condiments, Dressings, Oils & Soup',
  'Food Additives',
  'Vitamins & Supplements',
];

function sortCategories(list: Category[]): Category[] {
  return [...list].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.name);
    const bi = CATEGORY_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;   // unknown → push to end
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function CategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('categories');

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(useCallback(() => {
    setActiveMenu('categories');
  }, []));

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.poly(5)),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.poly(5)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => { setSidebarVisible(false); onDone?.(); });
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data: Category[] = await response.json();
      setCategories(sortCategories(data));
    } catch (err) {
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Foods', { categoryId: item._id, categoryName: item.name })}
    >
      <View style={styles.cardIndex}>
        <Text style={styles.cardIndexText}>{index + 1}</Text>
      </View>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />

      {/* Navbar */}
      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.navLogoImage}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.menuButton} activeOpacity={0.6} onPress={openSidebar}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Categories</Text>
        {!loading && !error && (
          <Text style={styles.pageCount}>{categories.length} categories</Text>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonList count={9} type="category" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Sidebar Drawer */}
      <Modal visible={sidebarVisible} transparent animationType="none" onRequestClose={() => closeSidebar()}>
        <View style={styles.modalContainer}>
          {/* Dim overlay */}
          <TouchableWithoutFeedback onPress={() => closeSidebar()}>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>

          {/* Sidebar panel */}
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            {/* Sidebar header */}
            <View style={styles.sidebarHeader}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.sidebarLogo}
                resizeMode="contain"
              />
              <TouchableOpacity onPress={() => closeSidebar()} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Menu items */}
            <View style={styles.sidebarMenu}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.menuItem,
                    activeMenu === item.key && styles.menuItemActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveMenu(item.key);
                    closeSidebar(() => {
                      if (item.key === 'search') navigation.navigate('FoodSearch');
                      if (item.key === 'ai') navigation.navigate('AIHelp');
                      if (item.key === 'about') navigation.navigate('AboutUs');
                    });
                  }}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuItemLabel,
                      activeMenu === item.key && styles.menuItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bodyBg,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.sidebarBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navLogoImage: {
    height: 40,
    width: 100,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textHeading,
  },
  pageCount: {
    fontSize: 15,
    color: Colors.textMuted,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
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
  cardIndex: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIndexText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 24,
  },
  cardChevron: {
    fontSize: 22,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 15,
    color: Colors.avoid,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Colors.radius,
  },
  retryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Sidebar
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: Colors.sidebarBg,
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarLogo: {
    height: 60,
    width: 120,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  sidebarMenu: {
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: Colors.radius,
  },
  menuItemActive: {
    backgroundColor: Colors.primary,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.sidebarText,
  },
  menuItemLabelActive: {
    color: Colors.white,
    fontWeight: '600',
  },
});