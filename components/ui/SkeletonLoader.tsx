import { View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type SkeletonLoaderProps = {
  height?: number;
  width?: DimensionValue;
  radius?: number;
};

export const SkeletonLoader = ({ height = 16, width = '100%', radius = 8 }: SkeletonLoaderProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height,
        width,
        borderRadius: radius,
        backgroundColor: colors.surfaceAlt
      }}
    />
  );
};
