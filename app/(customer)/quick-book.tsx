import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useJob } from '@/hooks/useJob';
import { findFixedIssue } from '@/constants/pricing';
import { formatCurrency } from '@/utils/formatCurrency';
import { collectPayment } from '@/services/payments';
import { removeCashfreeCallbacks } from '@/lib/cashfree';
import { createNotification } from '@/services/notifications';
import { supabase } from '@/lib/supabase';
import {
  geocodeAddress,
  normalizeGeoPoint,
  parseAddressText,
  reverseGeocode,
  toWktPoint,
} from '@/utils/geo';
import { useTheme } from '@/hooks/useTheme';

type DateOption = { date: Date; label: string; sublabel: string };

const buildDateOptions = (): DateOption[] => {
  const today = new Date();
  const out: DateOption[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const day = d.toLocaleDateString('en-IN', { day: 'numeric' });
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    out.push({
      date: d,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName,
      sublabel: `${day} ${month}`,
    });
  }
  return out;
};

const buildTimeSlots = (selectedDate: Date) => {
  const slots: { date: Date; label: string }[] = [];
  const isToday = (() => {
    const t = new Date();
    return t.toDateString() === selectedDate.toDateString();
  })();
  const startHour = isToday ? Math.max(8, new Date().getHours() + 1) : 8;
  for (let h = startHour; h <= 20; h++) {
    const d = new Date(selectedDate);
    d.setHours(h, 0, 0, 0);
    const hourLabel = ((h + 11) % 12) + 1;
    const suffix = h >= 12 ? 'PM' : 'AM';
    slots.push({ date: d, label: `${hourLabel}:00 ${suffix}` });
  }
  return slots;
};

const buildServiceAddressQuery = (address: { label?: string | null; address_text?: string | null }) => {
  const parsed = parseAddressText(address.address_text);
  return [address.label?.trim(), parsed.formatted || address.address_text?.trim()]
    .filter(Boolean)
    .join(', ');
};

