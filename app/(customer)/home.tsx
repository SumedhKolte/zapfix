import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useJob } from '@/hooks/useJob';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WarrantyCard } from '@/components/customer/WarrantyCard';
import { AIBadge } from '@/components/ui/AIBadge';
import { StatusPill } from '@/components/ui/StatusPill';

const categories = ['AC Repair', 'Electrical', 'Plumbing', 'Washing Machine', 'Refrigerator'];

export default function CustomerHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { areaName } = useLocation();
  const { jobsQuery } = useJob({ customerId: profile?.id });

  const activeJob = useMemo(() => {
    return jobsQuery.data?.find(
      (job) => job.status !== 'completed' && job.status !== 'cancelled'
    );
  }, [jobsQuery.data]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ backgroundColor: Colors.navy.primary, padding: 24, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: Colors.white, fontSize: 20, fontWeight: '600' }}>
              Good morning, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
            </Text>
            <Ionicons
              name="notifications"
              size={22}
              color={Colors.amber.primary}
              onPress={() => router.push('/(customer)/notifications')}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location" size={16} color={Colors.white} />
            <Text style={{ color: Colors.white, fontSize: 14 }}>{areaName || 'Fetching location...'}</Text>
          </View>
        </View>

        {activeJob ? (
          <View style={{ paddingHorizontal: 24, marginTop: -20 }}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Job in progress</Text>
                {activeJob.status ? <StatusPill status={activeJob.status} /> : null}
              </View>
              <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{activeJob.ai_diagnosis}</Text>
              <Button onPress={() => router.push(`/(customer)/job/${activeJob.id}`)}>
                Track Job
              </Button>
            </Card>
          </View>
        ) : null}

        <View style={{ padding: 24, gap: 16 }}>
          <Card>
            <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.navy.primary }}>
              What's the problem?
            </Text>
            <Text style={{ color: Colors.midGray, marginTop: 6 }}>
              Describe it, show it, or just tell us
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button
                variant="secondary"
                onPress={() => router.push('/(customer)/diagnose')}
                accessibilityLabel="Take photo"
              >
                Take Photo
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/(customer)/diagnose')}
                accessibilityLabel="Upload media"
              >
                Upload
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/(customer)/diagnose')}
                accessibilityLabel="Describe issue"
              >
                Describe
              </Button>
            </View>
          </Card>

          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary, marginBottom: 8 }}>
              Quick Categories
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { category } })}
                >
                  {category}
                </Button>
              ))}
            </ScrollView>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>
                Active Warranties
              </Text>
              <Text style={{ color: Colors.blue.primary }}>See all</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <WarrantyCard appliance="Refrigerator" validUntil={new Date().toISOString()} />
              <WarrantyCard appliance="AC" validUntil={new Date().toISOString()} />
            </ScrollView>
          </View>

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>
                Your Home Health
              </Text>
              <AIBadge />
            </View>
            <Text style={{ marginTop: 8, color: Colors.darkGray }}>
              4 appliances registered · Avg health score 82
            </Text>
            <Button onPress={() => router.push('/(customer)/health')}>View Report</Button>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
