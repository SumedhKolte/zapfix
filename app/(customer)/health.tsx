import { useRef, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ApplianceCard } from '@/components/customer/ApplianceCard';

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
  success: '#1A7A4A',
  warning: '#C07A00',
  error: '#C23232',
};

function AnimatedCard({ children, delay = 0, style }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score > 70 ? Theme.success : score > 40 ? Theme.amber : Theme.error;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <View style={{
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 7, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: color + '15',
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: Theme.textDark }}>{score}%</Text>
      </View>
    </View>
  );
}

function StatBubble({ label, value, color }: any) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Theme.textMid, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function Health() {
  const { profile } = useAuth();
  const { appliancesQuery } = useProfile(profile?.id ?? '');
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const appliances = appliancesQuery.data ?? [];
  const avgHealth = appliances.length > 0
    ? Math.round(appliances.reduce((sum, a) => sum + (a.health_score ?? 100), 0) / appliances.length)
    : 82;

  const healthGood = appliances.filter(a => (a.health_score ?? 100) > 70).length;
  const healthWarn = appliances.filter(a => (a.health_score ?? 100) <= 70 && (a.health_score ?? 100) > 40).length;
  const healthBad  = appliances.filter(a => (a.health_score ?? 100) <= 40).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name="hardware-chip" size={12} color={Theme.blue} />
                  <Text style={{ color: Theme.blue, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
                    HOME HEALTH
                  </Text>
                </View>
                <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800' }}>
                  Appliance Monitor
                </Text>
              </View>
              <Pressable style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: Theme.amber,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="add" size={22} color={Theme.navy} />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -20, paddingHorizontal: 20, gap: 16 }}>

          {/* Health Score Card */}
          <AnimatedCard delay={80}>
            <View style={{
              backgroundColor: Theme.creamCard, borderRadius: 20, padding: 20,
              shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="hardware-chip" size={14} color={Theme.blue} />
                <Text style={{ fontSize: 13, color: Theme.blue, fontWeight: '700', textAlign: 'center' }}>
                  AI Health Score
                </Text>
              </View>
              <ScoreRing score={avgHealth} />
              <Text style={{ fontSize: 12, color: Theme.textLight, textAlign: 'center', marginTop: 4 }}>
                Based on {appliances.length} appliances
              </Text>

              <View style={{
                flexDirection: 'row', marginTop: 20, paddingTop: 16,
                borderTopWidth: 1, borderTopColor: Theme.border,
              }}>
                <StatBubble label="Healthy"  value={healthGood} color={Theme.success} />
                <View style={{ width: 1, backgroundColor: Theme.border }} />
                <StatBubble label="Warning"  value={healthWarn} color={Theme.amber} />
                <View style={{ width: 1, backgroundColor: Theme.border }} />
                <StatBubble label="Critical" value={healthBad}  color={Theme.error} />
              </View>
            </View>
          </AnimatedCard>

          {/* Tips Banner */}
          <AnimatedCard delay={140}>
            <View style={{
              backgroundColor: Theme.amberLight, borderRadius: 16, padding: 14,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              borderWidth: 1, borderColor: Theme.amber + '50',
            }}>
              <Ionicons name="information-circle" size={22} color={Theme.amber} />
              <Text style={{ flex: 1, fontSize: 13, color: Theme.textDark, lineHeight: 18 }}>
                Schedule a service for best performance. Next recommended:{' '}
                <Text style={{ fontWeight: '700' }}>AC Service</Text>
              </Text>
            </View>
          </AnimatedCard>

          {/* Appliances */}
          <AnimatedCard delay={180}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textDark }}>Your Appliances</Text>
              <Text style={{ fontSize: 13, color: Theme.blue, fontWeight: '600' }}>
                {appliances.length} registered
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {appliances.map((appliance, i) => (
                <AnimatedCard key={appliance.id} delay={200 + i * 60}>
                  <ApplianceCard
                    type={appliance.type}
                    brand={appliance.brand}
                    model={appliance.model}
                    healthScore={appliance.health_score ?? 100}
                    lastServicedAt={appliance.last_serviced_at}
                    nextServiceDue={appliance.next_service_due}
                  />
                </AnimatedCard>
              ))}
            </View>

            {appliances.length === 0 ? (
              <View style={{
                alignItems: 'center', paddingVertical: 40,
                backgroundColor: Theme.creamCard, borderRadius: 20,
                borderWidth: 1.5, borderStyle: 'dashed', borderColor: Theme.border,
              }}>
                <Ionicons name="cube-outline" size={40} color={Theme.textLight} />
                <Text style={{ color: Theme.textMid, marginTop: 12, fontWeight: '600' }}>No appliances registered</Text>
                <Text style={{ color: Theme.textLight, fontSize: 12, marginTop: 4 }}>Tap + to add your first appliance</Text>
              </View>
            ) : null}
          </AnimatedCard>

          {/* Add Button */}
          <AnimatedCard delay={300}>
            <Pressable style={{
              backgroundColor: Theme.amber, borderRadius: 16,
              paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}>
              <Ionicons name="add-circle" size={20} color={Theme.navy} />
              <Text style={{ color: Theme.navy, fontWeight: '800', fontSize: 15 }}>Add Appliance</Text>
            </Pressable>
          </AnimatedCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}