import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WarrantyCard } from '@/components/customer/WarrantyCard';
import { formatCurrency } from '@/utils/formatCurrency';

export default function JobComplete() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${Colors.success}1A`,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="checkmark" size={36} color={Colors.success} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>Job Complete!</Text>
        </View>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Repair Summary</Text>
          <Text style={{ color: Colors.darkGray, marginTop: 6 }}>Capacitor Failure</Text>
          <Text style={{ color: Colors.midGray, marginTop: 4 }}>Final cost: {formatCurrency(120000)}</Text>
          <Button variant="secondary">Download Invoice</Button>
        </Card>

        <WarrantyCard appliance="AC Repair" validUntil={new Date().toISOString()} />

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>How was your Pro?</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>Tap to rate</Text>
          <Button>Submit Rating</Button>
        </Card>

        <Button onPress={() => router.replace('/(customer)/home')}>Book Another Service</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
