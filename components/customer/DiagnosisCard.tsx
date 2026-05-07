import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { AIBadge } from '../ui/AIBadge';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

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
  faultName,
  description,
  confidence,
  parts,
  costMin,
  costMax,
  urgency
}: DiagnosisCardProps) => {
  const confidenceColor = confidence >= 80 ? Colors.success : confidence >= 60 ? Colors.amber.primary : Colors.error;
  const urgencyLabel = urgency === 'high' ? 'Urgent' : urgency === 'medium' ? 'Watch Soon' : 'Non-Emergency';
  const urgencyColor = urgency === 'high' ? Colors.error : urgency === 'medium' ? Colors.warning : Colors.success;

  return (
    <View
      style={{
        backgroundColor: Colors.blue.light,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.blue.border,
        padding: 16,
        gap: 12
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AIBadge size="md" />
        <Badge label={`${confidence}% confident`} backgroundColor={`${confidenceColor}1A`} textColor={confidenceColor} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>{faultName}</Text>
      <Text style={{ fontSize: 14, color: Colors.darkGray }}>{description}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {parts.map((part) => (
          <Badge key={part} label={part} backgroundColor={Colors.amber.light} textColor={Colors.amber.dark} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: Colors.midGray }}>Estimated Cost</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>
          {formatCurrency(costMin)} - {formatCurrency(costMax)}
        </Text>
      </View>
      <Badge label={urgencyLabel} backgroundColor={`${urgencyColor}1A`} textColor={urgencyColor} />
    </View>
  );
};
