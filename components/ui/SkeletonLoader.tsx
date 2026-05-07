import { View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { Colors } from '@/constants/colors';

type SkeletonLoaderProps = {
  height?: number;
  width?: DimensionValue;
  radius?: number;
};

export const SkeletonLoader = ({ height = 16, width = '100%', radius = 8 }: SkeletonLoaderProps) => {
  return (
    <View
      style={{
        height,
        width,
        borderRadius: radius,
        backgroundColor: Colors.amber.light
      }}
    />
  );
};
