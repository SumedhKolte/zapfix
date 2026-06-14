import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { createNotification } from '@/services/notifications';

const fmt = (d: Date) =>
  d.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmtShort = (d: Date) =>
  d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * Global popup that surfaces a Pro's proposed alternative time the moment the
 * customer opens the app (or signs in), rather than relying on them tapping
 * into the job. Rendered once in the customer layout. The in-job banner on the
 * job-detail screen still exists, so we suppress this modal there to avoid
 * showing the same prompt twice.
 */
export const RescheduleProposalModal = () => {
  const { theme: Theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { profile } = useAuth();
  const { jobsQuery, acceptCounterOffer, declineCounterOffer } = useJob({ customerId: profile?.id });

  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  // Proposals the user dismissed/acted on this session — keyed by job+time so a
  // brand-new proposal on the same job still shows.
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const onJobDetail = pathname?.includes('/job/');

  const pending = useMemo(() => {
    const list = jobsQuery.data ?? [];
    for (const job of list) {
      if (job.status === 'cancelled' || job.status === 'completed') continue;
      const counter = (job.ai_raw_response as any)?.counter_offer;
      if (counter && !counter.accepted_at && !counter.declined_at && counter.proposed_at) {
        const key = `${job.id}:${counter.proposed_at}`;
        if (handled.has(key)) continue;
        return { job, counter, key };
      }
    }
    return null;
  }, [jobsQuery.data, handled]);

  const visible = Boolean(pending) && !onJobDetail;
  if (!pending) return null;

  const { job, counter, key } = pending;
  const proposedAt = new Date(counter.proposed_at);
  const scheduling = (job.ai_raw_response as any)?.scheduling;
  const originalAt = scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null;

  const markHandled = () => setHandled((prev) => new Set(prev).add(key));

  const handleAccept = async () => {
    setBusy('accept');
    try {
      await acceptCounterOffer({ jobId: job.id });
      if (counter.pro_id) {
        await createNotification({
          userId: counter.pro_id,
          title: 'Customer accepted your time',
          body: `${profile?.full_name ?? 'Your customer'} accepted the new slot. Get ready.`,
          jobId: job.id,
          deepLink: `/(pro)/dashboard`,
        });
      }
      markHandled();
      toast.success('Booking confirmed', `Set for ${fmtShort(proposedAt)}.`);
    } catch {
      toast.error('Could not accept', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    setBusy('decline');
    try {
      // Notify BEFORE declining — declining clears pro_id, after which the
      // notification authorization for the proposing pro no longer holds.
      if (counter.pro_id) {
        await createNotification({
          userId: counter.pro_id,
          title: 'Customer declined the new time',
          body: "They want to stick with their original slot — we'll search for another Pro.",
          jobId: job.id,
        });
      }
      await declineCounterOffer({ jobId: job.id });
      markHandled();
      toast.info('Kept your original time', "We'll find another Pro for your slot.");
    } catch {
      toast.error('Could not decline', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const viewDetails = () => {
    markHandled();
    router.push(`/(customer)/job/${job.id}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={markHandled} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(10,15,30,0.55)', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            backgroundColor: Theme.creamCard,
            borderRadius: 24,
            padding: 22,
            gap: 16,
            shadowColor: Theme.navy,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.amber, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="time" size={28} color={Theme.navy} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textDark, textAlign: 'center' }}>
              Your Pro proposed a new time
            </Text>
            <Text style={{ fontSize: 13, color: Theme.textMid, textAlign: 'center' }} numberOfLines={2}>
              {job.ai_diagnosis ?? 'Your booking'}
            </Text>
          </View>

          {/* Times */}
          <View style={{ gap: 10 }}>
            {originalAt ? (
              <View style={{ backgroundColor: Theme.cream, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Theme.border }}>
                <Text style={{ fontSize: 11, color: Theme.textLight, fontWeight: '700' }}>YOUR ORIGINAL SLOT</Text>
                <Text style={{ fontSize: 14, color: Theme.textMid, textDecorationLine: 'line-through' }}>
                  {fmtShort(originalAt)}
                </Text>
              </View>
            ) : null}
            <View style={{ backgroundColor: Theme.amberLight, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Theme.amber + '55' }}>
              <Text style={{ fontSize: 11, color: Theme.navy, fontWeight: '800' }}>PRO PROPOSES</Text>
              <Text style={{ fontSize: 18, color: Theme.navy, fontWeight: '800' }}>{fmt(proposedAt)}</Text>
            </View>
            {counter.message ? (
              <View style={{ backgroundColor: 'rgba(15,32,87,0.06)', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 13, color: Theme.textDark, fontStyle: 'italic' }}>"{counter.message}"</Text>
              </View>
            ) : null}
          </View>

          {/* Actions */}
          <View style={{ gap: 9 }}>
            <Button onPress={handleAccept} loading={busy === 'accept'} disabled={busy !== null}>
              Accept new time
            </Button>
            <Button variant="secondary" onPress={handleDecline} loading={busy === 'decline'} disabled={busy !== null}>
              Keep my original time
            </Button>
            <Pressable onPress={viewDetails} disabled={busy !== null} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: Theme.textMid, fontSize: 13, fontWeight: '700' }}>View job details</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
