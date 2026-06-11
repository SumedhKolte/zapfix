import { useRef, useEffect } from 'react';
import { Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatCurrency } from '@/utils/formatCurrency';
import { useTheme } from '@/hooks/useTheme';

type DiagnosisCardProps = {
  faultName: string;
  description: string;
  confidence: number;
  parts: string[];
  costMin: number;
  costMax: number;
  urgency: 'low' | 'medium' | 'high';
};

export const DiagnosisCard = ({
  faultName, description, confidence,
  parts, costMin, costMax, urgency,
}: DiagnosisCardProps) => {
  const { theme: Theme } = useTheme();
  const barWidth  = useRef(new Animated.Value(0)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(barWidth, { toValue: confidence / 100, duration: 1000, delay: 300, useNativeDriver: false }),
    ]).start();
  }, []);

  const confidenceColor = confidence >= 80 ? Theme.success
    : confidence >= 60 ? Theme.warning : Theme.error;

  const urgencyConfig = {
    high:   { label: 'Urgent Attention Needed', color: Theme.error,   icon: 'alert-circle'     },
    medium: { label: 'Watch Soon',              color: Theme.warning,  icon: 'time'             },
    low:    { label: 'Non-Emergency',           color: Theme.success,  icon: 'checkmark-circle' },
  }[urgency];

  return (
    <Animated.View style={{
      opacity: cardAnim,
      transform: [{
        translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
      }],
      backgroundColor: Theme.creamCard,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Theme.border,
      shadowColor: Theme.navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    }}>
      {/* AI Badge Header — Navy with blue AI accent */}
      <View style={{
        backgroundColor: Theme.navy,
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', gap: 8,
      }}>
        <View style={{
          backgroundColor: Theme.amber, borderRadius: 8,
          paddingHorizontal: 8, paddingVertical: 3,
          flexDirection: 'row', alignItems: 'center', gap: 4,
        }}>
          <Ionicons name="hardware-chip" size={12} color={Theme.navy} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.navy }}>AI ANALYSIS</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="hardware-chip" size={11} color={Theme.blue} />
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Powered by Zapfix AI</Text>
        </View>
      </View>

      <View style={{ padding: 16, gap: 14 }}>
        {/* Fault Name */}
        <Text style={{ fontSize: 22, fontWeight: '800', color: Theme.textDark }}>{faultName}</Text>
        <Text style={{ fontSize: 14, color: Theme.textMid, lineHeight: 20 }}>{description}</Text>

        {/* Confidence Bar */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.textMid }}>CONFIDENCE</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: confidenceColor }}>{confidence}%</Text>
          </View>
          <View style={{ height: 6, borderRadius: 4, backgroundColor: Theme.border, overflow: 'hidden' }}>
            <Animated.View style={{
              height: '100%', borderRadius: 4, backgroundColor: confidenceColor,
              width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }} />
          </View>
        </View>

        {/* Parts */}
        {parts.length > 0 ? (
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.textMid, marginBottom: 8 }}>
              REQUIRED PARTS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {parts.map((part) => (
                <View key={part} style={{
                  backgroundColor: Theme.amberLight, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderWidth: 1, borderColor: Theme.amber + '50',
                }}>
                  <Text style={{ fontSize: 12, color: Theme.textDark, fontWeight: '700' }}>{part}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Cost */}
        <View style={{
          backgroundColor: Theme.navy + '08', borderRadius: 14,
          padding: 14, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.textMid }}>ESTIMATED COST</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: Theme.textDark, marginTop: 2 }}>
              {costMin === costMax
                ? formatCurrency(costMin)
                : `${formatCurrency(costMin)} – ${formatCurrency(costMax)}`}
            </Text>
          </View>
          <Ionicons name="cash-outline" size={28} color={Theme.textDark} />
        </View>

        {/* Urgency */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: urgencyConfig.color + '12',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: urgencyConfig.color + '30',
        }}>
          <Ionicons name={urgencyConfig.icon as any} size={18} color={urgencyConfig.color} />
          <Text style={{ color: urgencyConfig.color, fontWeight: '700', fontSize: 13 }}>
            {urgencyConfig.label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};