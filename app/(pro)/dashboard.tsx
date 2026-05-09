import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { OnlineToggle } from '@/components/pro/OnlineToggle';
import { JobRequestCard } from '@/components/pro/JobRequestCard';
import { updateAvailability } from '@/services/availability';

function StatCard({ label, value, icon }: any) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: Colors.amber.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={14} color={Colors.amber.primary} />
        </View>
        <Text style={{ fontSize: 12, color: Colors.midGray, flex: 1 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>{value}</Text>
    </View>
  );
}

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
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
            Welcome back
          </Text>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
            {profile?.full_name?.split(' ')[0] ?? 'Professional'}
          </Text>
          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: Colors.amber.primary + '20',
              borderRadius: 10,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="star" size={14} color={Colors.amber.primary} />
            <Text style={{ color: Colors.amber.primary, fontSize: 12, fontWeight: '600' }}>
              Skill Score: {proDetailsQuery.data?.ai_skill_score ?? 0}/100
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, gap: 20, paddingTop: 20 }}>
          {/* Online Toggle */}
          <OnlineToggle isOnline={isOnline} onToggle={toggleOnline} />

          {/* Stats */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary }}>Today's Stats</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Jobs" value="0" icon="briefcase-outline" />
              <StatCard label="Earned" value="₹0" icon="wallet-outline" />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Rating" value="4.8" icon="star" />
              <StatCard label="Status" value={isOnline ? 'Online' : 'Offline'} icon="checkmark-circle-outline" />
            </View>
          </View>

          {/* Job Request */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 }}>
              New Job Request
            </Text>
            <JobRequestCard
              fault="Capacitor Failure"
              distanceKm={2.3}
              earnings={120000}
              hasPart
              onAccept={() => {}}
              onDecline={() => {}}
              onExpire={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
