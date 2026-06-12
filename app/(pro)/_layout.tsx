import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, Text } from 'react-native';
import { useRef, useEffect } from 'react';

import { useTheme } from '@/hooks/useTheme';

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
          name={focused ? 'briefcase' : 'briefcase-outline'}
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
        Jobs
      </Text>
    </Pressable>
  );
}

export default function ProLayout() {
  const { theme: Theme } = useTheme();
  return (
    <Tabs
      // The settings / verification / onboarding screens are href:null tab
      // routes reached via push from the Profile tab. With the default
      // 'firstRoute' back behavior their back arrow snapped to Dashboard; tab
      // history sends the user back to wherever they came from (Profile).
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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="job/index"
        options={{
          title: 'Jobs',
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'cube' : 'cube-outline'} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen name="job/active" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="request/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="appearance" options={{ href: null }} />
      <Tabs.Screen name="language" options={{ href: null }} />
      <Tabs.Screen name="legal" options={{ href: null }} />
      <Tabs.Screen name="privacy-policy" options={{ href: null }} />
      <Tabs.Screen name="terms-conditions" options={{ href: null }} />
      <Tabs.Screen name="login-security" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="verification-details" options={{ href: null }} />
    </Tabs>
  );
}
