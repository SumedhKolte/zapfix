import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ActiveJob() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>Active Job</Text>
        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Navigation</Text>
          <Button variant="secondary">I've Arrived</Button>
        </Card>
        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Before Photo</Text>
          <Button variant="secondary">Upload Before Photo</Button>
        </Card>
        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>After Photo</Text>
          <Button variant="secondary">Upload After Photo</Button>
        </Card>
        <Button>Complete Job</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
