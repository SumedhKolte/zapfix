import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

function LegalCard({ title, body, footer, onPress, linkText }: { title: string; body: string; footer?: string; onPress?: () => void; linkText?: string }) {
  const { colors: Colors } = useTheme();
  const Container: any = onPress ? Pressable : View;
  return (
    <Container onPress={onPress} style={{ backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary }}>{title}</Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.midGray} /> : null}
      </View>
      <Text style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 8, lineHeight: 18 }}>{body}</Text>
      {linkText ? <Text style={{ fontSize: 12, color: Colors.amber.dark, marginTop: 8, fontWeight: '700' }}>{linkText}</Text> : null}
      {footer ? <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 8 }}>{footer}</Text> : null}
    </Container>
  );
}

export default function ProLegal() {
  const { colors: Colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Legal</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 16 }}>
          <LegalCard
            title="Service Provider Agreement"
            body="As a Zapfix Pro, you operate as an independent service provider. You set your availability via the dashboard and can accept, decline, or propose alternative times for any booking."
            footer="For the full agreement, contact pros@zapfix.in."
          />
          <LegalCard
            title="Privacy Policy"
            body="We collect job-related location, KYC, and earnings data needed to operate the platform. We never sell your personal information."
            linkText="Read the full Privacy Policy"
            onPress={() => router.push('/(pro)/privacy-policy')}
          />
          <LegalCard
            title="Payment & Commission"
            body="Pros keep ~75% of each completed job. Payouts are settled via Razorpay to your verified bank account on the next business day after job completion."
          />
          <LegalCard
            title="Terms & Conditions"
            body="Maintain a professional standard, arrive on time for scheduled visits, and complete jobs as accepted. Repeated declines or no-shows may affect your standing."
            linkText="Read the full Terms & Conditions"
            onPress={() => router.push('/(pro)/terms-conditions')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
