import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Card } from '../ui/Card';

type ProAssignedCardProps = {
  name: string;
  rating: number;
  skill: string;
  distanceKm: number;
  score: number;
  jobsCompleted: number;
  hasPart: boolean;
};

export const ProAssignedCard = ({
  name,
  rating,
  skill,
  distanceKm,
  score,
  jobsCompleted,
  hasPart
}: ProAssignedCardProps) => {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: Colors.lightGray,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="person" size={28} color={Colors.navy.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>{name}</Text>
          <Text style={{ color: Colors.midGray, fontSize: 12 }}>{skill}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="star" size={14} color={Colors.amber.primary} />
          <Text style={{ fontWeight: '600' }}>{rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={{ marginTop: 12, gap: 6 }}>
        <Text style={{ color: Colors.darkGray }}>Has the required part: {hasPart ? 'Yes' : 'No'}</Text>
        <Text style={{ color: Colors.darkGray }}>{distanceKm.toFixed(1)} km away</Text>
        <Text style={{ color: Colors.darkGray }}>Skill score: {score.toFixed(1)} / 10</Text>
        <Text style={{ color: Colors.darkGray }}>Rated {rating.toFixed(1)} by {jobsCompleted} customers</Text>
      </View>
    </Card>
  );
};
