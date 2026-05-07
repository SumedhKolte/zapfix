import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';

export default function Notifications() {
  const { profile } = useAuth();
  const { notificationsQuery, markAllRead } = useNotifications(profile?.id ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <View style={{ padding: 24, gap: 12, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>Notifications</Text>
          <Button variant="secondary" onPress={() => markAllRead()}>
            Mark all read
          </Button>
        </View>

        <FlashList
          data={notificationsQuery.data ?? []}
          estimatedItemSize={72}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 12,
                borderLeftWidth: 3,
                borderLeftColor: item.is_read ? Colors.border : Colors.amber.primary,
                marginBottom: 8
              }}
            >
              <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>{item.title}</Text>
              <Text style={{ color: Colors.darkGray }}>{item.body}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
