import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
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

const tradeIcon = (trade: string): any => {
  return TRADE_ICONS[trade.toLowerCase().trim()] ?? 'construct';
};

export default function Skills() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');
  const skillsQuery = useQuery({ queryKey: ['catalog-skills'], queryFn: getCatalogSkills });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load already-saved skills so the user keeps their selection on revisit.
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
    if (initial.length > 0 && selectedSkills.length === 0) {
      setSelectedSkills(initial);
    }
  }, [proSkillsQuery.data]);

  const grouped = useMemo(() => {
    const skills = skillsQuery.data ?? [];
    return skills.reduce<Record<string, typeof skills>>((acc, skill) => {
      acc[skill.trade] = acc[skill.trade] ? [...acc[skill.trade], skill] : [skill];
      return acc;
    }, {});
  }, [skillsQuery.data]);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleContinue = async () => {
    if (!profile?.id) return;
    if (selectedSkills.length === 0) {
      Alert.alert('Pick at least one skill', 'Choose the trades you can handle to receive matching jobs.');
      return;
    }

    setSaving(true);
    try {
      await createProSkills(
        selectedSkills.map((skillId) => ({
          pro_id: profile.id,
          skill_id: skillId,
        }))
      );
      await updateProDetails({ id: profile.id, data: { onboarding_step: 'interview' } });
      router.replace('/(pro)/onboarding/interview');
    } catch (err) {
      console.error('Could not save skills', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalAvailable = (skillsQuery.data ?? []).length;
  const isLoading = skillsQuery.isLoading || proSkillsQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' }}>Step 2 of 5</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>YOUR SKILLS</Text>
          <Text style={{ color: Colors.white, fontSize: 24, fontWeight: '800', marginTop: 4 }}>
            What can you fix?
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6, lineHeight: 19 }}>
            We'll match you with jobs that fit. Pick everything you can confidently take on — you can update this any time.
          </Text>
          <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.amber.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="checkmark" size={12} color={Colors.navy.primary} />
              <Text style={{ color: Colors.navy.primary, fontSize: 11, fontWeight: '800' }}>{selectedSkills.length} selected</Text>
            </View>
            {totalAvailable > 0 ? (
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>{totalAvailable} available</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 16 }}>
          {isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: Colors.midGray }}>Loading skills…</Text>
            </View>
          ) : totalAvailable === 0 ? (
            <View style={{ backgroundColor: Colors.white, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 8 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.amber.light, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="alert-circle" size={26} color={Colors.amber.dark} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.text.primary }}>Skills catalog is empty</Text>
              <Text style={{ fontSize: 12, color: Colors.midGray, textAlign: 'center' }}>
                Ask your admin to add entries to <Text style={{ fontWeight: '700' }}>catalog_skills</Text> so you can pick what you can fix.
              </Text>
            </View>
          ) : (
            Object.entries(grouped).map(([trade, skills]) => (
              <View key={trade} style={{ backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.navy.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.navy.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={tradeIcon(trade)} size={17} color={Colors.navy.primary} />
                  </View>
                  <Text style={{ fontWeight: '800', color: Colors.text.primary, fontSize: 15, flex: 1, textTransform: 'capitalize' }}>{trade}</Text>
                  <Text style={{ fontSize: 11, color: Colors.midGray, fontWeight: '700' }}>
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
                          backgroundColor: selected ? Colors.navy.primary : Colors.lightGray,
                          borderWidth: 1.5,
                          borderColor: selected ? Colors.navy.primary : Colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {selected ? (
                          <Ionicons name="checkmark" size={13} color={Colors.amber.primary} />
                        ) : null}
                        <Text style={{ color: selected ? Colors.white : Colors.text.primary, fontWeight: '700', fontSize: 13 }}>
                          {skill.skill_name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          backgroundColor: Colors.white,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <Button onPress={handleContinue} loading={saving} disabled={saving || selectedSkills.length === 0}>
          {selectedSkills.length === 0 ? 'Pick at least one skill' : `Continue (${selectedSkills.length} selected)`}
        </Button>
      </View>
    </SafeAreaView>
  );
}
