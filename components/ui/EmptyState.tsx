import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export const EmptyState = ({ title, description, ctaLabel, onCtaPress }: EmptyStateProps) => {
  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
      <Ionicons name="flash" size={48} color={Colors.amber.primary} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>{title}</Text>
      <Text style={{ fontSize: 14, color: Colors.darkGray, textAlign: 'center' }}>
        {description}
      </Text>
      {ctaLabel && onCtaPress ? <Button onPress={onCtaPress}>{ctaLabel}</Button> : null}
    </View>
  );
};
