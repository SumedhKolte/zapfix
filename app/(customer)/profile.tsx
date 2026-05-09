import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  error: '#C23232',
  errorLight: '#FFF0F0',
};

function AnimatedRow({ children, delay = 0 }: any) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, tension: 90, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}

function SettingsRow({ icon, label, sublabel, onPress, iconBg, chevron = true, danger = false }: any) {
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
          backgroundColor: iconBg || (danger ? Theme.error + '20' : Theme.navy + '10'),
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={18} color={danger ? Theme.error : Theme.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: danger ? Theme.error : Theme.textDark }}>
            {label}
          </Text>
          {sublabel ? (
            <Text style={{ fontSize: 12, color: Theme.textLight, marginTop: 1 }}>{sublabel}</Text>
          ) : null}
        </View>
        {chevron ? (
          <Ionicons name="chevron-forward" size={16} color={danger ? Theme.error + '80' : Theme.textLight} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: Theme.textMid,
      letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
    }}>
      {title.toUpperCase()}
    </Text>
  );
}

function Card({ children, style }: any) {
  return (
    <View style={{
      backgroundColor: Theme.creamCard, borderRadius: 18,
      overflow: 'hidden', borderWidth: 1, borderColor: Theme.border,
      ...style,
    }}>
      {children}
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

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
              Settings
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -28, paddingHorizontal: 20 }}>

          {/* Profile Card */}
          <AnimatedRow delay={60}>
            <Card style={{ marginBottom: 0 }}>
              <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{
                  width: 62, height: 62, borderRadius: 31,
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
                </View>
                <Pressable
                  hitSlop={10}
                  style={{
                    height: 40,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: Theme.navy,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    borderWidth: 1.5,
                    borderColor: Theme.amber + '80',
                  }}
                >
                  <Ionicons name="pencil" size={16} color={Theme.white} />
                  <Text style={{ color: Theme.white, fontSize: 12, fontWeight: '700' }}>
                    Edit
                  </Text>
                </Pressable>
              </View>
            </Card>
          </AnimatedRow>
        </View>

        <AnimatedRow delay={120}>
          <SectionHeader title="Account" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow icon="receipt"           label="My Orders"          sublabel="Track active and past jobs"     onPress={() => router.push('/(customer)/jobs')} />
            <SettingsRow icon="location"          label="Saved Addresses"    sublabel="Manage your service locations" onPress={() => {}} />
            <SettingsRow icon="notifications"     label="Notifications"      sublabel="Push notifications · Reminders" onPress={() => router.push('/(customer)/notifications')} />
            <SettingsRow icon="search"            label="Find a Pro"         sublabel="Matching and availability"     onPress={() => router.push('/(customer)/matching')} />
            <SettingsRow icon="shield-checkmark"  label="Login & Security"   sublabel="Password · Two-factor auth"    onPress={() => {}} />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={180}>
          <SectionHeader title="Preferences" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow icon="contrast"  label="Appearance" sublabel="Light · Dark · System" onPress={() => {}} />
            <SettingsRow icon="language"  label="Language"   sublabel="English"               onPress={() => {}} />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={240}>
          <SectionHeader title="Support" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow icon="chatbubble-ellipses" label="Feedback"       sublabel="Share your thoughts"      onPress={() => {}} />
            <SettingsRow icon="help-circle"         label="Help & Support" sublabel="FAQs · Contact us"        onPress={() => {}} />
            <SettingsRow icon="document-text"       label="Legal"          sublabel="Privacy · Terms of service" onPress={() => {}} />
            <SettingsRow icon="information-circle"  label="About Zapfix"   sublabel="Version 1.0.0"            onPress={() => {}} />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={300}>
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              style={{
                backgroundColor: Theme.error + '10',
                borderRadius: 16, paddingVertical: 16,
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                borderWidth: 1.5, borderColor: Theme.error + '30',
                opacity: signingOut ? 0.6 : 1,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={Theme.error} />
              <Text style={{ color: Theme.error, fontWeight: '700', fontSize: 15 }}>
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Text>
            </Pressable>
          </View>
        </AnimatedRow>

      </ScrollView>
    </SafeAreaView>
  );
}