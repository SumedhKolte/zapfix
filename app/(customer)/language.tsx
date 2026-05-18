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

const STORAGE_KEY = 'settings.language';

type LanguageOption = { value: string; label: string; description: string };

export default function Language() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setLanguage(value);
    });
  }, []);

  const options: LanguageOption[] = [
    { value: 'en', label: 'English', description: 'Default app language' },
    { value: 'hi', label: 'Hindi', description: 'Hindi interface (coming soon)' },
    { value: 'kn', label: 'Kannada', description: 'Kannada interface (coming soon)' },
  ];

  const handleSelect = async (value: string) => {
    setLanguage(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  };

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
              Language
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 12 }}>
          {options.map((option) => {
            const selected = option.value === language;
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
            Language preference is saved for future app updates.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
