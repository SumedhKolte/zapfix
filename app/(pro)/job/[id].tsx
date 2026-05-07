import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useJob } from '@/hooks/useJob';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProJobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobQuery } = useJob({ jobId: id });
  const job = jobQuery.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>Job Details</Text>
          <Text style={{ color: Colors.midGray }}>#{job?.id?.slice(-6)}</Text>
        </View>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Customer Problem</Text>
          <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{job?.customer_problem_text}</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>AI Diagnosis</Text>
          <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{job?.ai_diagnosis}</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Before You Go</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>Bring required part</Text>
        </Card>

        <Button onPress={() => router.push('/(pro)/job/active')}>I'm on my way</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
