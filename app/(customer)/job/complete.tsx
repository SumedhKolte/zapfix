import { useRef, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { WarrantyCard } from '@/components/customer/WarrantyCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTheme } from '@/hooks/useTheme';

function Section({ children, style }: any) {
  const { theme: Theme } = useTheme();
  return (
    <View style={{
      backgroundColor: Theme.creamCard, borderRadius: 20,
      borderWidth: 1, borderColor: Theme.border,
      padding: 18,
      shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      ...style,
    }}>
      {children}
    </View>
  );
}

function StarItem({ star, active, onPress }: { star: number; active: boolean; onPress: () => void }) {
  const { theme: Theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 200, friction: 5, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={handlePress}>
        <Ionicons
          name={active ? 'star' : 'star-outline'}
          size={36}
          color={active ? Theme.amber : Theme.border}
        />
      </Pressable>
    </Animated.View>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 14 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <StarItem key={star} star={star} active={star <= value} onPress={() => onChange(star)} />
      ))}
    </View>
  );
}

function AnimatedCard({ children, delay = 0, style }: any) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function JobComplete() {
  const { theme: Theme } = useTheme();
  const router    = useRouter();
  const [rating,     setRating]     = useState(0);
  const [submitted,  setSubmitted]  = useState(false);

  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const headerAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, tension: 70, friction: 8, delay: 200, useNativeDriver: true }),
      Animated.timing(checkOpacity, { toValue: 1, duration: 350, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmitRating = () => {
    if (rating === 0) {
      Alert.alert('Rate your Pro', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitted(true);
    Alert.alert('Thank you!', `You gave your Pro ${rating} star${rating > 1 ? 's' : ''}. Your feedback helps us improve!`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>

      {/* Header */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 44 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>
            JOB COMPLETE
          </Text>
          <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800', marginTop: 3 }}>
            All done!
          </Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40, gap: 14 }}
      >

        {/* Success Badge */}
        <View style={{ alignItems: 'center', marginTop: -28, marginBottom: 4 }}>
          <Animated.View style={{
            transform: [{ scale: checkScale }], opacity: checkOpacity,
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: Theme.success,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 4, borderColor: Theme.cream,
            shadowColor: Theme.success, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
          }}>
            <Ionicons name="checkmark" size={40} color={Theme.white} />
          </Animated.View>
        </View>

        {/* Repair Summary */}
        <AnimatedCard delay={80}>
          <Section>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark, marginBottom: 14 }}>
              Repair Summary
            </Text>
            {[
              { label: 'Problem Fixed',  value: 'Capacitor Failure'            },
              { label: 'Technician',     value: 'Assigned Pro'                 },
              { label: 'Final Cost',     value: formatCurrency(120000)          },
              { label: 'Time Taken',     value: '1h 20min'                     },
            ].map((row, i) => (
              <View key={row.label} style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 9,
                borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Theme.border,
              }}>
                <Text style={{ fontSize: 13, color: Theme.textLight }}>{row.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textDark }}>{row.value}</Text>
              </View>
            ))}

            <Pressable
              onPress={() => Alert.alert('Invoice', 'Invoice download will be available in the next update.')}
              style={{
                marginTop: 14, backgroundColor: Theme.blueLight,
                borderRadius: 12, paddingVertical: 11,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                borderWidth: 1, borderColor: Theme.blue + '30',
              }}
            >
              <Ionicons name="download-outline" size={16} color={Theme.blue} />
              <Text style={{ color: Theme.blue, fontWeight: '700', fontSize: 14 }}>Download Invoice</Text>
            </Pressable>
          </Section>
        </AnimatedCard>

        {/* Warranty */}
        <AnimatedCard delay={140}>
          <WarrantyCard appliance="AC Repair" validUntil={new Date(Date.now() + 90 * 86400000).toISOString()} />
        </AnimatedCard>

        {/* Rate your Pro */}
        <AnimatedCard delay={200}>
          <Section>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark, textAlign: 'center' }}>
              How was your Pro?
            </Text>
            <Text style={{ color: Theme.textLight, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              Your rating helps us maintain quality
            </Text>

            <StarRating value={rating} onChange={setRating} />

            {rating > 0 && (
              <Text style={{
                textAlign: 'center', marginTop: 10, fontSize: 13,
                color: Theme.textMid, fontWeight: '600',
              }}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </Text>
            )}

            <Pressable
              onPress={handleSubmitRating}
              disabled={submitted}
              style={{
                marginTop: 16, backgroundColor: submitted ? Theme.success : Theme.amber,
                borderRadius: 14, paddingVertical: 13,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: submitted ? 0.85 : 1,
              }}
            >
              <Ionicons
                name={submitted ? 'checkmark-circle' : 'star'}
                size={18}
                color={submitted ? Theme.white : Theme.navy}
              />
              <Text style={{
                fontWeight: '800', fontSize: 15,
                color: submitted ? Theme.white : Theme.navy,
              }}>
                {submitted ? 'Rating Submitted' : 'Submit Rating'}
              </Text>
            </Pressable>
          </Section>
        </AnimatedCard>

        {/* Zap Points earned */}
        <AnimatedCard delay={260}>
          <View style={{
            backgroundColor: Theme.amberLight, borderRadius: 16, padding: 14,
            flexDirection: 'row', alignItems: 'center', gap: 12,
            borderWidth: 1, borderColor: Theme.amber + '40',
          }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Theme.amber, alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="flash" size={20} color={Theme.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>
                +100 Zap Points earned!
              </Text>
              <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }}>
                Check your Rewards tab for perks and offers
              </Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Book Another */}
        <AnimatedCard delay={310}>
          <Pressable
            onPress={() => router.replace('/(customer)/home')}
            style={{
              backgroundColor: Theme.navy,
              borderRadius: 16, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
            }}
          >
            <Ionicons name="home" size={18} color={Theme.amber} />
            <Text style={{ color: Theme.white, fontWeight: '800', fontSize: 15 }}>
              Back to Home
            </Text>
          </Pressable>
        </AnimatedCard>

      </ScrollView>
    </SafeAreaView>
  );
}
