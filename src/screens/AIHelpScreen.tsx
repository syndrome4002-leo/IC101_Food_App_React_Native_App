import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Modal,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { API_BASE_URL } from '../config/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIHelp'>;
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.72;

const MENU_ITEMS = [
  { key: 'categories', label: 'Categories List', icon: '📋' },
  { key: 'search',     label: 'Food Search',     icon: '🔍' },
  { key: 'ai',         label: 'AI Help',          icon: '🤖' },
];

const WELCOME: Message = {
  id: 'welcome',
  text: "Hi! I'm your IC101 food assistant 🤖\n\nAsk me anything about bladder-friendly foods, what to avoid, or dietary tips for interstitial cystitis.",
  isUser: false,
};

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 280, useNativeDriver: true }),
          Animated.delay(500),
        ])
      );
    const anims = [bounce(dot1, 0), bounce(dot2, 160), bounce(dot3, 320)];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>
      <View style={[styles.aiBubble, styles.typingBubble]}>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  if (message.isUser) {
    return (
      <Animated.View style={[styles.userRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.aiRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>
      <View style={styles.aiBubble}>
        <Text style={styles.aiText}>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

export default function AIHelpScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('ai');

  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    setActiveMenu('ai');
  }, []));

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply ?? data.message ?? 'Sorry, I could not process that.',
        isUser: false,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: 'Sorry, I\'m having trouble connecting right now. Please try again.', isUser: false },
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.poly(5)), useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.poly(5)), useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SIDEBAR_WIDTH, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setSidebarVisible(false));
  };

  const handleMenuPress = (key: string) => {
    setActiveMenu(key);
    closeSidebar();
    if (key === 'categories') navigation.navigate('Categories');
    if (key === 'search') navigation.navigate('FoodSearch');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>🤖  AI Help</Text>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.6} onPress={openSidebar}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        {/* Input area */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about foods, ingredients..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isTyping) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isTyping}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <Modal visible={sidebarVisible} transparent animationType="none" onRequestClose={closeSidebar}>
        <View style={styles.sidebarContainer}>
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <Image source={require('../../assets/logo.png')} style={styles.sidebarLogo} resizeMode="contain" />
              <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sidebarMenu}>
              {MENU_ITEMS.map(item => (
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
  safeArea: { flex: 1, backgroundColor: Colors.bodyBg },
  flex: { flex: 1 },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.sidebarBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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

  // Messages
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  userRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userText: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 21,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.sidebarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  aiAvatarText: { fontSize: 18 },
  aiBubble: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  aiText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },

  // Typing indicator
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bodyBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 110,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    fontSize: 16,
    color: Colors.white,
    marginLeft: 2,
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
  sidebarLogo: { height: 60, width: 120 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeIcon: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  sidebarMenu: { paddingTop: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 14, marginHorizontal: 10, marginVertical: 2, borderRadius: Colors.radius },
  menuItemActive: { backgroundColor: Colors.primary },
  menuItemIcon: { fontSize: 18 },
  menuItemLabel: { fontSize: 15, fontWeight: '500', color: Colors.sidebarText },
  menuItemLabelActive: { color: Colors.white, fontWeight: '600' },
});
