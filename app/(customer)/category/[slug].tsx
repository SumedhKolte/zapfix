import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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

// Hero icon shown in the category header, per Quick Category label.
const CATEGORY_ICON: Record<string, string> = {
  'AC Repair': 'snow',
  Electrical: 'flash',
  Plumbing: 'water',
  Washing: 'sync',
  Refrigerator: 'snow',
  Geyser: 'flame',
};

/* ── Small trust signal chip used in the card footer ── */
function TrustChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon as any} size={12} color={Theme.blue} />
      <Text style={{ fontSize: 10.5, fontWeight: '700', color: Theme.textMid }}>{label}</Text>
    </View>
  );
}

/* ── Premium service card ── */
function IssueCard({
  issue,
  popular,
  onPress,
}: {
  issue: FixedIssue;
  popular: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: Theme.creamCard,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Theme.border,
        overflow: 'hidden',
        shadowColor: Theme.navy,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {popular && (
        <View
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 2,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            backgroundColor: Theme.amber,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}
        >
          <Ionicons name="star" size={10} color={Theme.navy} />
          <Text style={{ fontSize: 9, fontWeight: '900', color: Theme.navy, letterSpacing: 0.4 }}>
            MOST BOOKED
          </Text>
        </View>
      )}

      {/* Main row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <LinearGradient
          colors={[Theme.navy, Theme.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: Theme.blue,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name={issue.icon as any} size={26} color={Theme.white} />
        </LinearGradient>

        <View style={{ flex: 1, paddingRight: popular ? 8 : 0 }}>
          <Text style={{ fontSize: 15.5, fontWeight: '800', color: Theme.textDark }} numberOfLines={1}>
            {issue.title}
          </Text>
          <Text style={{ fontSize: 12.5, color: Theme.textMid, marginTop: 3, lineHeight: 17 }} numberOfLines={2}>
            {issue.description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <Text style={{ fontSize: 19, fontWeight: '900', color: Theme.navy }}>
              {formatCurrency(issue.pricePaise)}
            </Text>
            <View style={{ backgroundColor: Theme.amberLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#9A7A00', letterSpacing: 0.5 }}>
                FIXED PRICE
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer: trust signals + Book affordance */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 11,
          borderTopWidth: 1,
          borderTopColor: Theme.border,
          backgroundColor: '#FBFCFE',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
          <TrustChip icon="shield-checkmark" label="30-day warranty" />
          <TrustChip icon="flash" label="Upfront" />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            backgroundColor: Theme.amber,
            paddingLeft: 12,
            paddingRight: 9,
            paddingVertical: 7,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: Theme.navy }}>Book</Text>
          <Ionicons name="chevron-forward" size={14} color={Theme.navy} />
        </View>
      </View>
    </Pressable>
  );
}

export default function CategoryIssues() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const category = useMemo(() => decodeURIComponent(slug ?? ''), [slug]);
  const catalog = useMemo(() => getCategoryCatalog(category), [category]);
  const heroIcon = CATEGORY_ICON[category] ?? 'construct';

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 40 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              QUICK CATEGORY
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: 'rgba(245,184,0,0.16)',
                borderWidth: 1,
                borderColor: 'rgba(245,184,0,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={heroIcon as any} size={28} color={Theme.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Theme.white, fontSize: 23, fontWeight: '900' }}>
                {category || 'Service'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, marginTop: 2 }}>
                {catalog ? `${catalog.issues.length} fixed-price services` : 'Fixed-price services'}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              marginTop: 18,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="shield-checkmark" size={16} color={Theme.amber} />
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, flex: 1, lineHeight: 16 }}>
              Transparent upfront pricing · Auto-refunded if no Pro accepts in 24h
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 18, marginTop: -20 }}>
          {!catalog ? (
            <View style={{ backgroundColor: Theme.creamCard, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: Theme.border }}>
              <Text style={{ fontSize: 14, color: Theme.textMid }}>
                No common issues available for this category yet. Try the AI diagnose
                flow below.
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 12, fontWeight: '900', color: Theme.textLight, letterSpacing: 1, marginBottom: 12 }}>
                COMMON ISSUES
              </Text>
              <View style={{ gap: 14 }}>
                {catalog.issues.map((issue, idx) => (
                  <IssueCard
                    key={issue.key}
                    issue={issue}
                    popular={idx === 0}
                    onPress={() => handleSelectFixed(issue)}
                  />
                ))}
              </View>
            </>
          )}

          {/* AI diagnose fallback */}
          <View style={{ marginTop: 26, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Theme.border }} />
              <Text style={{ color: Theme.textLight, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                CAN'T FIND IT?
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Theme.border }} />
            </View>
            <View style={{ backgroundColor: Theme.amberLight, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Theme.amber + '40' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.navy, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="sparkles" size={18} color={Theme.amber} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textDark }}>
                  Different issue?
                </Text>
              </View>
              <Text style={{ color: Theme.textMid, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
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
