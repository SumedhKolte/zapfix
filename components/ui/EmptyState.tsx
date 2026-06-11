import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export const EmptyState = ({ title, description, ctaLabel, onCtaPress }: EmptyStateProps) => {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
      <Ionicons name="flash" size={48} color={colors.amber.primary} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary }}>{title}</Text>
      <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center' }}>{description}</Text>
      {ctaLabel && onCtaPress ? <Button onPress={onCtaPress}>{ctaLabel}</Button> : null}
    </View>
  );
};
