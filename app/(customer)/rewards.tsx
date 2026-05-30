import { useRef, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, Animated, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  amberBorder: '#F5B80040',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  success: '#1A7A4A',
  successLight: '#E8F5EE',
  white: '#FFFFFF',
};

const TIERS = [
  { name: 'Spark',    min: 0,    max: 499,  color: '#C07A00', icon: 'flash-outline' },
  { name: 'Silver',   min: 500,  max: 1499, color: '#8E97B5', icon: 'star-outline' },
  { name: 'Gold',     min: 1500, max: 2999, color: '#F5B800', icon: 'star' },
  { name: 'Platinum', min: 3000, max: 99999,color: Theme.blue, icon: 'diamond' },
];

const ACHIEVEMENTS = [
  { id: 'first_fix',  icon: 'build',            label: 'First Fix',      desc: 'Complete your first job',  points: 100, threshold: 1  },
  { id: 'regular',    icon: 'repeat',            label: 'Regular',        desc: 'Book 3 services',          points: 150, threshold: 3  },
  { id: 'power_user', icon: 'flash',             label: 'Power User',     desc: 'Book 5 services',          points: 250, threshold: 5  },
  { id: 'loyal',      icon: 'heart',             label: 'Loyal Customer', desc: 'Book 10 services',         points: 500, threshold: 10 },
  { id: 'referrer',   icon: 'people',            label: 'Referral Hero',  desc: 'Refer a friend',           points: 200, threshold: 0  },
  { id: 'reviewer',   icon: 'chatbubble-ellipses', label: 'Reviewer',     desc: 'Rate your first Pro',      points: 75,  threshold: 0  },
];

const OFFERS = [
  { id: 'o1', label: '10% off', desc: 'On your next AC service', icon: 'thermometer', bg: Theme.blueLight,  accent: Theme.blue  },
  { id: 'o2', label: '₹150 off', desc: 'On any repair above ₹999', icon: 'cash',       bg: Theme.amberLight, accent: Theme.amber },
  { id: 'o3', label: 'Free check', desc: 'First diagnosis is free',  icon: 'hardware-chip', bg: Theme.successLight, accent: Theme.success },
];

function AnimatedCard({ children, delay = 0, style }: any) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function TierBadge({ tier }: { tier: typeof TIERS[number] }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: tier.color + '20',
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
      borderWidth: 1, borderColor: tier.color + '40',
    }}>
      <Ionicons name={tier.icon as any} size={13} color={tier.color} />
      <Text style={{ fontSize: 12, fontWeight: '800', color: tier.color }}>{tier.name}</Text>
    </View>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pct = Math.min(value / max, 1);

  useEffect(() => {
    Animated.timing(progress, { toValue: pct, duration: 900, delay: 300, useNativeDriver: false }).start();
  }, [pct]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ height: 7, backgroundColor: Theme.border, borderRadius: 4, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', width, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

function AchievementBadge({ achievement, unlocked, delay }: any) {
  const scale = useRef(new Animated.Value(unlocked ? 1 : 0.92)).current;

  useEffect(() => {
    if (unlocked) {
      Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, delay, useNativeDriver: true }).start();
    }
  }, [unlocked]);

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center', width: '30%', marginBottom: 16 }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: unlocked ? Theme.amber + '20' : Theme.border + '60',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: unlocked ? 2 : 1,
        borderColor: unlocked ? Theme.amber : Theme.border,
        marginBottom: 6,
      }}>
        <Ionicons
          name={achievement.icon as any}
          size={24}
          color={unlocked ? Theme.amber : Theme.textLight}
        />
        {unlocked && (
          <View style={{
            position: 'absolute', top: -3, right: -3,
            width: 16, height: 16, borderRadius: 8,
            backgroundColor: Theme.success,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: Theme.creamCard,
          }}>
            <Ionicons name="checkmark" size={9} color={Theme.white} />
          </View>
        )}
      </View>
      <Text style={{
        fontSize: 11, fontWeight: '700', textAlign: 'center',
        color: unlocked ? Theme.textDark : Theme.textLight,
      }}>{achievement.label}</Text>
      <Text style={{ fontSize: 10, color: Theme.textLight, textAlign: 'center', marginTop: 1 }}>
        +{achievement.points} pts
      </Text>
    </Animated.View>
  );
}

