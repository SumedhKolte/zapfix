import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
};

const STORAGE_KEY = 'settings.appearance';

type AppearanceMode = 'system' | 'light' | 'dark';

export default function Appearance() {
  const router = useRouter();
  const [mode, setMode] = useState<AppearanceMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setMode(value);
      }
    });
  }, []);

  const handleSelect = async (value: AppearanceMode) => {
    setMode(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const options: { value: AppearanceMode; label: string; description: string }[] = [
    { value: 'system', label: 'System', description: 'Match your device settings' },
    { value: 'light', label: 'Light', description: 'Light background and dark text' },
    { value: 'dark', label: 'Dark', description: 'Dark background and light text' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800' }}>
              Appearance
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 12 }}>
          {options.map((option) => {
            const selected = option.value === mode;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={{
                  backgroundColor: Theme.creamCard,
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: selected ? Theme.amber : Theme.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: selected ? Theme.amber : Theme.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected ? (
                    <Ionicons name="checkmark" size={16} color={Theme.navy} />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
                    {option.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: Theme.textLight, marginTop: 2 }}>
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <Text style={{ color: Theme.textLight, fontSize: 12, marginTop: 6 }}>
            Appearance preference is saved and will apply when theme support is enabled.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
