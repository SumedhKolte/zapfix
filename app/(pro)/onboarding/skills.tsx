import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getCatalogSkills } from '@/services/catalog';
import { createProSkills } from '@/services/pro-skills';
import { useProfile } from '@/hooks/useProfile';

export default function Skills() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');
  const skillsQuery = useQuery({ queryKey: ['catalog-skills'], queryFn: getCatalogSkills });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

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
    if (!profile?.id) {
      return;
    }

    await createProSkills(
      selectedSkills.map((skillId) => ({
        pro_id: profile.id,
        skill_id: skillId
      }))
    );

    await updateProDetails({ id: profile.id, data: { onboarding_step: 'interview' } });
    router.replace('/(pro)/onboarding/interview');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 2 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>
          What are your skills?
        </Text>
        <Text style={{ color: Colors.midGray }}>
          Select all that apply. This determines which jobs you receive.
        </Text>

        {Object.entries(grouped).map(([trade, skills]) => (
          <Card key={trade}>
            <Text style={{ fontWeight: '700', color: Colors.navy.primary, marginBottom: 8 }}>{trade}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((skill) => {
                const selected = selectedSkills.includes(skill.id);
                return (
                  <Button
                    key={skill.id}
                    variant={selected ? 'primary' : 'secondary'}
                    onPress={() => toggleSkill(skill.id)}
                  >
                    {skill.skill_name}
                  </Button>
                );
              })}
            </View>
          </Card>
        ))}

        <Button onPress={handleContinue} disabled={selectedSkills.length === 0}>
          Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
