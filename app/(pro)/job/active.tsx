import { useMemo } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { createNotification } from '@/services/notifications';

function Card({ children, title, icon }: any) {
  return (
    <View style={{ backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {icon && (
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.amber.light, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={16} color={Colors.amber.primary} />
          </View>
        )}
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ActiveJob() {
  const router = useRouter();
  const { profile } = useAuth();
  const { jobsQuery, proStartTransit, proMarkArrived, updateJobStatus } = useJob({ proId: profile?.id });

  const active = useMemo(() => {
    return (jobsQuery.data ?? []).find((j) =>
      j.status === 'matched' || j.status === 'in_transit' || j.status === 'arrived' || j.status === 'working'
    );
  }, [jobsQuery.data]);

  const handleOnMyWay = async () => {
    if (!active?.id) return;
    try {
      await proStartTransit({ jobId: active.id });
      if (active.customer_id) {
        await createNotification({
          userId: active.customer_id,
          title: 'Your Pro is on the way',
          body: `${profile?.full_name ?? 'Your Pro'} just started heading to you.`,
          jobId: active.id,
          deepLink: `/(customer)/job/${active.id}`,
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Could not update', 'Please try again.');
    }
  };

  const handleArrived = async () => {
    if (!active?.id) return;
    try {
      await proMarkArrived({ jobId: active.id });
      if (active.customer_id) {
        await createNotification({
          userId: active.customer_id,
          title: 'Your Pro has arrived',
          body: 'They\'re at the location. Please make sure you\'re reachable.',
          jobId: active.id,
          deepLink: `/(customer)/job/${active.id}`,
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Could not update', 'Please try again.');
    }
  };

  const handleStartWork = async () => {
    if (!active?.id) return;
    try {
      await updateJobStatus({ jobId: active.id, data: { status: 'working' } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async () => {
    if (!active?.id) return;
    Alert.alert('Mark complete?', 'The customer will be asked to confirm and rate.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            await updateJobStatus({ jobId: active.id, data: { status: 'completed', completed_at: new Date().toISOString() } });
            if (active.customer_id) {
              await createNotification({
                userId: active.customer_id,
                title: 'Job completed',
                body: 'Please rate your Pro and approve the invoice.',
                jobId: active.id,
                deepLink: `/(customer)/job/${active.id}`,
              });
            }
            router.replace('/(pro)/dashboard');
          } catch (err) {
            console.error(err);
            Alert.alert('Could not complete', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>Current Job</Text>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
            {active?.ai_diagnosis ?? 'No active job'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>
            {active ? `Status: ${active.status}` : 'Accept a request to get started'}
          </Text>
        </LinearGradient>

        {!active ? (
          <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
            <Text style={{ color: Colors.text.secondary, fontSize: 14, marginTop: 16, textAlign: 'center' }}>
              You have no active job right now. Go to Dashboard to accept an incoming request.
            </Text>
            <View style={{ marginTop: 16, width: '100%' }}>
              <Button onPress={() => router.replace('/(pro)/dashboard')}>Back to Dashboard</Button>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, gap: 16, paddingTop: 20 }}>
            <Card title="Job Action" icon="navigate-outline">
              {active.status === 'matched' ? (
                <>
                  <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
                    Let the customer know you're starting your trip.
                  </Text>
                  <Button onPress={handleOnMyWay}>I'm on my way</Button>
                </>
              ) : active.status === 'in_transit' ? (
                <>
                  <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
                    Tap when you've reached the customer's location.
                  </Text>
                  <Button onPress={handleArrived}>I've Arrived</Button>
                </>
              ) : active.status === 'arrived' ? (
                <>
                  <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
                    Ready to start? The customer will see the status change.
                  </Text>
                  <Button onPress={handleStartWork}>Start Repair</Button>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
                    Repair in progress. Complete when done.
                  </Text>
                  <Button onPress={handleComplete}>Mark as Complete</Button>
                </>
              )}
            </Card>

            <Card title="Before Photo" icon="camera-outline">
              <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
                Take a photo of the issue before starting work.
              </Text>
              <Button variant="secondary">Upload Before Photo</Button>
            </Card>

            <Card title="After Photo" icon="checkmark-circle-outline">
              <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
                Take a photo of the completed work.
              </Text>
              <Button variant="secondary">Upload After Photo</Button>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
