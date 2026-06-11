import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { RetryButton } from './RetryButton';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export const ErrorState = ({ title, message, onRetry }: ErrorStateProps) => {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.error }}>
        {title ?? 'Something went wrong'}
      </Text>
      <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center' }}>
        {message ?? 'Please try again.'}
      </Text>
      {onRetry ? <RetryButton onPress={onRetry} /> : null}
    </View>
  );
};
