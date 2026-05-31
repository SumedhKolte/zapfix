import { useMemo } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { getCategoryCatalog, type FixedIssue } from '@/constants/pricing';
import { formatCurrency } from '@/utils/formatCurrency';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
};

function IssueRow({ issue, onPress }: { issue: FixedIssue; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: Theme.creamCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: Theme.blueLight,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={issue.icon as any} size={20} color={Theme.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>
          {issue.title}
        </Text>
        <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }} numberOfLines={1}>
          {issue.description}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.navy }}>
          {formatCurrency(issue.pricePaise)}
        </Text>
        <Text style={{ fontSize: 10, color: Theme.textLight, marginTop: 2, letterSpacing: 0.5 }}>
          FIXED
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Theme.textLight} />
    </Pressable>
  );
}

export default function CategoryIssues() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const category = useMemo(() => decodeURIComponent(slug ?? ''), [slug]);
  const catalog = useMemo(() => getCategoryCatalog(category), [category]);

  const handleSelectFixed = (issue: FixedIssue) => {
    router.push({
      pathname: '/(customer)/quick-book',
      params: {
        category,
        issueKey: issue.key,
      },
    });
  };

  const handleOther = () => {
    router.push({
      pathname: '/(customer)/diagnose',
      params: { category, resetKey: Date.now().toString() },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={[Theme.navy, Theme.navyMid]} style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                CATEGORY
              </Text>
              <Text style={{ color: Theme.white, fontSize: 20, fontWeight: '800' }}>
                {category || 'Service'}
              </Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>
            Pick a common issue with upfront pricing — no diagnosis needed. Or describe
            your own problem and we'll diagnose it with AI.
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -16, gap: 12 }}>
          {!catalog ? (
            <View style={{ backgroundColor: Theme.creamCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Theme.border }}>
              <Text style={{ fontSize: 14, color: Theme.textMid }}>
                No common issues available for this category yet. Try the AI diagnose
                flow below.
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.textMid, letterSpacing: 0.5, marginTop: 16, marginBottom: 4 }}>
                COMMON ISSUES
              </Text>
              {catalog.issues.map((issue) => (
                <IssueRow key={issue.key} issue={issue} onPress={() => handleSelectFixed(issue)} />
              ))}
            </>
          )}

          <View style={{ marginTop: 22, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Theme.border }} />
              <Text style={{ color: Theme.textLight, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Theme.border }} />
            </View>
            <View style={{ backgroundColor: Theme.amberLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Theme.amber + '40' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Ionicons name="sparkles" size={18} color={Theme.navy} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>
                  Different issue?
                </Text>
              </View>
              <Text style={{ color: Theme.textMid, fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
                Show us a photo, describe it, or record what you're seeing — our AI will
                identify the problem and estimate the cost before you book.
              </Text>
              <Button onPress={handleOther} leftIcon={<Ionicons name="hardware-chip" size={18} color={Theme.navy} />}>
                Diagnose with AI
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
