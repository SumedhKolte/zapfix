import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { createNotification } from '@/services/notifications';
import { formatCostEstimate, formatCurrency } from '@/utils/formatCurrency';

const buildSuggestionSlots = (anchor: Date): Date[] => {
  const out: Date[] = [];
  const base = new Date(anchor.getTime());
  base.setMinutes(0, 0, 0);
  for (const delta of [-2, -1, 1, 2, 3]) {
    const d = new Date(base.getTime() + delta * 60 * 60 * 1000);
    // Only suggest 8am–8pm windows.
    if (d.getHours() >= 8 && d.getHours() <= 20) {
      out.push(d);
    }
  }
  return out;
};

export default function ProRequestDetail() {
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { jobQuery, proAcceptJob, proDeclineJob, proProposeAltTime } = useJob({ jobId: id });

  const job = jobQuery.data;
  const scheduling = (job?.ai_raw_response as any)?.scheduling;
  const scheduledAt = scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null;
  const scheduledLabel = scheduledAt
    ? scheduledAt.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'No time set';

  const suggestions = useMemo(() => (scheduledAt ? buildSuggestionSlots(scheduledAt) : []), [scheduledAt?.getTime()]);
  const [proposed, setProposed] = useState<Date | null>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<'accept' | 'decline' | 'propose' | null>(null);

  const customerProblem = (job?.ai_raw_response as any)?.customer_description ?? job?.customer_problem_text;

  const handleAccept = async () => {
    if (!job?.id || !profile?.id) return;
    setBusy('accept');
    try {
      await proAcceptJob({ jobId: job.id, proId: profile.id });
      if (job.customer_id) {
        await createNotification({
          userId: job.customer_id,
          title: 'A Pro accepted your booking',
          body: `${profile.full_name ?? 'Your Pro'} confirmed your slot${scheduledLabel ? ` for ${scheduledLabel}` : ''}.`,
          jobId: job.id,
          deepLink: `/(customer)/job/${job.id}`,
        });
      }
      Alert.alert('Job accepted', 'The customer has been notified.');
      router.replace('/(pro)/dashboard');
    } catch (err) {
      console.error(err);
      Alert.alert('Could not accept', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    if (!job?.id || !profile?.id) return;
    Alert.alert('Decline this job?', 'It will go to another nearby pro.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setBusy('decline');
          try {
            await proDeclineJob({ jobId: job.id, proId: profile.id });
            if (job.customer_id) {
              await createNotification({
                userId: job.customer_id,
                title: 'Still searching for a Pro',
                body: 'A nearby Pro was unavailable, but we are looking for another match for you.',
                jobId: job.id,
                deepLink: `/(customer)/job/${job.id}`,
              });
            }
            router.replace('/(pro)/dashboard');
          } catch (err) {
            console.error(err);
            Alert.alert('Could not decline', 'Please try again.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const handlePropose = async () => {
    if (!job?.id || !profile?.id || !proposed) {
      Alert.alert('Pick a time', 'Please select an alternative time first.');
      return;
    }
    setBusy('propose');
    try {
      await proProposeAltTime({ jobId: job.id, proId: profile.id, proposedAt: proposed.toISOString(), message: message.trim() || undefined });
      if (job.customer_id) {
        await createNotification({
          userId: job.customer_id,
          title: 'Pro proposed a different time',
          body: `${profile.full_name ?? 'Your Pro'} suggests ${proposed.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. Tap to accept or decline.`,
          jobId: job.id,
          deepLink: `/(customer)/job/${job.id}`,
        });
      }
      Alert.alert('Counter-offer sent', 'The customer can accept or decline your time.');
      router.replace('/(pro)/dashboard');
    } catch (err) {
      console.error(err);
      Alert.alert('Could not send', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.midGray }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => {
                // canGoBack() guards against "GO_BACK was not handled" when
                // the screen was opened directly (push notification tap, deep
                // link, etc.) and the navigation stack is empty.
                if (router.canGoBack()) router.back();
                else router.replace('/(pro)/dashboard');
              }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>JOB REQUEST</Text>
              <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
                {job.ai_diagnosis ?? 'Repair'}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.amber.primary }}>
              <Text style={{ color: Colors.navy.primary, fontSize: 11, fontWeight: '800' }}>NEW</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
          {/* Schedule */}
          <View style={{ backgroundColor: Colors.amber.light, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.amber.primary + '40' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="calendar" size={18} color={Colors.amber.dark} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.amber.dark, letterSpacing: 0.5 }}>CUSTOMER REQUESTED</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text.primary }}>{scheduledLabel}</Text>
          </View>

          {/* Diagnosis */}
          <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.midGray, letterSpacing: 0.5, marginBottom: 6 }}>AI DIAGNOSIS</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text.primary }}>{job.ai_diagnosis ?? '—'}</Text>
            {job.ai_confidence ? (
              <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 4 }}>{Math.round(job.ai_confidence * 100)}% confidence</Text>
            ) : null}
            {customerProblem ? (
              <>
                <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 12 }} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.midGray, letterSpacing: 0.5, marginBottom: 6 }}>CUSTOMER NOTE</Text>
                <Text style={{ fontSize: 13, color: Colors.darkGray, lineHeight: 18 }}>{customerProblem}</Text>
              </>
            ) : null}
            {scheduling?.note ? (
              <>
                <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 12 }} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.midGray, letterSpacing: 0.5, marginBottom: 6 }}>BOOKING NOTE</Text>
                <Text style={{ fontSize: 13, color: Colors.darkGray, lineHeight: 18 }}>{scheduling.note}</Text>
              </>
            ) : null}
          </View>

          {/* Estimated payout */}
          {job.est_cost_min && job.est_cost_max ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ fontSize: 11, color: Colors.midGray, fontWeight: '700', letterSpacing: 0.5 }}>EST. JOB VALUE</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text.primary, marginTop: 4 }}>
                  {formatCostEstimate(job.est_cost_min, job.est_cost_max) ?? formatCurrency(job.est_cost_min ?? 0)}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: Colors.amber.primary + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.amber.primary + '50' }}>
                <Text style={{ fontSize: 11, color: Colors.amber.dark, fontWeight: '700', letterSpacing: 0.5 }}>YOUR PAYOUT (75%)</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.amber.dark, marginTop: 4 }}>
                  ~{formatCurrency(Math.round(job.est_cost_max * 0.75))}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Propose alt time card */}
          {showPropose ? (
            <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text.primary }}>Propose a different time</Text>
                <Pressable onPress={() => { setShowPropose(false); setProposed(null); }} hitSlop={10}>
                  <Ionicons name="close" size={20} color={Colors.midGray} />
                </Pressable>
              </View>
              <Text style={{ fontSize: 12, color: Colors.midGray }}>Suggest an earlier or later slot — the customer can accept or decline.</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map((slot) => {
                  const isSelected = proposed?.getTime() === slot.getTime();
                  return (
                    <Pressable
                      key={slot.toISOString()}
                      onPress={() => setProposed(slot)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: isSelected ? Colors.amber.primary : Colors.lightGray,
                        borderWidth: 1.5, borderColor: isSelected ? Colors.amber.primary : Colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? Colors.navy.primary : Colors.darkGray }}>
                        {slot.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Optional message to the customer"
                placeholderTextColor={Colors.midGray}
                style={{ minHeight: 70, backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.darkGray, fontSize: 13, textAlignVertical: 'top' }}
              />

              <Button onPress={handlePropose} loading={busy === 'propose'} disabled={!proposed || busy !== null}>
                Send counter-offer
              </Button>
            </View>
          ) : null}

          {/* Action buttons */}
          {!showPropose ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Button onPress={handleAccept} loading={busy === 'accept'} disabled={busy !== null}>
                Accept this slot
              </Button>
              <Button variant="secondary" onPress={() => setShowPropose(true)} disabled={busy !== null}>
                Propose a different time
              </Button>
              <Button variant="danger" onPress={handleDecline} loading={busy === 'decline'} disabled={busy !== null}>
                Decline
              </Button>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
