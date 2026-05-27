import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadKycDocument } from '@/services/uploads';
import { verifyToolkit } from '@/lib/gemini';
import { parseToolkit } from '@/utils/ai/parseToolkit';
import { supabase } from '@/lib/supabase';
import type { ToolkitResponse } from '@/utils/ai/validators';

const TOOLKIT_BY_TRADE: Record<string, string[]> = {
  electrical: ['Line tester', 'Insulated screwdriver set', 'Multimeter', 'Insulation tape'],
  electrician: ['Line tester', 'Insulated screwdriver set', 'Multimeter', 'Insulation tape'],
  ac: ['Pressure gauge', 'Vacuum pump', 'Multimeter', 'Pipe cutter'],
  hvac: ['Pressure gauge', 'Vacuum pump', 'Multimeter', 'Pipe cutter'],
  refrigeration: ['Pressure gauge', 'Vacuum pump', 'Multimeter', 'Pipe cutter'],
  plumbing: ['Pipe wrench', 'Adjustable spanner', 'Plunger', 'Teflon tape'],
  plumber: ['Pipe wrench', 'Adjustable spanner', 'Plunger', 'Teflon tape'],
  appliance: ['Screwdriver set', 'Pliers', 'Multimeter', 'Cleaning brush'],
  appliances: ['Screwdriver set', 'Pliers', 'Multimeter', 'Cleaning brush'],
  general: ['Screwdriver set', 'Pliers', 'Measuring tape', 'Safety gloves'],
};

const expectedToolsForTrades = (trades: string[]) => {
  const tools = new Set<string>();
  const source = trades.length > 0 ? trades : ['general'];
  source.forEach((trade) => {
    (TOOLKIT_BY_TRADE[trade.toLowerCase().trim()] ?? TOOLKIT_BY_TRADE.general).forEach((tool) => tools.add(tool));
  });
  return Array.from(tools).slice(0, 8);
};

export default function Toolkit() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');
  const [toolkitUri, setToolkitUri] = useState<string | null>(null);
  const [verification, setVerification] = useState<ToolkitResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const proSkillsQuery = useQuery({
    queryKey: ['pro-skills-toolkit', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_skills')
        .select('catalog_skills:skill_id(trade)')
        .eq('pro_id', profile?.id ?? '');
      if (error) throw error;
      return (data ?? []).map((row: any) => String(row.catalog_skills?.trade ?? '')).filter(Boolean);
    },
  });

  const expectedTools = expectedToolsForTrades(proSkillsQuery.data ?? []);

  const captureToolkit = async (source: 'camera' | 'library') => {
    if (!profile?.id) return;
    setBusy(true);
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission needed', source === 'camera'
          ? 'Camera permission is needed to photograph your toolkit.'
          : 'Photo permission is needed to pick your toolkit photo.');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const storagePath = await uploadKycDocument(profile.id, uri, 'toolkit.jpg');
      setToolkitUri(uri);
      const response = await verifyToolkit({
        storage_path: storagePath,
        expected_tools: expectedTools,
        trades: proSkillsQuery.data ?? [],
      });
      const parsed = parseToolkit(response.data);
      setVerification(parsed.success ? parsed.data : {
        verified_tools: [],
        missing_tools: expectedTools,
        overall_verdict: false,
      });
    } catch (err) {
      console.error('Toolkit verification failed', err);
      Alert.alert('AI check failed', 'Your photo was saved, but AI could not verify it right now. You can continue and support may review it later.');
      setVerification({
        verified_tools: [],
        missing_tools: expectedTools,
        overall_verdict: false,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async () => {
    if (!profile?.id) {
      return;
    }
    setBusy(true);
    try {
      await updateProDetails({
        id: profile.id,
        data: {
          tools_verified: verification?.overall_verdict ?? false,
          tools_missing: verification?.missing_tools ?? expectedTools,
          onboarding_step: 'inventory'
        }
      });
      router.replace('/(pro)/onboarding/inventory');
    } catch (err) {
      console.error('Could not save toolkit step', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 4 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>Show us your toolkit</Text>
        <Text style={{ color: Colors.midGray }}>
          A photo of your tools helps customers trust you.
        </Text>

        <Card>
          <Text style={{ color: Colors.midGray, marginBottom: 10 }}>
            Expected tools: {expectedTools.join(', ')}
          </Text>
          <Button variant="secondary" loading={busy} disabled={busy} onPress={() => captureToolkit('camera')}>
            {toolkitUri ? 'Retake toolkit photo' : 'Photograph toolkit'}
          </Button>
          <Button variant="ghost" disabled={busy} onPress={() => captureToolkit('library')}>
            Choose from gallery
          </Button>
          {toolkitUri ? <Image source={{ uri: toolkitUri }} style={{ height: 180, borderRadius: 12, marginTop: 12 }} resizeMode="cover" /> : null}
          {verification ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <Text style={{ fontWeight: '700', color: verification.overall_verdict ? Colors.success : Colors.warning }}>
                {verification.overall_verdict ? 'AI verified your toolkit' : 'AI marked some tools for review'}
              </Text>
              {verification.verified_tools.map((tool) => (
                <Text key={tool} style={{ color: Colors.success }}>✓ {tool}</Text>
              ))}
              {verification.missing_tools.map((tool) => (
                <Text key={tool} style={{ color: Colors.warning }}>Needs review: {tool}</Text>
              ))}
            </View>
          ) : null}
        </Card>

        <Button onPress={handleContinue} loading={busy} disabled={busy || !toolkitUri}>
          Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
