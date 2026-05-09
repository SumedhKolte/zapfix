import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

function Card({ children, title, icon }: any) {
  return (
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {icon && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: Colors.amber.light,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={16} color={Colors.amber.primary} />
          </View>
        )}
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ActiveJob() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
            Current Job
          </Text>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
            Active Job
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>
            Complete all steps to finish this job
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, gap: 16, paddingTop: 20 }}>
          {/* Navigation Card */}
          <Card title="Navigation" icon="navigate-outline">
            <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
              Start navigation to the customer location
            </Text>
            <Button>I've Arrived</Button>
          </Card>

          {/* Before Photo Card */}
          <Card title="Before Photo" icon="camera-outline">
            <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
              Take a photo of the issue before starting work
            </Text>
            <Button variant="secondary">Upload Before Photo</Button>
          </Card>

          {/* Work Progress Card */}
          <Card title="Work Progress" icon="hammer-outline">
            <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
              Document your work as you progress
            </Text>
            <View
              style={{
                backgroundColor: Colors.amber.light,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="information-circle-outline" size={16} color={Colors.amber.primary} />
              <Text style={{ fontSize: 11, color: Colors.amber.primary, fontWeight: '500', flex: 1 }}>
                Update photos to show your progress
              </Text>
            </View>
          </Card>

          {/* After Photo Card */}
          <Card title="After Photo" icon="checkmark-circle-outline">
            <Text style={{ fontSize: 12, color: Colors.midGray, marginBottom: 12 }}>
              Take a photo of the completed work
            </Text>
            <Button variant="secondary">Upload After Photo</Button>
          </Card>

          {/* Complete Job */}
          <Button onPress={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="checkmark-done" size={18} color={Colors.white} />
              <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 15 }}>Complete Job</Text>
            </View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
