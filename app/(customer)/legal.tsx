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
          <Pressable
            onPress={() => router.push('/(customer)/privacy-policy')}
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: Theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
                Privacy Policy
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Theme.textLight} />
            </View>
            <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 8, lineHeight: 18 }}>
              Zapfix collects only the data needed to deliver service requests, provide support,
              and improve reliability. We never sell your personal information.
            </Text>
            <Text style={{ fontSize: 12, color: Theme.amber, marginTop: 8, fontWeight: '700' }}>
              Read the full Privacy Policy
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(customer)/terms-conditions')}
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: Theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
                Terms & Conditions
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Theme.textLight} />
            </View>
            <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 8, lineHeight: 18 }}>
              By using Zapfix, you agree to provide accurate information and to follow service
              scheduling guidelines. Service availability may vary by region.
            </Text>
            <Text style={{ fontSize: 12, color: Theme.amber, marginTop: 8, fontWeight: '700' }}>
              Read the full Terms & Conditions
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