function OfferCard({ offer }: { offer: typeof OFFERS[number] }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        onPress={() => Alert.alert('Offer Applied', `${offer.desc} has been activated.`)}
        style={{
          width: 150, height: 120, backgroundColor: offer.bg,
          borderRadius: 16, padding: 14,
          marginRight: 10, borderWidth: 1,
          borderColor: offer.accent + '30',
          justifyContent: 'flex-start',
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: offer.accent + '20',
          alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        }}>
          <Ionicons name={offer.icon as any} size={18} color={offer.accent} />
        </View>
        <Text numberOfLines={1} ellipsizeMode='tail' style={{ fontSize: 17, fontWeight: '800', color: offer.accent }}>{offer.label}</Text>
        <Text numberOfLines={2} ellipsizeMode='tail' style={{ fontSize: 11, color: Theme.textMid, marginTop: 3, lineHeight: 15 }}>{offer.desc}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Rewards() {
  const { profile } = useAuth();
  const { jobsQuery } = useJob({ customerId: profile?.id });
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
  }, []);

  const allJobs       = jobsQuery.data ?? [];
  const completedJobs = allJobs.filter(j => j.status === 'completed');
  const completedCount = completedJobs.length;

  // Points calculation: 100 per completed job + tier bonuses
  const zapPoints = completedCount * 100 + (completedCount >= 5 ? 250 : 0) + (completedCount >= 3 ? 150 : 0);
  const totalSaved = completedCount * 85; // avg ₹85 saved per job via platform

  const currentTier = [...TIERS].reverse().find(t => zapPoints >= t.min) ?? TIERS[0];
  const nextTier    = TIERS[TIERS.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? (zapPoints - currentTier.min) / (nextTier.min - currentTier.min)
    : 1;

  const referralCode = profile?.phone_number
    ? `ZAP${profile.phone_number.slice(-4)}`
    : 'ZAP0000';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Zapfix — India's smartest home repair platform! Use my code ${referralCode} and get ₹150 off your first service. https://zapfix.in`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name="gift" size={12} color={Theme.amber} />
                  <Text style={{ color: Theme.amber, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
                    ZAP REWARDS
                  </Text>
                </View>
                <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800' }}>
                  Your Perks
                </Text>
              </View>
              <TierBadge tier={currentTier} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -28, paddingHorizontal: 20, gap: 16 }}>

          {/* Points Card */}
          <AnimatedCard delay={60}>
            <LinearGradient
              colors={[Theme.navy, Theme.navyMid]}
              style={{
                borderRadius: 22, padding: 22, overflow: 'hidden',
                shadowColor: Theme.navy, shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22, shadowRadius: 18, elevation: 8,
              }}
            >
              <View style={{
                position: 'absolute', right: -30, top: -30,
                width: 150, height: 150, borderRadius: 75,
                backgroundColor: 'rgba(245,184,0,0.08)',
              }} />
              <View style={{
                position: 'absolute', left: -20, bottom: -20,
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: 'rgba(27,111,232,0.1)',
              }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>
                    Your Zap Points
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
                    <Text style={{ color: Theme.amber, fontSize: 44, fontWeight: '800', lineHeight: 50 }}>
                      {zapPoints.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 8 }}>ZP</Text>
                  </View>
                </View>
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: Theme.amber,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="flash" size={22} color={Theme.navy} />
                </View>
              </View>

              {nextTier ? (
                <View style={{ marginTop: 18 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                      Progress to {nextTier.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                      {nextTier.min - zapPoints} ZP to go
                    </Text>
                  </View>
                  <ProgressBar value={zapPoints - currentTier.min} max={nextTier.min - currentTier.min} color={Theme.amber} />
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: Theme.amber, fontSize: 13, fontWeight: '700' }}>
                    You're at the highest tier!
                  </Text>
                </View>
              )}
            </LinearGradient>
          </AnimatedCard>

          {/* Stats Row */}
          <AnimatedCard delay={120}>
            <View style={{
              flexDirection: 'row', backgroundColor: Theme.creamCard, borderRadius: 18,
              borderWidth: 1, borderColor: Theme.border, overflow: 'hidden',
            }}>
              {[
                { label: 'Services',  value: completedCount.toString(), icon: 'briefcase',  color: Theme.blue    },
                { label: 'Saved',     value: `₹${totalSaved}`,          icon: 'cash',       color: Theme.success },
                { label: 'Tier',      value: currentTier.name,           icon: 'medal',      color: currentTier.color },
              ].map((stat, i) => (
                <View key={stat.label} style={{
                  flex: 1, alignItems: 'center', paddingVertical: 16,
                  borderRightWidth: i < 2 ? 1 : 0, borderRightColor: Theme.border,
                }}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textDark, marginTop: 5 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: Theme.textLight, marginTop: 1 }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </AnimatedCard>

          {/* Achievements */}
          <AnimatedCard delay={180}>
            <View style={{
              backgroundColor: Theme.creamCard, borderRadius: 20, padding: 18,
              borderWidth: 1, borderColor: Theme.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textDark }}>Achievements</Text>
                <View style={{
                  backgroundColor: Theme.amber + '20', borderRadius: 10,
                  paddingHorizontal: 9, paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.amber }}>
                    {ACHIEVEMENTS.filter(a => a.threshold > 0
                      ? completedCount >= a.threshold
                      : false
                    ).length} / {ACHIEVEMENTS.length}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {ACHIEVEMENTS.map((achievement, i) => {
                  const unlocked = achievement.threshold > 0
                    ? completedCount >= achievement.threshold
                    : false;
                  return (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      unlocked={unlocked}
                      delay={200 + i * 70}
                    />
                  );
                })}
              </View>

              {completedCount === 0 && (
                <View style={{
                  marginTop: 4, backgroundColor: Theme.blueLight,
                  borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center',
                }}>
                  <Ionicons name="information-circle" size={18} color={Theme.blue} />
                  <Text style={{ flex: 1, fontSize: 12, color: Theme.textMid, lineHeight: 17 }}>
                    Book your first service to start earning achievements and Zap Points!
                  </Text>
                </View>
              )}
            </View>
          </AnimatedCard>

          {/* Active Offers */}
          <AnimatedCard delay={260}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textDark }}>Active Offers</Text>
              <View style={{
                backgroundColor: Theme.success + '18', borderRadius: 10,
                paddingHorizontal: 9, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.success }}>
                  {OFFERS.length} available
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {OFFERS.map(offer => <OfferCard key={offer.id} offer={offer} />)}
            </ScrollView>
          </AnimatedCard>

          {/* Refer & Earn Banner */}
          <AnimatedCard delay={320}>
            <Pressable
              onPress={handleShare}
              style={{
                backgroundColor: Theme.navy, borderRadius: 20,
                padding: 20, overflow: 'hidden',
              }}
            >
              <View style={{
                position: 'absolute', right: -20, bottom: -20,
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: 'rgba(245,184,0,0.1)',
              }} />
              <View style={{
                position: 'absolute', left: -10, top: -10,
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(27,111,232,0.12)',
              }} />

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <Ionicons name="people" size={14} color={Theme.amber} />
                    <Text style={{ color: Theme.amber, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      REFER &amp; EARN
                    </Text>
                  </View>
                  <Text style={{ color: Theme.white, fontSize: 17, fontWeight: '800', marginBottom: 4 }}>
                    Invite friends, earn{' '}
                    <Text style={{ color: Theme.amber }}>200 ZP</Text>
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17 }}>
                    Your friend also gets ₹150 off their first booking
                  </Text>

                  <View style={{
                    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={{ color: Theme.amber, fontWeight: '800', fontSize: 15, letterSpacing: 1.5 }}>
                      {referralCode}
                    </Text>
                    <Ionicons name="copy-outline" size={14} color='rgba(255,255,255,0.4)' />
                  </View>
                </View>

                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: Theme.amber,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="share-social" size={22} color={Theme.navy} />
                </View>
              </View>
            </Pressable>
          </AnimatedCard>

          {/* How to Earn Points */}
          <AnimatedCard delay={380}>
            <View style={{
              backgroundColor: Theme.creamCard, borderRadius: 20, padding: 18,
              borderWidth: 1, borderColor: Theme.border,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark, marginBottom: 14 }}>
                How to Earn Points
              </Text>
              {[
                { icon: 'build',             label: 'Complete a service',    pts: '+100 ZP' },
                { icon: 'people',            label: 'Refer a friend',        pts: '+200 ZP' },
                { icon: 'chatbubble-ellipses', label: 'Rate your Pro',        pts: '+75 ZP'  },
                { icon: 'flash',             label: 'Use AI Diagnose',       pts: '+25 ZP'  },
              ].map((item, i) => (
                <View key={item.label} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 10,
                  borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Theme.border,
                }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: Theme.navy + '10',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={item.icon as any} size={16} color={Theme.navy} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: Theme.textMid }}>{item.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.amber }}>{item.pts}</Text>
                </View>
              ))}
            </View>
          </AnimatedCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
