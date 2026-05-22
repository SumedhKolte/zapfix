import { useRef, useEffect } from 'react';
import { Text, View, Pressable, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

function NotificationItem({ item, index, onPress }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, tension: 90, friction: 12, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const iconMap: Record<string, string> = {
    job_update: 'briefcase',
    payment: 'card',
    warranty_expiry: 'shield',
    promo: 'gift',
  };
  const icon = iconMap[item.type] ?? 'notifications';

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10,
          flexDirection: 'row', gap: 12, alignItems: 'flex-start',
          borderLeftWidth: 3, borderLeftColor: item.is_read ? 'transparent' : Colors.amber.primary,
          shadowColor: Colors.navy.primary, shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
          opacity: item.is_read ? 0.7 : 1,
        }}
      >
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.is_read ? Colors.border + '60' : Colors.navy.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon as any} size={18} color={item.is_read ? Colors.midGray : Colors.navy.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: item.is_read ? '600' : '700', color: Colors.text.primary, fontSize: 14, flex: 1 }}>{item.title}</Text>
            {!item.is_read && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.amber.primary, marginLeft: 8 }} />
            )}
          </View>
          <Text style={{ color: Colors.text.secondary, fontSize: 13, lineHeight: 18 }}>{item.body}</Text>
          {item.created_at ? (
            <Text style={{ color: Colors.midGray, fontSize: 11, marginTop: 4 }}>
              {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ProNotifications() {
  const router = useRouter();
  const { profile } = useAuth();
  const { notificationsQuery, markAllRead, markRead } = useNotifications(profile?.id ?? '');
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => router.back()}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.white} />
              </Pressable>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>PRO ALERTS</Text>
                <Text style={{ color: Colors.white, fontSize: 20, fontWeight: '800' }}>Notifications</Text>
                {unreadCount > 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{unreadCount} unread</Text>
                ) : null}
              </View>
            </View>
            {unreadCount > 0 ? (
              <Pressable onPress={() => markAllRead()} style={{ backgroundColor: Colors.amber.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: Colors.navy.primary, fontSize: 12, fontWeight: '800' }}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={{ flex: 1, marginTop: -16 }}>
        {notifications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.navy.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-off-outline" size={32} color={Colors.text.secondary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.text.primary }}>All caught up</Text>
            <Text style={{ color: Colors.text.secondary, fontSize: 13 }}>You'll be alerted when a new job is available</Text>
          </View>
        ) : (
          <FlashList
            data={notifications}
            estimatedItemSize={88}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingTop: 24 }}
            renderItem={({ item, index }) => (
              <NotificationItem
                item={item}
                index={index}
                onPress={() => {
                  if (!item.is_read) markRead(item.id);
                  if (item.deep_link) router.push(item.deep_link as any);
                  else if (item.job_id) router.push(`/(pro)/request/${item.job_id}` as any);
                }}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