export default function QuickBook() {
  const { theme: Theme } = useTheme();
  const router = useRouter();
  const { category, issueKey } = useLocalSearchParams<{ category?: string; issueKey?: string }>();
  const { profile } = useAuth();
  const { addressesQuery } = useProfile(profile?.id ?? '');
  const { createJob } = useJob({ customerId: profile?.id });

  const issueEntry = useMemo(() => (issueKey ? findFixedIssue(issueKey) : null), [issueKey]);
  const dates = useMemo(() => buildDateOptions(), []);

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]?.date ?? new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  const timeSlots = useMemo(() => buildTimeSlots(selectedDate), [selectedDate]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      removeCashfreeCallbacks();
    };
  }, []);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  const addressOptions = addressesQuery.data ?? [];
  const selectedAddressRow = useMemo(
    () => addressOptions.find((a) => a.id === selectedAddress) ?? null,
    [addressOptions, selectedAddress]
  );

  useEffect(() => {
    if (!selectedAddress) {
      const def = addressesQuery.data?.find((a) => a.is_default) ?? addressesQuery.data?.[0];
      if (def?.id) setSelectedAddress(def.id);
    }
  }, [addressesQuery.data, selectedAddress]);

  if (!issueEntry || !category) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <Ionicons name="alert-circle" size={36} color={Theme.amber} />
          <Text style={{ fontSize: 14, color: Theme.textMid, textAlign: 'center' }}>
            We couldn't find that service. Please pick an issue from your category again.
          </Text>
          <Button onPress={() => router.replace('/(customer)/home')}>Back to home</Button>
        </View>
      </SafeAreaView>
    );
  }

  const { issue } = issueEntry;

  const resolveJobLocation = async () => {
    if (!selectedAddressRow) return null;
    const cached = normalizeGeoPoint(selectedAddressRow.location);
    if (cached) return toWktPoint(cached);

    try {
      const coords = await geocodeAddress({
        label: selectedAddressRow.label,
        address_text:
          parseAddressText(selectedAddressRow.address_text).formatted ??
          selectedAddressRow.address_text,
      });
      const wkt = toWktPoint(coords);
      await supabase
        .from('customer_addresses')
        .update({ location: wkt })
        .eq('id', selectedAddressRow.id);
      return wkt;
    } catch {
      // Fall through to GPS prompt.
    }

    const useGps = await new Promise<boolean>((resolve) =>
      Alert.alert(
        "Couldn't find that address",
        "Use your phone's current location for this booking instead?",
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Use current location', onPress: () => resolve(true) },
        ]
      )
    );
    if (!useGps) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const point = { latitude: current.coords.latitude, longitude: current.coords.longitude };
    const formatted = await reverseGeocode(point).catch(() => null);
    const wkt = toWktPoint(point);

    await supabase
      .from('customer_addresses')
      .update({
        location: wkt,
        ...(formatted ? { address_text: formatted } : {}),
      })
      .eq('id', selectedAddressRow.id);

    return wkt;
  };

  const canBook = Boolean(selectedAddress && selectedTime && !submitting && profile?.id);

  const handlePayAndBook = async () => {
    if (!canBook || !profile?.id || !selectedTime) return;

    setSubmitting(true);
    try {
      const jobLocation = await resolveJobLocation();
      if (!jobLocation) {
        if (isMountedRef.current) {
          Alert.alert('Address missing location', 'Please edit your address to add a valid location.');
        }
        return;
      }

      if (!profile.phone_number) {
        if (isMountedRef.current) {
          Alert.alert('Phone number required', 'Please add your phone number to your profile before paying.');
        }
        return;
      }

      // 1. Collect payment via Cashfree BEFORE creating the job. We don't
      //    want a job sitting around with no money against it.
      const payment = await collectPayment({
        amountPaise: issue.pricePaise,
        customerPhone: profile.phone_number,
        customerName: profile.full_name ?? undefined,
        note: `Zapfix · ${category} · ${issue.title}`,
      });

      if (!isMountedRef.current) return;

      // 2. Create the job, attaching payment refs. Status 'searching' so the
      //    matching service picks it up immediately.
      const job = await createJob({
        customer_id: profile.id,
        status: 'searching',
        ai_diagnosis: issue.title,
        ai_confidence: 100,
        ai_raw_response: {
          fault_name: issue.title,
          fixed_price: true,
          fixed_issue_key: issue.key,
          category,
          scheduling: {
            scheduled_at: selectedTime.toISOString(),
            note: bookingNote.trim() || null,
            booked_at: new Date().toISOString(),
          },
          payment: {
            provider: 'cashfree',
            order_id: payment.orderId,
            payment_id: payment.paymentId,
            amount_paise: payment.amountPaise,
            paid_at: new Date().toISOString(),
          },
        } as any,
        est_cost_min: issue.pricePaise,
        est_cost_max: issue.pricePaise,
        escrow_amount: payment.amountPaise,
        address_id: selectedAddress!,
        job_location: jobLocation,
        // Cast: these columns are new in the migration; types are regenerated
        // after `supabase gen types`.
        cf_order_id: payment.orderId,
        cf_payment_id: payment.paymentId,
        payment_status: 'paid',
        paid_amount: payment.amountPaise,
        paid_at: new Date().toISOString(),
        fixed_issue_key: issue.key,
        service_category: category,
      } as any);

      if (!isMountedRef.current) return;

      await createNotification({
        userId: profile.id,
        title: 'Booking confirmed',
        body: `${issue.title} booked for ${selectedTime.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}. A Pro will be assigned shortly.`,
        jobId: job.id,
        deepLink: `/(customer)/receipt/${job.id}`,
      });

      router.replace({
        pathname: '/(customer)/receipt/[id]',
        params: { id: job.id, justBooked: '1' },
      });
    } catch (err) {
      console.error('Quick booking failed', err);
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        Alert.alert('Could not complete booking', message);
      }
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient colors={[Theme.navy, Theme.navyMid]} style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Pressable
                onPress={() => router.back()}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back" size={20} color={Theme.white} />
              </Pressable>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                  QUICK BOOK
                </Text>
                <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
                  {issue.title}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                FIXED PRICE
              </Text>
              <Text style={{ color: Theme.amber, fontSize: 26, fontWeight: '800', marginTop: 4 }}>
                {formatCurrency(issue.pricePaise)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
                {issue.description} · Paid upfront via Cashfree
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -16, paddingHorizontal: 20, gap: 14 }}>
          {/* Address picker */}
          <View style={{ backgroundColor: Theme.creamCard, borderRadius: 20, padding: 16, shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="location-outline" size={16} color={Theme.textDark} />
              <Text style={{ fontWeight: '800', color: Theme.textDark, fontSize: 14 }}>Service address</Text>
            </View>
            {addressOptions.length === 0 ? (
              <View style={{ paddingVertical: 6 }}>
                <Text style={{ color: Theme.textMid, fontSize: 13, marginBottom: 10 }}>
                  Add an address so the Pro knows where to come.
                </Text>
                <Button variant="secondary" size="sm" onPress={() => router.push('/(customer)/addresses')}>
                  Add address
                </Button>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {addressOptions.map((address) => {
                  const isSelected = selectedAddress === address.id;
                  return (
                    <Pressable
                      key={address.id}
                      onPress={() => setSelectedAddress(address.id)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
                        borderColor: isSelected ? Theme.navy : Theme.border,
                        backgroundColor: isSelected ? Theme.navy + '10' : Theme.cream,
                      }}
                    >
                      <Text style={{ color: isSelected ? Theme.navy : Theme.textMid, fontWeight: isSelected ? '700' : '500', fontSize: 13 }}>
                        {address.label ?? 'Address'}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => router.push('/(customer)/addresses')}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Theme.border, borderStyle: 'dashed' }}
                >
                  <Text style={{ color: Theme.textMid, fontWeight: '500', fontSize: 13 }}>+ Add new</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>

          {/* Date picker */}
          <View style={{ backgroundColor: Theme.creamCard, borderRadius: 20, padding: 16, shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="calendar-outline" size={16} color={Theme.textDark} />
              <Text style={{ fontWeight: '800', color: Theme.textDark, fontSize: 14 }}>Pick a day</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {dates.map((opt) => {
                const isSelected = opt.date.toDateString() === selectedDate.toDateString();
                return (
                  <Pressable
                    key={opt.date.toISOString()}
                    onPress={() => setSelectedDate(opt.date)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
                      backgroundColor: isSelected ? Theme.navy : Theme.cream,
                      borderWidth: 1.5, borderColor: isSelected ? Theme.navy : Theme.border,
                      alignItems: 'center', minWidth: 74,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? Theme.amber : Theme.textMid, letterSpacing: 0.5 }}>
                      {opt.label.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? Theme.white : Theme.textDark, marginTop: 4 }}>
                      {opt.sublabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Time picker */}
          <View style={{ backgroundColor: Theme.creamCard, borderRadius: 20, padding: 16, shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="time-outline" size={16} color={Theme.textDark} />
              <Text style={{ fontWeight: '800', color: Theme.textDark, fontSize: 14 }}>Pick a time</Text>
            </View>
            {timeSlots.length === 0 ? (
              <Text style={{ color: Theme.textMid, fontSize: 13 }}>
                No more slots today. Pick another date above.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime?.getTime() === slot.date.getTime();
                  return (
                    <Pressable
                      key={slot.date.toISOString()}
                      onPress={() => setSelectedTime(slot.date)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: isSelected ? Theme.amber : Theme.cream,
                        borderWidth: 1.5, borderColor: isSelected ? Theme.amber : Theme.border,
                        minWidth: 80, alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? Theme.navy : Theme.textDark }}>
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Note */}
          <View style={{ backgroundColor: Theme.creamCard, borderRadius: 20, padding: 16, shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>
              Note for the Pro <Text style={{ color: Theme.textLight, fontWeight: '500' }}>(optional)</Text>
            </Text>
            <TextInput
              value={bookingNote}
              onChangeText={setBookingNote}
              multiline
              textAlignVertical="top"
              placeholder="e.g. Gate code 1234. Please call when 5 min away."
              placeholderTextColor={Theme.textLight}
              style={{
                marginTop: 10, minHeight: 70, borderRadius: 12, borderWidth: 1, borderColor: Theme.border,
                backgroundColor: Theme.cream, padding: 12, color: Theme.textDark, fontSize: 13, lineHeight: 20,
              }}
            />
          </View>

          {/* Payment summary + CTA */}
          <View style={{ backgroundColor: Theme.amberLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Theme.amber + '40' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textMid }}>Amount to pay now</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: Theme.textDark }}>
                {formatCurrency(issue.pricePaise)}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: Theme.textMid, marginTop: 6, lineHeight: 16 }}>
              Refunded automatically if no Pro accepts within 24 hours.
            </Text>
          </View>

          <Button onPress={handlePayAndBook} loading={submitting} disabled={!canBook}>
            {!selectedAddress
              ? 'Add a service address'
              : !selectedTime
                ? 'Select a time slot'
                : `Pay ${formatCurrency(issue.pricePaise)} & confirm`}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
