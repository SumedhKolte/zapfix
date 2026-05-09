import { useRef, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

function AnimatedRow({ children, delay = 0 }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
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

function SettingsRow({ icon, label, sublabel, onPress, chevron = true, danger = false }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: danger ? '#FFF0F0' : Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          gap: 14,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: danger ? '#C23232' + '20' : Colors.navy.primary + '10',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={18} color={danger ? '#C23232' : Colors.navy.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: danger ? '#C23232' : Colors.text.primary }}>
            {label}
          </Text>
          {sublabel ? (
            <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 1 }}>{sublabel}</Text>
          ) : null}
        </View>
        {chevron ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={danger ? '#C23232' + '80' : Colors.midGray}
          />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.secondary,
        letterSpacing: 1.2,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 6,
      }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function Card({ children, style }: any) {
  return (
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

export default function ProProfile() {
  const { profile, signOut } = useAuth();
  const { proDetailsQuery } = useProfile(profile?.id ?? '');
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

  const kycStatus = proDetailsQuery.data?.kyc_status ?? 'pending';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient
            colors={[Colors.navy.primary, Colors.navy.light]}
            style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44 }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.4,
              }}
            >
              PROFESSIONAL ACCOUNT
            </Text>
            <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 3 }}>
              Profile
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -28, paddingHorizontal: 20 }}>
          {/* Profile Card */}
          <AnimatedRow delay={60}>
            <Card style={{ marginBottom: 0 }}>
              <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    backgroundColor: Colors.navy.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: Colors.amber.primary,
                  }}
                >
                  <Text style={{ color: Colors.amber.primary, fontSize: 22, fontWeight: '800' }}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text.primary }}>
                    {profile?.full_name ?? 'Professional'}
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13, marginTop: 2 }}>
                    {profile?.phone_number ?? '+91 XXXXX XXXXX'}
                  </Text>
                </View>
                <Pressable
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: Colors.navy.primary + '10',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pencil" size={16} color={Colors.navy.primary} />
                </Pressable>
              </View>
            </Card>
          </AnimatedRow>
        </View>

        <AnimatedRow delay={120}>
          <SectionHeader title="Professional Info" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow
              icon="shield-checkmark"
              label="KYC Status"
              sublabel={kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
              onPress={() => {}}
            />
            <SettingsRow
              icon="star"
              label="Skill Score"
              sublabel={`${proDetailsQuery.data?.ai_skill_score ?? 0} / 100`}
              onPress={() => {}}
            />
            <SettingsRow
              icon="hammer"
              label="Retake Interview"
              sublabel="Update your skills assessment"
              onPress={() => {}}
            />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={180}>
          <SectionHeader title="Account" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow
              icon="notifications"
              label="Notifications"
              sublabel="Push notifications · Reminders"
              onPress={() => {}}
            />
            <SettingsRow
              icon="shield-checkmark"
              label="Login & Security"
              sublabel="Password · Two-factor auth"
              onPress={() => {}}
            />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={240}>
          <SectionHeader title="Support" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow
              icon="chatbubble-ellipses"
              label="Feedback"
              sublabel="Share your thoughts"
              onPress={() => {}}
            />
            <SettingsRow
              icon="help-circle"
              label="Help & Support"
              sublabel="FAQs · Contact us"
              onPress={() => {}}
            />
            <SettingsRow
              icon="document-text"
              label="Legal"
              sublabel="Privacy · Terms of service"
              onPress={() => {}}
            />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={300}>
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              style={{
                backgroundColor: '#C23232' + '10',
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderWidth: 1.5,
                borderColor: '#C23232' + '30',
                opacity: signingOut ? 0.6 : 1,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#C23232" />
              <Text style={{ color: '#C23232', fontWeight: '700', fontSize: 15 }}>
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Text>
            </Pressable>
          </View>
        </AnimatedRow>
      </ScrollView>
    </SafeAreaView>
  );
}
