import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { API_BASE_URL } from '../config/api';
import { useLinks } from '../context/LinksContext';

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
  { key: 'about',      label: 'About Us',         icon: 'ℹ️' },
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

function FormattedText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <Text key={i} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>
          : part
      )}
    </Text>
  );
}

function TypewriterText({ text, style, speed = 30, onTick }: {
  text: string; style?: object; speed?: number; onTick?: () => void;
}) {
  const [length, setLength] = useState(0);

  useEffect(() => {
    setLength(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      // Speed through whitespace/newlines in bursts
      while (i < text.length && (text[i] === ' ' || text[i] === '\n')) i++;
      setLength(i);
      onTick?.();
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  return <FormattedText text={text.slice(0, length)} style={style} />;
}

function MessageBubble({ message, typewriter = false, onTick }: {
  message: Message; typewriter?: boolean; onTick?: () => void;
}) {
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
        {typewriter
          ? <TypewriterText text={message.text} style={styles.aiText} onTick={onTick} />
          : <FormattedText text={message.text} style={styles.aiText} />
        }
      </View>
    </Animated.View>
  );
}

export default function AIHelpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { getLink } = useLinks();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [typingMsgId, setTypingMsgId] = useState<string>('welcome');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('ai');

  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const userScrolledUp = useRef(false);

  useFocusEffect(useCallback(() => {
    setActiveMenu('ai');
  }, []));

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Only scroll if user hasn't manually scrolled up
  const autoScroll = () => {
    if (userScrolledUp.current) return;
    flatListRef.current?.scrollToEnd({ animated: false });
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    userScrolledUp.current = distFromBottom > 80;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    userScrolledUp.current = false;
    scrollToBottom();

    try {
      const response = await fetch(`${API_BASE_URL}/extract-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();

      let replyText = '';
      const raw = data.answer ?? '';

      if (raw.includes('```json')) {
        try {
          const jsonStr = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonStr);
          replyText = parsed.answer || '';
          if (parsed.reason) {
            replyText += '\n\n📋 Reason:\n' + parsed.reason;
          }
          if (parsed.what_ICN_mention_importantly) {
            replyText += '\n\n⚠️ Important:\n' + parsed.what_ICN_mention_importantly;
          }
          if (parsed.additional_info) {
            replyText += '\n\n💡 Additional info:\n' + parsed.additional_info;
          }
        } catch {
          replyText = raw;
        }
      } else {
        replyText = raw || 'Sorry, I could not process that.';
      }

      const aiId = (Date.now() + 1).toString();
      const aiMsg: Message = { id: aiId, text: replyText, isUser: false };
      setTypingMsgId(aiId);
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errId = (Date.now() + 1).toString();
      setTypingMsgId(errId);
      setMessages(prev => [
        ...prev,
        { id: errId, text: 'Sorry, I\'m having trouble connecting right now. Please try again.', isUser: false },
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
      if (key === 'about') navigation.navigate('AboutUs');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={Colors.sidebarBg} barStyle="light-content" />

      {/* Navbar */}
      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.navTitle}>🤖  AI Help</Text>
          <Text style={styles.navSubtitle}>Each question is answered independently</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.6} onPress={openSidebar}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      {/* Citation / source banner */}
      <View style={styles.citationBanner}>
        <Text style={styles.citationText}>
          All data for this AI was compiled from the{' '}
          <Text style={styles.citationLink} onPress={() => Linking.openURL(getLink('ai_food_lists'))}>
            ICN Food Lists
          </Text>, the{' '}
          <Text style={styles.citationLink} onPress={() => Linking.openURL(getLink('ai_diet_guide'))}>
            IC101 Diet Guide
          </Text>, both publications of the{' '}
          <Text style={styles.citationLink} onPress={() => Linking.openURL(getLink('icn_home'))}>
            Interstitial Cystitis Network
          </Text>.
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              typewriter={item.id === typingMsgId && !item.isUser}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={true}
          onContentSizeChange={autoScroll}
          onScroll={handleScroll}
          scrollEventThrottle={100}
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

            {/* Medical disclaimer */}
            <View style={styles.sidebarDisclaimer}>
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

  // Citation banner
  citationBanner: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  citationText: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  citationLink: {
    color: '#1F7A3A',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeIcon: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  sidebarMenu: { flex: 1, paddingTop: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 14, marginHorizontal: 10, marginVertical: 2, borderRadius: Colors.radius },
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
