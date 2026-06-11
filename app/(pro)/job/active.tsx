import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { createNotification } from '@/services/notifications';

const CANCEL_REASONS = [
  'Emergency / health issue',
  'Vehicle breakdown',
  "Can't reach the address",
  'Missing tools or parts',
  'Schedule conflict',
];

function Card({ children, title, icon }: any) {
  const { colors: Colors } = useTheme();
  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 }}>
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
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { jobsQuery, proStartTransit, proMarkArrived, updateJobStatus, proCancelAcceptedJob } = useJob({ proId: profile?.id });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

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

  // Pros can bail out only while still en route (matched / in_transit). Once
  // they've arrived or started work, cancellation routes through dispute flow
  // instead — refusing to leave the customer mid-repair.
  const canCancelAfterAccept = active?.status === 'matched' || active?.status === 'in_transit';

  const handleSubmitCancel = async () => {
    if (!active?.id || !profile?.id) return;
    const reason = cancelNote.trim() ? `${cancelReason} — ${cancelNote.trim()}` : cancelReason;
    setCancelBusy(true);
    try {
      // Send the notification BEFORE freeing the job — RLS only lets us notify
      // the customer while we still are pro_id on the row. Once we cancel,
      // we're no longer a participant and the insert would be rejected.
      if (active.customer_id) {
        await createNotification({
          userId: active.customer_id,
          title: 'Your Pro had to cancel',
          body: `We're finding another Pro for you right now — no action needed.${reason ? `\nReason: ${reason}` : ''}`,
          jobId: active.id,
          deepLink: `/(customer)/job/${active.id}`,
        });
      }
      await proCancelAcceptedJob({ jobId: active.id, proId: profile.id, reason });
      setCancelOpen(false);
      Alert.alert('Cancelled', 'The customer has been notified and the job is back in the queue for another pro.');
      router.replace('/(pro)/dashboard');
    } catch (err) {
      console.error('proCancelAcceptedJob failed', err);
      Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCancelBusy(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
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

            {canCancelAfterAccept ? (
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: Colors.error + '40',
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.error }}>
                    Can't make it?
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: Colors.midGray }}>
                  Something came up? Release this job so another Pro can pick it up — the customer is notified instantly.
                </Text>
                <Button variant="danger" onPress={() => setCancelOpen(true)} disabled={cancelBusy}>
                  Cancel this job
                </Button>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal visible={cancelOpen} animationType="slide" transparent onRequestClose={() => setCancelOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10,15,30,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.surface, padding: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text.primary }}>Cancel this job?</Text>
              <Pressable onPress={() => setCancelOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Colors.midGray} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: Colors.midGray }}>
              We'll let the customer know and instantly send the request to another Pro. Repeated cancellations hurt your skill score.
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.darkGray, letterSpacing: 0.5, marginTop: 4 }}>REASON</Text>
            <View style={{ gap: 8 }}>
              {CANCEL_REASONS.map((r) => {
                const selected = cancelReason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setCancelReason(r)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingVertical: 10, paddingHorizontal: 12,
                      borderRadius: 12, borderWidth: 1.5,
                      borderColor: selected ? Colors.amber.primary : Colors.border,
                      backgroundColor: selected ? Colors.amber.primary + '15' : Colors.surface,
                    }}
                  >
                    <View style={{
                      width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                      borderColor: selected ? Colors.amber.primary : Colors.midGray,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.amber.primary }} />
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text.primary }}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={cancelNote}
              onChangeText={setCancelNote}
              multiline
              placeholder="Add detail for the customer (optional)"
              placeholderTextColor={Colors.midGray}
              style={{
                minHeight: 60, borderWidth: 1, borderColor: Colors.border,
                borderRadius: 12, padding: 12, color: Colors.darkGray,
                backgroundColor: Colors.bg, fontSize: 13, textAlignVertical: 'top',
              }}
            />

            <View style={{ gap: 8 }}>
              <Button variant="danger" loading={cancelBusy} disabled={cancelBusy} onPress={handleSubmitCancel}>
                Yes, cancel job
              </Button>
              <Button variant="secondary" onPress={() => setCancelOpen(false)} disabled={cancelBusy}>
                Keep the job
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
