import { useRef, useEffect } from 'react';
import { Image, Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Theme = {
  navy: '#0F2057',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  success: '#1A7A4A',
};

type ProAssignedCardProps = {
  name: string;
  avatarUrl?: string | null;
  rating: number | null;
  ratingCount?: number;
  skill: string;
  distanceKm: number | null;
  score: number | null;
  jobsCompleted: number;
  hasPart: boolean;
  loading?: boolean;
  onContact?: () => void;
};

function StatItem({ icon, label, value, highlight }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: highlight ? Theme.navy + '12' : Theme.border + '80',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={15} color={highlight ? Theme.navy : Theme.textMid} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.textDark }}>{value}</Text>
      <Text style={{ fontSize: 10, color: Theme.textLight }}>{label}</Text>
    </View>
  );
}

export const ProAssignedCard = ({
  name, avatarUrl, rating, ratingCount, skill, distanceKm,
  score, jobsCompleted, hasPart, loading, onContact,
}: ProAssignedCardProps) => {
  const ratingValue = rating ?? 0;
  const ratingLabel = rating !== null ? rating.toFixed(1) : 'New';
  const scoreLabel = score !== null ? score.toFixed(1) : '—';
  const distanceLabel = distanceKm !== null ? `${distanceKm.toFixed(1)}km` : '—';
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideAnim }] }}>
      <View style={{
        backgroundColor: Theme.creamCard,
        borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: Theme.border,
        shadowColor: Theme.navy, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
      }}>
        {/* Header strip — navy with amber accent */}
        <View style={{
          backgroundColor: Theme.navy,
          paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}>
          <Ionicons name="checkmark-circle" size={14} color={Theme.amber} />
          <Text style={{ color: Theme.amber, fontSize: 12, fontWeight: '800' }}>PRO ASSIGNED</Text>
        </View>

        <View style={{ padding: 16 }}>
          {/* Profile Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{
              width: 60, height: 60, borderRadius: 20,
              backgroundColor: Theme.navy,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: Theme.amber,
              overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ color: Theme.amber, fontSize: 20, fontWeight: '800' }}>{initials || '?'}</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: Theme.textDark }} numberOfLines={1}>{name}</Text>
              <Text style={{ color: Theme.textMid, fontSize: 13, marginTop: 1 }}>{skill}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Ionicons
                    key={i} name="star"
                    size={12}
                    color={i <= Math.round(ratingValue) ? Theme.amber : Theme.border}
                  />
                ))}
                <Text style={{ fontSize: 12, color: Theme.textMid, marginLeft: 3 }}>
                  {ratingLabel}{ratingCount ? ` (${ratingCount})` : ''}
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: Theme.navy + '10',
              borderRadius: 12, padding: 8, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.navy }}>{scoreLabel}</Text>
              <Text style={{ fontSize: 9, color: Theme.textMid, fontWeight: '700' }}>SCORE</Text>
            </View>
          </View>

          {loading ? (
            <Text style={{ fontSize: 11, color: Theme.textLight, marginTop: 10 }}>
              Loading pro profile…
            </Text>
          ) : null}

          {/* Stats */}
          <View style={{
            flexDirection: 'row', marginTop: 16, paddingTop: 14,
            borderTopWidth: 1, borderTopColor: Theme.border, gap: 4,
          }}>
            <StatItem icon="location"  label="Distance"  value={distanceLabel} />
            <StatItem icon="briefcase" label="Jobs Done"  value={jobsCompleted} />
            <StatItem icon="star"      label="Rating"     value={ratingLabel} highlight />
            <StatItem
              icon="cube"
              label="Has Part"
              value={hasPart ? '✓ Yes' : '✗ No'}
              highlight={hasPart}
            />
          </View>

          {/* Contact Button */}
          {onContact ? (
            <Pressable
              onPress={onContact}
              style={{
                marginTop: 14, backgroundColor: Theme.amber,
                borderRadius: 14, paddingVertical: 12,
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              <Ionicons name="call" size={16} color={Theme.navy} />
              <Text style={{ color: Theme.navy, fontWeight: '800', fontSize: 14 }}>Contact Pro</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};