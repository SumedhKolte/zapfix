import { useRef, useEffect } from 'react';
import { Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatDate } from '@/utils/formatDate';

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
  warning: '#C07A00',
  error: '#C23232',
};

const applianceIcons: Record<string, string> = {
  AC:               'thermometer',
  'Air Conditioner':'thermometer',
  Refrigerator:     'snow',
  Fridge:           'snow',
  'Washing Machine':'shirt',
  Washer:           'shirt',
  Dryer:            'cloudy',
  Microwave:        'radio',
  Geyser:           'flame',
  TV:               'tv',
};

export type ApplianceCardProps = {
  type: string;
  brand?: string | null;
  model?: string | null;
  healthScore: number;
  lastServicedAt?: string | null;
  nextServiceDue?: string | null;
  onPress?: () => void;
};

export const ApplianceCard = ({
  type, brand, model, healthScore,
  lastServicedAt, nextServiceDue, onPress,
}: ApplianceCardProps) => {
  const barWidth = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: healthScore / 100,
      duration: 900,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [healthScore]);

  const healthColor = healthScore > 70 ? Theme.success
    : healthScore > 40 ? Theme.warning : Theme.error;

  const healthLabel = healthScore > 70 ? 'Good' : healthScore > 40 ? 'Fair' : 'Poor';

  const iconName = applianceIcons[type] ?? 'cube';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: Theme.creamCard,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: Theme.border,
          shadowColor: Theme.navy,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 46, height: 46, borderRadius: 14,
            backgroundColor: healthColor + '15',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={iconName as any} size={22} color={healthColor} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textDark }}>{type}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: healthColor }}>{healthScore}%</Text>
                <View style={{
                  backgroundColor: healthColor + '20', borderRadius: 6,
                  paddingHorizontal: 6, paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: 10, color: healthColor, fontWeight: '700' }}>{healthLabel}</Text>
                </View>
              </View>
            </View>
            {(brand || model) ? (
              <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 1 }}>
                {[brand, model].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Health Bar */}
        <View style={{
          marginTop: 12, height: 5, borderRadius: 4,
          backgroundColor: Theme.border, overflow: 'hidden',
        }}>
          <Animated.View style={{
            height: '100%', borderRadius: 4,
            backgroundColor: healthColor,
            width: barWidth.interpolate({
              inputRange: [0, 1], outputRange: ['0%', '100%'],
            }),
          }} />
        </View>

        {/* Dates */}
        {(lastServicedAt || nextServiceDue) ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            {lastServicedAt ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: Theme.textLight, fontWeight: '700' }}>LAST SERVICE</Text>
                <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }}>{formatDate(lastServicedAt)}</Text>
              </View>
            ) : null}
            {nextServiceDue ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: Theme.textLight, fontWeight: '700' }}>NEXT DUE</Text>
                <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }}>{formatDate(nextServiceDue)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};