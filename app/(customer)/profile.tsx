import { useRef, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';

function AnimatedRow({ children, delay = 0 }: any) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, tension: 90, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}

function SettingsRow({ icon, label, sublabel, onPress, iconBg, chevron = true, danger = false, badge }: any) {
  const { theme: Theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingVertical: 14,
          backgroundColor: danger ? Theme.errorLight : Theme.creamCard,
          borderBottomWidth: 1, borderBottomColor: Theme.border,
          gap: 14,
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: iconBg ?? (danger ? Theme.error + '20' : Theme.navy + '10'),
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={18} color={danger ? Theme.error : Theme.textDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: danger ? Theme.error : Theme.textDark }}>
            {label}
          </Text>
          {sublabel ? (
            <Text style={{ fontSize: 12, color: Theme.textLight, marginTop: 1 }}>{sublabel}</Text>
          ) : null}
        </View>
        {badge ? (
          <View style={{
            backgroundColor: Theme.amber, borderRadius: 8,
            paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.navy }}>{badge}</Text>
          </View>
        ) : null}
        {chevron ? (
          <Ionicons name="chevron-forward" size={16} color={danger ? Theme.error + '80' : Theme.textLight} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { theme: Theme } = useTheme();
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: Theme.textMid,
      letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 6,
    }}>
      {title.toUpperCase()}
    </Text>
  );
}

function Card({ children, style }: any) {
  const { theme: Theme } = useTheme();
  return (
    <View style={{
      backgroundColor: Theme.creamCard, borderRadius: 18,
      overflow: 'hidden', borderWidth: 1, borderColor: Theme.border,
      shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
      ...style,
    }}>
      {children}
    </View>
  );
}

