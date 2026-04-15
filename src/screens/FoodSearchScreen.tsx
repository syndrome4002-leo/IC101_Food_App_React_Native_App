import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  Image,
  Modal,
  Animated,
  Easing,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SkeletonList } from '../components/Skeleton';
import { Colors } from '../theme/colors';
import { SearchResult, StatusFilter, FoodStatus, RootStackParamList } from '../types';
import { API_BASE_URL } from '../config/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FoodSearch'>;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.72;

const MENU_ITEMS = [
  { key: 'categories', label: 'Categories List', icon: '📋' },
  { key: 'search',     label: 'Food Search',     icon: '🔍' },
  { key: 'ai',         label: 'AI Help',          icon: '🤖' },
];

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All',              value: 'all' },
  { label: 'Worth a Try',      value: 'worth_try' },
  { label: 'Bladder Friendly', value: 'bladder_friendly' },
  { label: 'Avoid',            value: 'avoid' },
];

const STATUS_CONFIG: Record<FoodStatus, { icon: string; label: string; color: string; bg: string }> = {
  bladder_friendly: { icon: '💚', label: 'Bladder Friendly', color: Colors.bladderFriendly, bg: Colors.bladderFriendlyBg },
  worth_try:        { icon: '⚠️', label: 'Worth a Try',      color: Colors.worthTry,        bg: Colors.worthTryBg },
  avoid:            { icon: '❌', label: 'Avoid',             color: Colors.avoid,           bg: Colors.avoidBg },
};

function Highlight({ text, keyword, style }: { text: string; keyword: string; style?: object }) {
  if (!keyword.trim()) return <Text style={style}>{text}</Text>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase()
          ? <Text key={i} style={styles.highlight}>{part}</Text>
          : part
      )}
    </Text>
  );
}

export default function FoodSearchScreen({ navigation }: Props) {
  const [searchKey, setSearchKey] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('search');

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  useFocusEffect(useCallback(() => {
    setActiveMenu('search');
  }, []));

  useEffect(() => {
    fetchResults('', 'all');
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(searchKey, status);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchKey, status]);

  const fetchResults = async (key: string, st: StatusFilter) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const params = new URLSearchParams({ search_key: key });
      if (st !== 'all') params.append('status', st);
      const response = await fetch(`${API_BASE_URL}/search/types?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data: SearchResult[] = await response.json();
      if (!controller.signal.aborted) {
        setResults(data);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setResults([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.poly(5)), useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.poly(5)), useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SIDEBAR_WIDTH, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => { setSidebarVisible(false); onDone?.(); });
  };

  const handleMenuPress = (key: string) => {
    setActiveMenu(key);
    closeSidebar(() => {
      if (key === 'categories') navigation.navigate('Categories');
      if (key === 'ai') navigation.navigate('AIHelp');
    });
  };

  const selectedStatusLabel = STATUS_OPTIONS.find(o => o.value === status)?.label ?? 'All';

  const renderResult = ({ item }: { item: SearchResult }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.avoid;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            <Highlight text={item.food} keyword={searchKey} style={styles.foodName} />
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
            </View>
          </View>
          {item.food_note
            ? <Highlight text={item.food_note} keyword={searchKey} style={styles.foodNote} />
            : null}
        </View>
        <View style={styles.typeDivider} />
        <View style={styles.typeRow}>
          <Highlight text={item.type} keyword={searchKey} style={styles.typeName} />
        </View>
        {item.type_note
          ? <Highlight text={item.type_note} keyword={searchKey} style={styles.typeNote} />
          : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.navTitle}>🔍  Food Search</Text>
          <Text style={styles.navSubtitle}>Search foods by key and status</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.6} onPress={openSidebar}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        {/* Search input */}
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods or types..."
            placeholderTextColor={Colors.textMuted}
            value={searchKey}
            onChangeText={setSearchKey}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchKey.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKey('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status dropdown */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.8}
            onPress={() => setDropdownOpen(v => !v)}
          >
            <Text style={styles.dropdownValue}>{selectedStatusLabel}</Text>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {dropdownOpen && (
            <>
            <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
              <View style={styles.dropdownBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.dropdownList}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownItem, status === opt.value && styles.dropdownItemActive]}
                  onPress={() => { setStatus(opt.value); setDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownItemText, status === opt.value && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                  {status === opt.value && <Text style={styles.dropdownItemCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
            </>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonList count={6} type="search" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>😔</Text>
          <Text style={styles.stateText}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
          }
        />
      )}

      {/* Sidebar */}
      <Modal visible={sidebarVisible} transparent animationType="none" onRequestClose={() => closeSidebar()}>
        <View style={styles.sidebarContainer}>
          <TouchableWithoutFeedback onPress={() => closeSidebar()}>
            <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
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
            <View style={styles.sidebarMenu}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, activeMenu === item.key && styles.menuItemActive]}
                  activeOpacity={0.8}
                  onPress={() => handleMenuPress(item.key)}
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  navSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
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

  // Search section
  searchSection: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 100,
    overflow: 'visible',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bodyBg,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 11,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bodyBg,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 99,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBg,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primary + '15',
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dropdownItemCheck: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },

  // Results
  resultCount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  card: {
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
  cardTop: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  foodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textHeading,
  },
  foodNote: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  typeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  typeName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  typeNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
    fontStyle: 'italic',
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
  separator: {
    height: 8,
  },
  highlight: {
    backgroundColor: '#FEF08A',
    color: '#713F12',
    fontWeight: '700',
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  stateText: {
    fontSize: 15,
    color: Colors.textMuted,
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