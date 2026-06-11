import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
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
  { key: 'about',      label: 'About Us',         icon: 'ℹ️' },
];

const STATUS_CONFIG: Record<FoodStatus, { icon: string; label: string; color: string; bg: string }> = {
  bladder_friendly: { icon: '💚', label: 'Bladder Friendly', color: Colors.bladderFriendly, bg: Colors.bladderFriendlyBg },
  worth_try:        { icon: '⚠️', label: 'Worth a Try',      color: Colors.worthTry,        bg: Colors.worthTryBg },
  avoid:            { icon: '❌', label: 'Avoid',             color: Colors.avoid,           bg: Colors.avoidBg },
};

const STATUS_RANK: Record<FoodStatus, number> = {
  bladder_friendly: 0,
  worth_try: 1,
  avoid: 2,
};

export default function FoodsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
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

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/foods`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data: Food[] = await response.json();
      data.sort((a, b) => a.name.localeCompare(b.name));
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
      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
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
                  {selectedFood?.types
                    .slice()
                    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])
                    .map((t: FoodType) => {
                    const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.avoid;
                    return (
                      <View key={t._id} style={[styles.typeCard, { borderLeftColor: cfg.color }]}>
                        <View style={styles.typeCardHeader}>
                          <Text style={styles.typeName}>{t.name}</Text>
                          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
                          </View>
                        </View>
                        {t.note ? <Text style={styles.typeNote}>{t.note}</Text> : null}
                      </View>
                    );
                  })}
                </ScrollView>

                {selectedFood?.reference ? (
                  <TouchableOpacity
                    style={styles.referenceRow}
                    activeOpacity={0.7}
                    onPress={() => Linking.openURL(selectedFood?.reference ?? '')}
                  >
                    <Text style={styles.referenceText}>
                      🔗 <Text style={styles.referenceLink}>View source / reference</Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedFood(null)}>
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Sidebar Drawer */}
      <Modal visible={sidebarVisible} transparent animationType="none" onRequestClose={() => closeSidebar()}>
        <View style={styles.sidebarContainer}>
          <TouchableWithoutFeedback onPress={() => closeSidebar()}>
            <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <View>
                <Text style={styles.sidebarTitle}>🌼  IC101 Food App</Text>
                <Text style={styles.sidebarSubtitle}>Interstitial Cystitis Network</Text>
              </View>
              <TouchableOpacity onPress={() => closeSidebar()} style={styles.closeButton}>
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
                    closeSidebar(() => {
                      if (item.key === 'search') navigation.navigate('FoodSearch');
                      if (item.key === 'categories') navigation.navigate('Categories');
                      if (item.key === 'ai') navigation.navigate('AIHelp');
                      if (item.key === 'about') navigation.navigate('AboutUs');
                    });
                  }}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[styles.menuItemLabel, activeMenu === item.key && styles.menuItemLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Medical disclaimer */}
            <View style={[styles.sidebarDisclaimer, { paddingBottom: Math.max(insets.bottom, 24) + 48 }]}>
              <Text style={styles.sidebarDisclaimerText}>
                The IC101 Food App provides general information only and is not a
                substitute for professional medical advice, diagnosis, or treatment.
                Always seek advice from a qualified healthcare provider regarding
                medical conditions, and never disregard professional advice because
                of app content.
              </Text>
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
    fontSize: 18,
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
    fontSize: 15,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textHeading,
  },
  foodNote: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 21,
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
    maxHeight: '85%',
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
    fontSize: 21,
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
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 22,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  modalScroll: {
    flexShrink: 1,
  },
  typeCard: {
    backgroundColor: Colors.bodyBg,
    borderRadius: Colors.radius,
    borderLeftWidth: 4,
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
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 21,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeNote: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  referenceRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  referenceText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  referenceLink: {
    color: '#1F7A3A',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  sidebarSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
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
    flex: 1,
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
  sidebarDisclaimer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  sidebarDisclaimerText: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.5)',
  },
});