export default function Profile() {
  const { theme: Theme } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { jobsQuery } = useJob({ customerId: profile?.id });
  const [signingOut, setSigningOut] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const completedCount = (jobsQuery.data ?? []).filter(j => j.status === 'completed').length;
  const zapPoints      = completedCount * 100 + (completedCount >= 5 ? 250 : 0) + (completedCount >= 3 ? 150 : 0);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return (jobsQuery.data ?? [])
      .filter((job) => {
        if (job.status === 'completed' || job.status === 'cancelled') return false;
        const scheduledAt = (job.ai_raw_response as any)?.scheduling?.scheduled_at;
        if (!scheduledAt) return false;
        return new Date(scheduledAt).getTime() > now - 60 * 60 * 1000;
      })
      .sort((a, b) => {
        const aT = new Date((a.ai_raw_response as any)?.scheduling?.scheduled_at ?? 0).getTime();
        const bT = new Date((b.ai_raw_response as any)?.scheduling?.scheduled_at ?? 0).getTime();
        return aT - bT;
      })
      .slice(0, 5);
  }, [jobsQuery.data]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            setSigningOut(false);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Header */}
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>
              ACCOUNT
            </Text>
            <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800', marginTop: 3 }}>
              Profile
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -28, paddingHorizontal: 20 }}>

          {/* Profile Card */}
          <AnimatedRow delay={60}>
            <Card style={{ marginBottom: 0 }}>
              <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <View style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: Theme.navy,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 3, borderColor: Theme.amber,
                }}>
                  <Text style={{ color: Theme.amber, fontSize: 22, fontWeight: '800' }}>{initials}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: Theme.textDark }}>
                    {profile?.full_name ?? 'Your Name'}
                  </Text>
                  <Text style={{ color: Theme.textMid, fontSize: 13, marginTop: 2 }}>
                    {profile?.phone_number ?? '+91 XXXXX XXXXX'}
                  </Text>
                  {/* Points badge */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    marginTop: 6, backgroundColor: Theme.amber + '20',
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}>
                    <Ionicons name="flash" size={11} color={Theme.amber} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.textDark }}>
                      {zapPoints.toLocaleString('en-IN')} ZP
                    </Text>
                  </View>
                </View>

                <Pressable
                  hitSlop={10}
                  onPress={() => router.push('/(customer)/edit-profile')}
                  style={{
                    height: 40, paddingHorizontal: 14, borderRadius: 14,
                    backgroundColor: Theme.navy,
                    alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'row', gap: 6,
                    borderWidth: 1.5, borderColor: Theme.amber + '80',
                  }}
                >
                  <Ionicons name="pencil" size={14} color={Theme.white} />
                  <Text style={{ color: Theme.white, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                </Pressable>
              </View>

              {/* Stats bar */}
              <View style={{
                flexDirection: 'row', borderTopWidth: 1, borderTopColor: Theme.border,
              }}>
                {[
                  { label: 'Services',  value: (jobsQuery.data ?? []).length.toString() },
                  { label: 'Completed', value: completedCount.toString() },
                  { label: 'Zap Points', value: zapPoints.toLocaleString('en-IN') },
                ].map((s, i) => (
                  <View key={s.label} style={{
                    flex: 1, alignItems: 'center', paddingVertical: 12,
                    borderRightWidth: i < 2 ? 1 : 0, borderRightColor: Theme.border,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textDark }}>{s.value}</Text>
                    <Text style={{ fontSize: 11, color: Theme.textLight, marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </AnimatedRow>
        </View>

        {/* Upcoming Bookings */}
        <AnimatedRow delay={90}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.textMid, letterSpacing: 1.2 }}>
              UPCOMING BOOKINGS
            </Text>
            {upcomingBookings.length > 0 ? (
              <Pressable onPress={() => router.push('/(customer)/jobs')}>
                <Text style={{ color: Theme.blue, fontSize: 12, fontWeight: '700' }}>See all</Text>
              </Pressable>
            ) : null}
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={{ paddingHorizontal: 20 }}>
              <Pressable
                onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { resetKey: Date.now().toString() } })}
                style={{
                  backgroundColor: Theme.creamCard, borderRadius: 18, padding: 18,
                  borderWidth: 1, borderColor: Theme.border, borderStyle: 'dashed',
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.amber + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="calendar-outline" size={22} color={Theme.textDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>No upcoming bookings</Text>
                  <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }}>
                    Diagnose a problem and pick a slot to book a Pro.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Theme.textLight} />
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingTop: 4 }}
            >
              {upcomingBookings.map((job) => {
                const scheduledAt = new Date((job.ai_raw_response as any).scheduling.scheduled_at);
                const counter = (job.ai_raw_response as any)?.counter_offer;
                const hasOpenCounter = counter && !counter.accepted_at && !counter.declined_at;

                return (
                  <Pressable
                    key={job.id}
                    onPress={() => router.push(`/(customer)/job/${job.id}`)}
                    style={{
                      backgroundColor: Theme.creamCard, borderRadius: 16, padding: 14, width: 230,
                      borderWidth: 1, borderColor: hasOpenCounter ? Theme.amber : Theme.border,
                      shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: hasOpenCounter ? Theme.amber + '20' : Theme.navy + '10', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="construct" size={17} color={Theme.textDark} />
                      </View>
                      {job.status ? <StatusPill status={job.status} /> : null}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark, marginTop: 10 }} numberOfLines={1}>
                      {job.ai_diagnosis ?? 'Service'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <Ionicons name="calendar-outline" size={12} color={Theme.textLight} />
                      <Text style={{ fontSize: 11, color: Theme.textMid, fontWeight: '600' }}>
                        {scheduledAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <Ionicons name="time-outline" size={12} color={Theme.textLight} />
                      <Text style={{ fontSize: 11, color: Theme.textMid, fontWeight: '600' }}>
                        {scheduledAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    {hasOpenCounter ? (
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Theme.border, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="time" size={12} color={Theme.amber} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.amber }}>NEW TIME PROPOSED</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </AnimatedRow>

        {/* Account Section */}
        <AnimatedRow delay={120}>
          <SectionHeader title="Account" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow
              icon="receipt"
              label="My Orders"
              sublabel="Track active and past jobs"
              onPress={() => router.push('/(customer)/jobs')}
            />
            <SettingsRow
              icon="document-text"
              label="Booking Receipts"
              sublabel="View receipts for every booking"
              onPress={() => router.push('/(customer)/receipts')}
            />
            <SettingsRow
              icon="gift"
              label="Zap Rewards"
              sublabel="Points · Achievements · Offers"
              onPress={() => router.push('/(customer)/rewards')}
              iconBg={Theme.amber + '20'}
              badge={zapPoints > 0 ? `${zapPoints} ZP` : undefined}
            />
            <SettingsRow
              icon="notifications"
              label="Notifications"
              sublabel="Push notifications · Reminders"
              onPress={() => router.push('/(customer)/notifications')}
            />
            <SettingsRow
              icon="location"
              label="Saved Addresses"
              sublabel="Manage your service locations"
              onPress={() => router.push('/(customer)/addresses')}
            />
            <SettingsRow
              icon="shield-checkmark"
              label="Login &amp; Security"
              sublabel="Password · Two-factor auth"
              onPress={() => router.push('/(customer)/login-security')}
            />
          </Card>
        </AnimatedRow>

        {/* Preferences */}
        <AnimatedRow delay={180}>
          <SectionHeader title="Preferences" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow
              icon="contrast"
              label="Appearance"
              sublabel="Light · Dark · System"
              onPress={() => router.push('/(customer)/appearance')}
            />
            <SettingsRow
              icon="language"
              label="Language"
              sublabel="English"
              onPress={() => router.push('/(customer)/language')}
            />
          </Card>
        </AnimatedRow>

        {/* Support */}
        <AnimatedRow delay={240}>
          <SectionHeader title="Support" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow
              icon="chatbubble-ellipses"
              label="Feedback"
              sublabel="Share your thoughts"
              onPress={() =>
                Alert.alert('Feedback', 'Email us at hello@zapfix.in — we read every message.')
              }
            />
            <SettingsRow
              icon="help-circle"
              label="Help &amp; Support"
              sublabel="FAQs · Contact us"
              onPress={() =>
                Alert.alert('Help & Support', 'Chat support is available Mon–Sat, 9am–8pm IST.\n\nEmail: support@zapfix.in')
              }
            />
            <SettingsRow
              icon="document-text"
              label="Legal"
              sublabel="Privacy · Terms of service"
              onPress={() => router.push('/(customer)/legal')}
            />
            <SettingsRow
              icon="information-circle"
              label="About Zapfix"
              sublabel="Version 1.0.0"
              onPress={() =>
                Alert.alert('Zapfix', 'Version 1.0.0\n\nIndia\'s smartest home repair platform powered by AI.\n\n© 2025 Zapfix Technologies')
              }
            />
          </Card>
        </AnimatedRow>

        {/* Sign Out */}
        <AnimatedRow delay={300}>
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Button
              variant="danger"
              onPress={handleSignOut}
              loading={signingOut}
              disabled={signingOut}
              leftIcon={<Ionicons name="log-out-outline" size={20} color={Theme.white} />}
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </View>
        </AnimatedRow>

      </ScrollView>
    </SafeAreaView>
  );
}
