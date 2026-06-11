import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
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
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { useLinks } from '../context/LinksContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AboutUs'>;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.72;

const MENU_ITEMS = [
  { key: 'categories', label: 'Categories List', icon: '📋' },
  { key: 'search',     label: 'Food Search',     icon: '🔍' },
  { key: 'ai',         label: 'AI Help',          icon: '🤖' },
  { key: 'about',      label: 'About Us',         icon: 'ℹ️' },
];

// `key` matches the server `links` collection so URLs can be managed from the
// admin panel; `url` is the built-in fallback used until the API responds.
const BOOKS = [
  {
    key: 'book_diet_guide',
    image: require('../../assets/book1.jpg'),
    title: 'The IC 101 Diet Guide',
    description:
      'A comprehensive discussion of how and why foods can trigger painful flares and discomfort. It will help you avoid diet-induced flares, learn what is safe to eat and drink, how to do elimination diets, and much more.',
    url: 'https://www.icnsales.com/ic101-diet-guide.html',
  },
  {
    key: 'book_flare_guide',
    image: require('../../assets/book2.jpg'),
    title: 'The IC 101 Flare Guide',
    description:
      'Helps you prevent and manage bladder wall flares, pelvic floor flares, neuralgia flares, stress flares, urethral & rectal flares, and far more. It provides extensive information on flare triggers, symptoms, and, most importantly, rescue plans.',
    url: 'https://www.icnsales.com/ic101-the-flare-guide-print',
  },
  {
    key: 'book_chef_cookbook',
    image: require('../../assets/book3.jpg'),
    title: 'The IC Chef Cookbook',
    description:
      'Offers more than 200 low-acid recipes, tried and tested by a large community of patients.',
    url: 'https://www.icnsales.com/ic-chef-cookbook-print-version.html',
  },
];

const RESOURCES = [
  {
    key: 'resource_prelief',
    title: 'PRELIEF® Acid Reducer',
    description:
      'An OTC supplement that reduces acid in food. Just two caplets can reduce 95% of the acid in a cup of coffee, tomato sauce and more.',
    url: 'https://www.icnsales.com/prelief-acid-reducer/',
  },
  {
    key: 'resource_masterclass',
    title: 'IC 101 Master Class Video Series',
    description:
      'Guides you through diagnosis, treatment, diet and flares.',
    url: 'https://www.icnetwork.org/masterclass/',
  },
];

const MORE_RESOURCES = [
  {
    key: 'more_ic_diet_project',
    title: 'The IC Diet Project',
    description:
      'A website dedicated to creating enjoyable, flavorful low-acid meals. From low-acid salsa to your favorite holiday recipes, it offers easy, fun recipes to help you enjoy food again!',
    url: 'http://www.icdietproject.com',
  },
  {
    key: 'more_bella_rosa',
    title: 'Bella Rosa Low-Acid Coffees',
    description:
      'Known for having the lowest level of chlorogenic acid in the industry today. If you are desperate for coffee but don’t want to trigger a flare, start with their decaf! Half caf and regular is also available.',
    url: 'https://www.icnsales.com/coffee-low-acid/',
  },
  {
    key: 'more_herbal_teas',
    title: 'Bladder-Friendly Herbal Teas',
    description:
      'Chamomile, peppermint, and rooibos herbal teas are the most bladder-friendly. Chamomile can ease bladder and bowel spasms — ideal to drink before bed or if you are struggling with a flare.',
    url: 'https://www.icnsales.com/herbal-teas_peppermint-tummy-mint-after-dinner-teas',
  },
];

