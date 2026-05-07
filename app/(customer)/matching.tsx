import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { triggerMatching } from '@/services/matching';
import { useRealtime } from '@/hooks/useRealtime';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

export default function Matching() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { subscribeToJob } = useRealtime();
  const [timeoutVisible, setTimeoutVisible] = useState(false);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    triggerMatching(jobId);

    const unsubscribe = subscribeToJob(jobId, (payload) => {
      const next = payload as { new?: { status?: string; id?: string } };
      if (next.new?.status === 'matched' && next.new.id) {
        router.replace(`/(customer)/job/${next.new.id}`);
      }
    });

    const timeout = setTimeout(() => {
      setTimeoutVisible(true);
    }, 3 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [jobId, router, subscribeToJob]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.navy.primary, padding: 24 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <View>
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 2,
              borderColor: Colors.amber.primary,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </View>
        <Text style={{ color: Colors.white, fontSize: 24, fontWeight: '700' }}>Finding your Pro</Text>
        <Text style={{ color: Colors.midGray, textAlign: 'center' }}>
          Zapfix is matching you with the best professional for this exact problem
        </Text>
      </View>

      <BottomSheet visible={timeoutVisible} onClose={() => setTimeoutVisible(false)}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>
          No pros available right now
        </Text>
        <Text style={{ marginTop: 8, color: Colors.midGray }}>
          We'll notify you when one becomes available.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button onPress={() => router.replace('/(customer)/home')}>Okay</Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
