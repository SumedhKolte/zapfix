import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Profile() {
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>{profile?.full_name}</Text>
          <Text style={{ color: Colors.midGray }}>{profile?.phone_number}</Text>
          <Button variant="secondary">Edit</Button>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Saved Addresses</Text>
          <Text style={{ color: Colors.midGray }}>Manage your addresses</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Settings</Text>
          <Text style={{ color: Colors.midGray }}>Push notifications · Location</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>About Zapfix</Text>
          <Text style={{ color: Colors.midGray }}>Version 1.0.0</Text>
        </Card>

        <Button variant="danger" onPress={() => signOut()}>
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
