import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { OnboardingScaffold, advanceOnboarding } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { getCatalogSkills } from '@/services/catalog';
import { createProSkills } from '@/services/pro-skills';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';

const TRADE_ICONS: Record<string, string> = {
  electrical: 'flash',
  electrician: 'flash',
  ac: 'thermometer',
  hvac: 'thermometer',
  cooling: 'snow',
  refrigeration: 'snow',
  plumbing: 'water',
  plumber: 'water',
  appliance: 'cube',
  appliances: 'cube',
  washing: 'shirt',
  refrigerator: 'snow',
  general: 'construct',
};

const tradeIcon = (trade: string): any => TRADE_ICONS[trade.toLowerCase().trim()] ?? 'construct';

export default function Category() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');
  const skillsQuery = useQuery({ queryKey: ['catalog-skills'], queryFn: getCatalogSkills });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const proSkillsQuery = useQuery({
    queryKey: ['pro-skills', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_skills')
        .select('skill_id')
        .eq('pro_id', profile?.id ?? '');
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const initial = (proSkillsQuery.data ?? []).map((r: any) => r.skill_id as string);
    if (initial.length > 0 && selectedSkills.length === 0) setSelectedSkills(initial);
  }, [proSkillsQuery.data]);

  const grouped = useMemo(() => {
    const skills = skillsQuery.data ?? [];
    return skills.reduce<Record<string, typeof skills>>((acc, skill) => {
      acc[skill.trade] = acc[skill.trade] ? [...acc[skill.trade], skill] : [skill];
      return acc;
    }, {});
  }, [skillsQuery.data]);

  const toggleSkill = (skillId: string) =>
    setSelectedSkills((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]));

  const handleContinue = async () => {
    if (!profile?.id) return;
    if (selectedSkills.length === 0) {
      Alert.alert('Pick at least one category', 'Choose the trades you can handle to receive matching jobs.');
      return;
    }
    setSaving(true);
    try {
      await createProSkills(selectedSkills.map((skillId) => ({ pro_id: profile.id, skill_id: skillId })));
      await updateProDetails({
        id: profile.id,
        data: { onboarding_step: advanceOnboarding(proDetailsQuery.data?.onboarding_step, 'category') },
      });
      if (isEdit) router.back();
      else router.replace('/(pro)/onboarding/assessment');
    } catch (err) {
      console.error('Could not save categories', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalAvailable = (skillsQuery.data ?? []).length;
  const isLoading = skillsQuery.isLoading || proSkillsQuery.isLoading;

  return (
    <OnboardingScaffold
      stepKey="category"
      isEdit={isEdit}
      eyebrow="YOUR CATEGORIES"
      title="What can you fix?"
      subtitle="Pick everything you can confidently take on — we'll match you with jobs that fit. You can update this any time."
      footer={
        <Button onPress={handleContinue} loading={saving} disabled={saving || selectedSkills.length === 0}>
          {selectedSkills.length === 0 ? 'Pick at least one category' : `Continue (${selectedSkills.length} selected)`}
        </Button>
      }
    >
      {isLoading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <Text style={{ color: colors.text.muted }}>Loading categories…</Text>
        </View>
      ) : totalAvailable === 0 ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.amber.light, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="alert-circle" size={26} color={colors.amber.dark} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text.primary }}>Catalog is empty</Text>
          <Text style={{ fontSize: 12, color: colors.text.muted, textAlign: 'center' }}>
            Ask your admin to add entries to catalog_skills so you can pick what you can fix.
          </Text>
        </View>
      ) : (
        Object.entries(grouped).map(([trade, skills]) => (
          <View key={trade} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.navy.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tradeIcon(trade)} size={17} color={colors.amber.dark} />
              </View>
              <Text style={{ fontWeight: '800', color: colors.text.primary, fontSize: 15, flex: 1, textTransform: 'capitalize' }}>{trade}</Text>
              <Text style={{ fontSize: 11, color: colors.text.muted, fontWeight: '700' }}>
                {skills.filter((s) => selectedSkills.includes(s.id)).length} / {skills.length}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((skill) => {
                const selected = selectedSkills.includes(skill.id);
                return (
                  <Pressable
                    key={skill.id}
                    onPress={() => toggleSkill(skill.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: selected ? colors.navy.primary : colors.surfaceAlt,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.navy.primary : colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {selected ? <Ionicons name="checkmark" size={13} color={colors.amber.primary} /> : null}
                    <Text style={{ color: selected ? colors.white : colors.text.primary, fontWeight: '700', fontSize: 13 }}>
                      {skill.skill_name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </OnboardingScaffold>
  );
}
