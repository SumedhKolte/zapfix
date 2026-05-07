import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ApplianceCard } from '@/components/customer/ApplianceCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Health() {
  const { profile } = useAuth();
  const { appliancesQuery } = useProfile(profile?.id ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>Home Health</Text>
          <Ionicons name="add" size={24} color={Colors.navy.primary} />
        </View>

        <Card>
          <Text style={{ fontSize: 12, color: Colors.midGray }}>AI Health Score</Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.navy.primary }}>82%</Text>
          <Text style={{ fontSize: 12, color: Colors.midGray }}>Based on {appliancesQuery.data?.length ?? 0} appliances</Text>
        </Card>

        <View style={{ gap: 12 }}>
          {appliancesQuery.data?.map((appliance) => (
            <ApplianceCard
              key={appliance.id}
              type={appliance.type}
              brand={appliance.brand}
              model={appliance.model}
              healthScore={appliance.health_score ?? 100}
              lastServicedAt={appliance.last_serviced_at}
              nextServiceDue={appliance.next_service_due}
            />
          ))}
        </View>

        <Button>Add Appliance</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
