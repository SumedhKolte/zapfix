import { useRef, useEffect } from 'react';
import { Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Enums } from '@/types/database';

const Theme = {
  navy: '#0F2057',
  amber: '#F5B800',
  blue: '#1B6FE8',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  success: '#1A7A4A',
};

const steps: Enums<'job_status'>[] = ['matched', 'in_transit', 'arrived', 'working', 'completed'];

const stepConfig: Record<string, { label: string; icon: string }> = {
  matched:    { label: 'Matched',  icon: 'person-add'        },
  in_transit: { label: 'On Way',   icon: 'car'               },
  arrived:    { label: 'Arrived',  icon: 'location'          },
  working:    { label: 'Fixing',   icon: 'build'             },
  completed:  { label: 'Done',     icon: 'checkmark-circle'  },
};

type JobStatusBarProps = {
  status: Enums<'job_status'>;
};

export const JobStatusBar = ({ status }: JobStatusBarProps) => {
  const currentIndex = Math.max(0, steps.indexOf(status));
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentIndex / (steps.length - 1),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  return (
    <View style={{ paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', position: 'relative' }}>
        {/* Background line */}
        <View style={{
          position: 'absolute',
          top: 14, left: '5%', right: '5%',
          height: 3, backgroundColor: Theme.border, borderRadius: 2,
        }} />

        {/* Animated progress line — amber */}
        <Animated.View style={{
          position: 'absolute',
          top: 14, left: '5%',
          height: 3, backgroundColor: Theme.amber, borderRadius: 2,
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '90%'],
          }),
        }} />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent   = index === currentIndex;
          const scale       = useRef(new Animated.Value(isCurrent ? 0 : 1)).current;

          useEffect(() => {
            if (isCurrent) {
              Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
            }
          }, [isCurrent]);

          return (
            <View key={step} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Animated.View style={{
                transform: [{ scale: isCurrent ? scale : new Animated.Value(1) }],
                width:        isCurrent ? 32 : 28,
                height:       isCurrent ? 32 : 28,
                borderRadius: isCurrent ? 16 : 14,
                backgroundColor: isCompleted ? Theme.navy
                  : isCurrent ? Theme.amber : Theme.white,
                borderWidth: isCurrent ? 0 : 2,
                borderColor: isCompleted ? Theme.navy : isCurrent ? Theme.amber : Theme.border,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: isCurrent ? Theme.amber : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
              }}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={Theme.white} />
                ) : (
                  <Ionicons
                    name={stepConfig[step].icon as any}
                    size={13}
                    color={isCurrent ? Theme.navy : Theme.textLight}
                  />
                )}
              </Animated.View>
              <Text style={{
                fontSize: 10, textAlign: 'center', fontWeight: isCurrent ? '700' : '500',
                color: isCompleted || isCurrent ? Theme.textDark : Theme.textLight,
              }}>
                {stepConfig[step].label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};