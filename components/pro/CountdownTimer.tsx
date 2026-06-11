import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useProTheme } from '@/hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CountdownTimerProps = {
  seconds: number;
  onExpire: () => void;
};

export const CountdownTimer = ({ seconds, onExpire }: CountdownTimerProps) => {
  const ProTheme = useProTheme();
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(1);
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    progress.value = 1;
    progress.value = withTiming(
      0,
      { duration: seconds * 1000, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(onExpire)();
        }
      }
    );

    let count = seconds;
    const interval = setInterval(() => {
      count -= 1;
      setRemaining(count);
      if (count <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [onExpire, progress, seconds]);

  const color = useMemo(() => {
    if (remaining <= 10) {
      return ProTheme.colors.error;
    }
    if (remaining <= 30) {
      return ProTheme.colors.amber;
    }
    return ProTheme.colors.success;
  }, [remaining]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value)
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={90} height={90}>
        <Circle
          cx="45"
          cy="45"
          r={radius}
          stroke={ProTheme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx="45"
          cy="45"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ position: 'absolute', fontWeight: '700', fontSize: 12, color }}>{remaining}</Text>
    </View>
  );
};
