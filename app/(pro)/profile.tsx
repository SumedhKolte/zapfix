import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProProfile() {
  const { profile, signOut } = useAuth();
  const { proDetailsQuery } = useProfile(profile?.id ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>{profile?.full_name}</Text>
          <Text style={{ color: Colors.midGray }}>{profile?.phone_number}</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>KYC Status</Text>
          <Text style={{ color: Colors.midGray }}>{proDetailsQuery.data?.kyc_status ?? 'pending'}</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Skill Score</Text>
          <Text style={{ color: Colors.midGray }}>{proDetailsQuery.data?.ai_skill_score ?? 0}</Text>
          <Button variant="secondary">Retake Interview</Button>
        </Card>

        <Button variant="danger" onPress={() => signOut()}>
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
