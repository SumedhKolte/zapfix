import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, View, Text } from 'react-native';
import { useRef, useEffect } from 'react';

import { ActiveJobTracker } from '@/components/customer/ActiveJobTracker';
import { useTheme } from '@/hooks/useTheme';

/* ── Animated icon for regular tabs ── */
function TabBarIcon({ name, focused }: { name: any; focused: boolean }) {
  const { theme: Theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 1,
        tension: 140,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        alignItems: 'center',
        justifyContent: 'center',
        width: 46,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: Theme.amber,
          opacity: bgOpacity,
          borderRadius: 18,
        }}
      />
      <Ionicons
        name={name}
        size={22}
        color={focused ? Theme.navy : Theme.textLight}
      />
    </Animated.View>
  );
}

/* ── Floating centre Diagnose button ── */
function CenterTabButton({ onPress, accessibilityState }: any) {
  const { theme: Theme } = useTheme();
  const focused = accessibilityState?.selected;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      tension: 140,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Pressable
      onPress={onPress}
      style={{ alignItems: 'center', justifyContent: 'center', top: -18 }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: focused ? Theme.navy : Theme.amber,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3.5,
          borderColor: Theme.creamCard,
          shadowColor: Theme.navy,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
          elevation: 14,
        }}
      >
        <Ionicons
          name={focused ? 'flash' : 'flash-outline'}
          size={28}
          color={focused ? Theme.amber : Theme.navy}
        />
      </Animated.View>
      <Text
        style={{
          marginTop: 6,
          fontSize: 10,
          fontWeight: '700',
          color: focused ? Theme.navy : Theme.textLight,
          letterSpacing: 0.2,
        }}
      >
        Diagnose
      </Text>
    </Pressable>
  );
}

/* ── Layout ── */
export default function CustomerLayout() {
  const { theme: Theme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.navy,
        tabBarInactiveTintColor: Theme.textLight,
        tabBarStyle: {
          backgroundColor: Theme.creamCard,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 82,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: Theme.navy,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.09,
          shadowRadius: 20,
          elevation: 24,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      {/* ── Visible tabs (5) ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'briefcase' : 'briefcase-outline'}
              focused={focused}
            />
          ),
        }}
      />

      {/* Centre floating button */}
      <Tabs.Screen
        name="diagnose"
        options={{
          title: 'Diagnose',
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'gift' : 'gift-outline'}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Hidden routes — only href: null, NO tabBarButton ── */}
      <Tabs.Screen name="matching" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="job/complete" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="login-security" options={{ href: null }} />
      <Tabs.Screen name="appearance" options={{ href: null }} />
      <Tabs.Screen name="language" options={{ href: null }} />
      <Tabs.Screen name="legal" options={{ href: null }} />
      <Tabs.Screen name="receipt/[id]" options={{ href: null }} />
      <Tabs.Screen name="receipts" options={{ href: null }} />
      <Tabs.Screen name="category/[slug]" options={{ href: null }} />
      <Tabs.Screen name="quick-book" options={{ href: null }} />
    </Tabs>
    <ActiveJobTracker />
    </View>
  );
}