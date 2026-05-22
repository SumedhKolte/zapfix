import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function ProLoginSecurity() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const handlePhoneChange = () => {
    Alert.alert(
      'Change phone number',
      'To change your phone number, contact your Zapfix Pro success manager or support at pros@zapfix.in.'
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Login & Security</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 16 }}>
          <View style={{ backgroundColor: Colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text.primary }}>Phone number</Text>
            <Text style={{ color: Colors.text.secondary, marginTop: 6, fontSize: 14 }}>{profile?.phone_number ?? 'Not available'}</Text>
            <Text style={{ color: Colors.midGray, fontSize: 12, marginTop: 6 }}>
              Used to sign in and verify your Pro account.
            </Text>
            <Pressable onPress={handlePhoneChange} style={{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.navy.primary + '10', alignSelf: 'flex-start' }}>
              <Text style={{ color: Colors.navy.primary, fontSize: 12, fontWeight: '700' }}>Request change</Text>
            </Pressable>
          </View>

          <View style={{ backgroundColor: Colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text.primary }}>Bank account on file</Text>
            <Text style={{ color: Colors.text.secondary, marginTop: 6, fontSize: 13 }}>
              Your payouts are deposited into the account verified during onboarding. Contact pros@zapfix.in to update.
            </Text>
          </View>

          <View style={{ backgroundColor: Colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text.primary }}>Security tips</Text>
            <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
              Never share OTPs. Zapfix will never ask for your password, PIN, or bank details over phone or email.
            </Text>
          </View>

          <Button variant="danger" onPress={handleSignOut}>Sign Out</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
