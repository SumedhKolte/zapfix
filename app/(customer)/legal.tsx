import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export default function Legal() {
  const { theme: Theme } = useTheme();
  const router = useRouter();

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
              Legal
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
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
              Privacy Policy
            </Text>
            <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 8, lineHeight: 18 }}>
              Zapfix collects only the data needed to deliver service requests, provide support,
              and improve reliability. We never sell your personal information.
            </Text>
            <Text style={{ fontSize: 12, color: Theme.textLight, marginTop: 8 }}>
              For full details, contact legal@zapfix.in.
            </Text>
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
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
              Terms of Service
            </Text>
            <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 8, lineHeight: 18 }}>
              By using Zapfix, you agree to provide accurate information and to follow service
              scheduling guidelines. Service availability may vary by region.
            </Text>
            <Text style={{ fontSize: 12, color: Theme.textLight, marginTop: 8 }}>
              For full terms, contact support@zapfix.in.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
