import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/hooks/useTheme';

const STORAGE_KEY = 'settings.language';

export default function ProLanguage() {
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value) setLanguage(value); });
  }, []);

  const options = [
    { value: 'en', label: 'English', description: 'Default app language' },
    { value: 'hi', label: 'Hindi', description: 'Hindi interface (coming soon)' },
    { value: 'kn', label: 'Kannada', description: 'Kannada interface (coming soon)' },
    { value: 'ta', label: 'Tamil', description: 'Tamil interface (coming soon)' },
  ];

  const handleSelect = async (value: string) => {
    setLanguage(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Language</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 12 }}>
          {options.map((option) => {
            const selected = option.value === language;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={{ backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: selected ? Colors.amber.primary : Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: selected ? Colors.amber.primary : Colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  {selected ? <Ionicons name="checkmark" size={16} color={Colors.navy.primary} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary }}>{option.label}</Text>
                  <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 2 }}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
