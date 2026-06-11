import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { useJob } from '@/hooks/useJob';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProJobDetail() {
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobQuery } = useJob({ jobId: id });
  const job = jobQuery.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text.primary }}>Job Details</Text>
          <Text style={{ color: Colors.midGray }}>#{job?.id?.slice(-6)}</Text>
        </View>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.text.primary }}>Customer Problem</Text>
          <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{job?.customer_problem_text}</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.text.primary }}>AI Diagnosis</Text>
          <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{job?.ai_diagnosis}</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.text.primary }}>Before You Go</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>Bring required part</Text>
        </Card>

        <Button onPress={() => router.push('/(pro)/job/active')}>I'm on my way</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