export default function AboutUsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { getLink } = useLinks();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('about');

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    setActiveMenu('about');
  }, []));

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
      if (key === 'search') navigation.navigate('FoodSearch');
      if (key === 'ai') navigation.navigate('AIHelp');
    });
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />

      {/* Navbar */}
      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.navTitle}>ℹ️  About Us</Text>
          <Text style={styles.navSubtitle}>Interstitial Cystitis Network</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.6} onPress={openSidebar}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who We Are</Text>
          <Text style={styles.paragraph}>
            The{' '}
            <Text style={styles.link} onPress={() => openLink(getLink('icn_home'))}>
              Interstitial Cystitis Network
            </Text>
            {' '}is a woman-owned health education company dedicated to
            interstitial cystitis, overactive bladder, and pelvic pain disorders. We create innovative
            solutions to the pressing problems facing patients diagnosed with urologic conditions,
            medical care providers who care for them, and the research community seeking new treatments
            and cures.
          </Text>
          <Text style={styles.paragraph}>
            For the past 30 years, we have provided critical 24/7 support to patients in need, developed
            new educational materials, conducted vital research, provided webinars/lectures, and created
            IC awareness campaigns, all at <Text style={styles.bold}>NO COST</Text> to the patients who
            visit our website.
          </Text>
          <Text style={styles.paragraph}>
            Learn more about IC and the diet at:{' '}
            <Text style={styles.link} onPress={() => openLink(getLink('icn_home'))}>
              www.icnetwork.org
            </Text>
          </Text>
        </View>

        {/* IC Diet help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Struggling with the IC Diet?</Text>
          <Text style={styles.paragraph}>We have some resources that can help.</Text>

          {RESOURCES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={styles.linkCard}
              activeOpacity={0.7}
              onPress={() => openLink(getLink(r.key, r.url))}
            >
              <View style={styles.linkCardBody}>
                <Text style={styles.linkTitle}>{r.title}</Text>
                <Text style={styles.linkDescription}>{r.description}</Text>
                <Text style={styles.linkAction}>Learn more →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Books */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Books</Text>
          <Text style={styles.paragraph}>Tap a book to learn more.</Text>

          {BOOKS.map((b) => (
            <TouchableOpacity
              key={b.key}
              style={styles.bookCard}
              activeOpacity={0.7}
              onPress={() => openLink(getLink(b.key, b.url))}
            >
              <Image source={b.image} style={styles.bookImage} resizeMode="contain" />
              <View style={styles.bookBody}>
                <Text style={styles.bookTitle}>{b.title}</Text>
                <Text style={styles.bookDescription}>{b.description}</Text>
                <Text style={styles.linkAction}>View book →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* More resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Resources</Text>

          {MORE_RESOURCES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={styles.linkCard}
              activeOpacity={0.7}
              onPress={() => openLink(getLink(r.key, r.url))}
            >
              <View style={styles.linkCardBody}>
                <Text style={styles.linkTitle}>{r.title}</Text>
                <Text style={styles.linkDescription}>{r.description}</Text>
                <Text style={styles.linkAction}>Visit →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.footer}
          activeOpacity={0.85}
          onPress={() => openLink(getLink('icn_home'))}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerTagline}>
            Interstitial Cystitis Network
          </Text>
          <Text style={styles.footerSubtle}>
            30+ years supporting IC patients · Tap to visit our website
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sidebar */}
      <Modal visible={sidebarVisible} transparent animationType="none" onRequestClose={() => closeSidebar()}>
        <View style={styles.sidebarContainer}>
          <TouchableWithoutFeedback onPress={() => closeSidebar()}>
            <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <View>
                <Text style={styles.navTitle}>🌼  IC101 Food App</Text>
                <Text style={styles.navSubtitle}>Interstitial Cystitis Network</Text>
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
                  onPress={() => handleMenuPress(item.key)}
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
  safeArea: { flex: 1, backgroundColor: Colors.bodyBg },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.sidebarBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  navSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  menuButton: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  hamburgerLine: { width: 22, height: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textHeading,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
    marginBottom: 10,
  },
  bold: { fontWeight: '700', color: Colors.textHeading },
  link: {
    color: '#1F7A3A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Link cards
  linkCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Colors.radius,
    padding: 14,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  linkCardBody: {},
  linkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textHeading,
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    marginBottom: 8,
  },
  linkAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F7A3A',
  },

  // Book cards
  bookCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: Colors.radius,
    padding: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  bookImage: {
    width: 90,
    height: 130,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: Colors.bodyBg,
  },
  bookBody: { flex: 1 },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textHeading,
    marginBottom: 4,
  },
  bookDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text,
    marginBottom: 8,
  },

  // Footer
  footer: {
    alignItems: 'center',
    backgroundColor: Colors.sidebarBg,
    borderRadius: Colors.radius,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  footerLogo: {
    width: 160,
    height: 60,
    marginBottom: 10,
  },
  footerTagline: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  footerSubtle: {
    fontSize: 12,
    color: Colors.sidebarText,
    textAlign: 'center',
  },

  // Sidebar
  sidebarContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  sidebarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { width: SIDEBAR_WIDTH, height: '100%', backgroundColor: Colors.sidebarBg, elevation: 10 },
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
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  sidebarMenu: { flex: 1, paddingTop: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 20, gap: 14,
    marginHorizontal: 10, marginVertical: 2,
    borderRadius: Colors.radius,
  },
  menuItemActive: { backgroundColor: Colors.primary },
  menuItemIcon: { fontSize: 18 },
  menuItemLabel: { fontSize: 15, fontWeight: '500', color: Colors.sidebarText },
  menuItemLabelActive: { color: Colors.white, fontWeight: '600' },
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
