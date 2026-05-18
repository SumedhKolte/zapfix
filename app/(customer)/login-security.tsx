import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  error: '#C23232',
};

export default function LoginSecurity() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const handlePhoneChange = () => {
    Alert.alert(
      'Change phone number',
      'To change your phone number, contact support at support@zapfix.in.'
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800' }}>
              Login & Security
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 16 }}>
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: Theme.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textDark }}>
              Phone number
            </Text>
            <Text style={{ color: Theme.textMid, marginTop: 6, fontSize: 14 }}>
              {profile?.phone_number ?? 'Not available'}
            </Text>
            <Text style={{ color: Theme.textLight, fontSize: 12, marginTop: 6 }}>
              Your phone number is used to sign in and verify your account.
            </Text>
            <Pressable
              onPress={handlePhoneChange}
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: Theme.navy + '10',
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: Theme.navy, fontSize: 12, fontWeight: '700' }}>
                Request change
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: Theme.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textDark }}>
              Security tips
            </Text>
            <Text style={{ color: Theme.textMid, fontSize: 12, marginTop: 6 }}>
              Do not share OTPs with anyone. Zapfix support will never ask for your OTP.
            </Text>
          </View>

          <Button variant="danger" onPress={handleSignOut}>
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
