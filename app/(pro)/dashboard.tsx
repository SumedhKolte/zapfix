import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { OnlineToggle } from '@/components/pro/OnlineToggle';
import { JobRequestCard } from '@/components/pro/JobRequestCard';
import { Card } from '@/components/ui/Card';
import { updateAvailability } from '@/services/availability';

export default function Dashboard() {
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(false);
  }, []);

  const toggleOnline = async () => {
    if (!profile?.id) {
      return;
    }

    if (!isOnline) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await updateProDetails({
        id: profile.id,
        data: { current_location: { type: 'Point', coordinates: [current.coords.longitude, current.coords.latitude] } }
      });
      await updateAvailability({
        pro_id: profile.id,
        is_online: true,
        last_ping: new Date().toISOString()
      });
    } else {
      await updateAvailability({
        pro_id: profile.id,
        is_online: false,
        last_ping: new Date().toISOString()
      });
    }

    setIsOnline((prev) => !prev);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ backgroundColor: Colors.navy.primary, padding: 24, borderRadius: 16 }}>
          <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>
            Hello, {profile?.full_name?.split(' ')[0] ?? 'Pro'}
          </Text>
          <Text style={{ color: Colors.amber.primary, marginTop: 6 }}>
            Score: {proDetailsQuery.data?.ai_skill_score ?? 0}
          </Text>
        </View>

        <OnlineToggle isOnline={isOnline} onToggle={toggleOnline} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card>
            <Text style={{ color: Colors.midGray }}>Jobs today</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>0</Text>
          </Card>
          <Card>
            <Text style={{ color: Colors.midGray }}>Earned</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>₹0</Text>
          </Card>
          <Card>
            <Text style={{ color: Colors.midGray }}>Rating</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>4.8</Text>
          </Card>
        </View>

        <JobRequestCard
          fault="Capacitor Failure"
          distanceKm={2.3}
          earnings={120000}
          hasPart
          onAccept={() => {}}
          onDecline={() => {}}
          onExpire={() => {}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
