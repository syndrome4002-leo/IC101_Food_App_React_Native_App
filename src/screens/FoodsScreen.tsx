import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  Modal,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SkeletonList } from '../components/Skeleton';
import { Colors } from '../theme/colors';
import { Food, FoodType, FoodStatus, RootStackParamList } from '../types';
import { API_BASE_URL } from '../config/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Foods'>;
  route: RouteProp<RootStackParamList, 'Foods'>;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.72;

const MENU_ITEMS = [
  { key: 'categories', label: 'Categories List', icon: '📋' },
  { key: 'search',     label: 'Food Search',     icon: '🔍' },
  { key: 'ai',         label: 'AI Help',          icon: '🤖' },
];

const STATUS_CONFIG: Record<FoodStatus, { label: string; color: string; bg: string }> = {
  bladder_friendly: { label: 'Bladder Friendly', color: Colors.bladderFriendly, bg: Colors.bladderFriendlyBg },
  worth_try:        { label: 'Worth a Try',      color: Colors.worthTry,        bg: Colors.worthTryBg },
  avoid:            { label: 'Avoid',             color: Colors.avoid,           bg: Colors.avoidBg },
};

export default function FoodsScreen({ navigation, route }: Props) {
  const { categoryId, categoryName } = route.params;
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('categories');

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchFoods();
  }, []);

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

  const closeSidebar = () => {
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
    ]).start(() => setSidebarVisible(false));
  };

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/foods`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data: Food[] = await response.json();
      setFoods(data);
    } catch (err) {
      setError('Failed to load foods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFood = ({ item }: { item: Food }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => setSelectedFood(item)}>
      <View style={styles.cardLeft}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.note ? <Text style={styles.foodNote}>{item.note}</Text> : null}
      </View>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{categoryName}</Text>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.6} onPress={openSidebar}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      {/* Page count */}
      {!loading && !error && (
        <View style={styles.pageHeader}>
          <Text style={styles.pageCount}>{foods.length} foods</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonList count={7} type="food" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFoods}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item._id}
          renderItem={renderFood}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Food Detail Modal — centered */}
      <Modal
        visible={!!selectedFood}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFood(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedFood(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalFoodName} numberOfLines={2}>{selectedFood?.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedFood(null)} style={styles.modalCloseIcon}>
                    <Text style={styles.modalCloseIconText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {selectedFood?.note ? (
                  <Text style={styles.modalFoodNote}>{selectedFood.note}</Text>
                ) : null}

                {/* Types */}
                <Text style={styles.modalSectionTitle}>Types</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  {selectedFood?.types.map((t: FoodType) => {
                    const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.avoid;
                    return (
                      <View key={t._id} style={[styles.typeCard, { borderLeftColor: cfg.color }]}>
                        <View style={styles.typeCardHeader}>
                          <Text style={styles.typeName}>{t.name}</Text>
                          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                        </View>
                        {t.note ? <Text style={styles.typeNote}>{t.note}</Text> : null}
                      </View>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedFood(null)}>
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Sidebar Drawer */}
      <Modal visible={sidebarVisible} transparent animationType="none" onRequestClose={closeSidebar}>
        <View style={styles.sidebarContainer}>
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.sidebarLogo}
                resizeMode="contain"
              />
              <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sidebarMenu}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, activeMenu === item.key && styles.menuItemActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveMenu(item.key);
                    closeSidebar();
                    if (item.key === 'search') navigation.navigate('FoodSearch');
                    if (item.key === 'categories') navigation.navigate('Categories');
                    if (item.key === 'ai') navigation.navigate('AIHelp');
                  }}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[styles.menuItemLabel, activeMenu === item.key && styles.menuItemLabelActive]}>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 36,
    color: Colors.white,
    lineHeight: 40,
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginHorizontal: 8,
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  pageCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Colors.radius,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textHeading,
  },
  foodNote: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 18,
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

  // Food detail modal — centered
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },
  modalFoodName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textHeading,
  },
  modalCloseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bodyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIconText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalFoodNote: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalScroll: {
    maxHeight: 280,
  },
  typeCard: {
    backgroundColor: Colors.bodyBg,
    borderRadius: Colors.radius,
    borderLeftWidth: 3,
    padding: 10,
    marginBottom: 8,
  },
  typeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 5,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  modalCloseBtn: {
    backgroundColor: Colors.sidebarBg,
    borderRadius: Colors.radius,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  modalCloseBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // Sidebar
  sidebarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: Colors.sidebarBg,
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
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
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