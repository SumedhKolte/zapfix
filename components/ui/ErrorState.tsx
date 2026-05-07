import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { RetryButton } from './RetryButton';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export const ErrorState = ({ title, message, onRetry }: ErrorStateProps) => {
  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.error }}>
        {title ?? 'Something went wrong'}
      </Text>
      <Text style={{ fontSize: 14, color: Colors.darkGray, textAlign: 'center' }}>
        {message ?? 'Please try again.'}
      </Text>
      {onRetry ? <RetryButton onPress={onRetry} /> : null}
    </View>
  );
};
