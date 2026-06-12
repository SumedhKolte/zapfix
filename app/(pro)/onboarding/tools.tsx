import { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { OnboardingCard, OnboardingScaffold, advanceOnboarding } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
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

export default function Tools() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');
  const [toolkitUri, setToolkitUri] = useState<string | null>(null);
  const [verification, setVerification] = useState<ToolkitResponse | null>(null);
  const [busy, setBusy] = useState(false);

  // Restore the saved toolkit verdict on return (the photo itself isn't stored —
  // retaking re-runs the AI check). Lets the pro continue without re-uploading.
  const saved = proDetailsQuery.data;
  const hasSavedTools = saved?.tools_verified != null;
  useEffect(() => {
    if (hasSavedTools && verification === null) {
      setVerification({
        verified_tools: [],
        missing_tools: saved?.tools_missing ?? [],
        overall_verdict: Boolean(saved?.tools_verified),
      });
    }
  }, [hasSavedTools]);

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
        Alert.alert('Permission needed', source === 'camera' ? 'Camera permission is needed to photograph your toolkit.' : 'Photo permission is needed to pick your toolkit photo.');
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const storagePath = await uploadKycDocument(profile.id, uri, 'toolkit.jpg');
      setToolkitUri(uri);
      const response = await verifyToolkit({ storage_path: storagePath, expected_tools: expectedTools, trades: proSkillsQuery.data ?? [] });
      const parsed = parseToolkit(response.data);
      setVerification(parsed.success ? parsed.data : { verified_tools: [], missing_tools: expectedTools, overall_verdict: false });
    } catch (err) {
      console.error('Toolkit verification failed', err);
      Alert.alert('AI check failed', 'Your photo was saved, but AI could not verify it right now. You can continue and support may review it later.');
      setVerification({ verified_tools: [], missing_tools: expectedTools, overall_verdict: false });
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async () => {
    if (!profile?.id) return;
    setBusy(true);
    try {
      await updateProDetails({
        id: profile.id,
        data: {
          tools_verified: verification?.overall_verdict ?? false,
          tools_missing: verification?.missing_tools ?? expectedTools,
          onboarding_step: advanceOnboarding(proDetailsQuery.data?.onboarding_step, 'tools'),
        },
      });
      if (isEdit) router.back();
      else router.replace('/(pro)/onboarding/trust');
    } catch (err) {
      console.error('Could not save toolkit step', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScaffold
      stepKey="tools"
      isEdit={isEdit}
      eyebrow="YOUR TOOLKIT"
      title="Show us your tools"
      subtitle="A photo of your toolkit helps customers trust you and lets us match you to jobs you're equipped for."
      footer={
        <Button onPress={handleContinue} loading={busy} disabled={busy || (!toolkitUri && !hasSavedTools)}>Continue</Button>
      }
    >
      <OnboardingCard>
        <Text style={{ color: colors.text.muted, fontSize: 12 }}>Expected tools: {expectedTools.join(', ')}</Text>
        <Button variant="secondary" loading={busy} disabled={busy} onPress={() => captureToolkit('camera')}>
          {toolkitUri || hasSavedTools ? 'Retake toolkit photo' : 'Photograph toolkit'}
        </Button>
        <Button variant="ghost" disabled={busy} onPress={() => captureToolkit('library')}>Choose from gallery</Button>
        {toolkitUri ? <Image source={{ uri: toolkitUri }} style={{ height: 180, borderRadius: 12, marginTop: 4 }} resizeMode="cover" /> : null}
        {verification ? (
          <View style={{ marginTop: 4, gap: 6 }}>
            <Text style={{ fontWeight: '700', color: verification.overall_verdict ? colors.success : colors.warning }}>
              {verification.overall_verdict ? 'AI verified your toolkit' : 'AI marked some tools for review'}
            </Text>
            {verification.verified_tools.map((tool) => (
              <Text key={tool} style={{ color: colors.success, fontSize: 13 }}>✓ {tool}</Text>
            ))}
            {verification.missing_tools.map((tool) => (
              <Text key={tool} style={{ color: colors.warning, fontSize: 13 }}>Needs review: {tool}</Text>
            ))}
          </View>
        ) : null}
      </OnboardingCard>
    </OnboardingScaffold>
  );
}
