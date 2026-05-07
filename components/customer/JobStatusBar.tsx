import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Enums } from '@/types/database';

const steps: Enums<'job_status'>[] = ['matched', 'in_transit', 'arrived', 'working', 'completed'];

const labels: Record<Enums<'job_status'>, string> = {
  triage: 'Analysing',
  searching: 'Finding',
  matched: 'Matched',
  in_transit: 'On the way',
  arrived: 'Arrived',
  working: 'Fixing',
  completed: 'Done',
  disputed: 'Disputed',
  cancelled: 'Cancelled'
};

type JobStatusBarProps = {
  status: Enums<'job_status'>;
};

export const JobStatusBar = ({ status }: JobStatusBarProps) => {
  const currentIndex = Math.max(0, steps.indexOf(status));

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const circleColor = isCompleted || isCurrent ? Colors.amber.primary : Colors.border;

        return (
          <View key={step} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: circleColor,
                  backgroundColor: isCompleted ? circleColor : Colors.white
                }}
              >
                {isCurrent ? (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: circleColor
                    }}
                  />
                ) : null}
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: isCompleted ? Colors.amber.primary : Colors.border
                  }}
                />
              ) : null}
            </View>
            <Text style={{ fontSize: 10, marginTop: 4, color: Colors.midGray }}>{labels[step]}</Text>
          </View>
        );
      })}
    </View>
  );
};
