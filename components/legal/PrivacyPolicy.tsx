import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export const PRIVACY_LAST_UPDATED = 'June 12, 2026';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'bullets'; items: string[] };

type Section = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  blocks: Block[];
};

const SECTIONS: Section[] = [
  {
    id: '1',
    icon: 'person-circle-outline',
    title: 'Information We Collect',
    blocks: [
      { type: 'subheading', text: 'Personal Information' },
      { type: 'paragraph', text: 'When you use ZapFix, we may collect your name, phone number, email address, profile information, and service address.' },
      { type: 'subheading', text: 'Location Information' },
      { type: 'paragraph', text: 'With your permission, we collect your device location to match you with nearby service professionals, improve service availability, and provide location-based services.' },
      { type: 'subheading', text: 'Photos and Videos' },
      { type: 'paragraph', text: 'You may upload photos and videos of appliances or service issues for AI-powered diagnosis, service request creation, and communication with professionals.' },
      { type: 'subheading', text: 'Device & Usage Information' },
      { type: 'bullets', items: [
        'Device type, operating system, and app version',
        'IP address and approximate network location',
        'Diagnostic, performance, and crash information',
        'Push notification tokens (to deliver job and service alerts)',
      ] },
      { type: 'subheading', text: 'Professional Information' },
      { type: 'paragraph', text: 'For service professionals, we may additionally collect identity verification details, Aadhaar or government-issued identification (where applicable), bank account details for payouts, skill assessment results, and business information.' },
    ],
  },
  {
    id: '2',
    icon: 'construct-outline',
    title: 'How We Use Information',
    blocks: [
      { type: 'bullets', items: [
        'Provide and operate ZapFix services',
        'Generate AI-powered appliance diagnostics',
        'Connect users with service professionals',
        'Process bookings and payments',
        'Verify professional accounts',
        'Send service updates and push notifications',
        'Improve platform performance and reliability',
        'Prevent fraud and abuse',
        'Provide customer support',
        'Comply with legal obligations',
      ] },
    ],
  },
  {
    id: '3',
    icon: 'sparkles-outline',
    title: 'AI Diagnosis',
    blocks: [
      { type: 'paragraph', text: 'ZapFix uses artificial intelligence and machine learning to analyze uploaded images, videos, and descriptions of appliance issues.' },
      { type: 'paragraph', text: 'AI-generated results are informational only and should not be considered professional technical advice. Actual diagnoses and repairs may vary depending on the condition of the appliance.' },
    ],
  },
  {
    id: '4',
    icon: 'share-social-outline',
    title: 'Sharing of Information',
    blocks: [
      { type: 'subheading', text: 'Service Professionals' },
      { type: 'paragraph', text: 'Relevant details are shared with the professional assigned to your request, including your name, contact information, service address, uploaded photos or videos, and service details.' },
      { type: 'subheading', text: 'Service Providers' },
      { type: 'paragraph', text: 'We share information with trusted third parties that help us operate, including cloud hosting providers, analytics providers, payment processors (such as Cashfree), and identity verification providers.' },
      { type: 'subheading', text: 'Legal Requirements' },
      { type: 'paragraph', text: 'We may disclose information if required by law or to protect the rights, safety, and security of ZapFix, our users, or others. We never sell your personal information.' },
    ],
  },
  {
    id: '5',
    icon: 'shield-checkmark-outline',
    title: 'Data Security',
    blocks: [
      { type: 'paragraph', text: 'We implement reasonable security measures to protect your information from unauthorized access, disclosure, alteration, or destruction. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.' },
    ],
  },
  {
    id: '6',
    icon: 'time-outline',
    title: 'Data Retention',
    blocks: [
      { type: 'paragraph', text: 'We retain information only as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.' },
      { type: 'paragraph', text: 'You may request deletion of your account at any time, subject to applicable legal requirements.' },
    ],
  },
  {
    id: '7',
    icon: 'key-outline',
    title: 'Your Rights',
    blocks: [
      { type: 'paragraph', text: 'Depending on applicable laws, including India’s Digital Personal Data Protection Act, 2023, you may have the right to:' },
      { type: 'bullets', items: [
        'Access your information',
        'Update inaccurate information',
        'Request deletion of your information',
        'Withdraw certain permissions',
        'Raise a grievance regarding your data',
      ] },
      { type: 'paragraph', text: 'Requests may be submitted through our support channels listed below.' },
    ],
  },
  {
    id: '8',
    icon: 'happy-outline',
    title: "Children's Privacy",
    blocks: [
      { type: 'paragraph', text: 'ZapFix is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.' },
    ],
  },
  {
    id: '9',
    icon: 'link-outline',
    title: 'Third-Party Services',
    blocks: [
      { type: 'paragraph', text: 'ZapFix integrates with third-party services such as payment providers, mapping services, authentication providers, and analytics services. These services may have their own privacy policies governing their use of information.' },
    ],
  },
  {
    id: '10',
    icon: 'refresh-outline',
    title: 'Changes to This Policy',
    blocks: [
      { type: 'paragraph', text: 'We may update this Privacy Policy from time to time. Changes will be posted within the application or on our website, along with an updated revision date.' },
    ],
  },
];

function Bullet({ text }: { text: string }) {
  const { colors: Colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.amber.primary, marginTop: 6 }} />
      <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 20, color: Colors.text.secondary }}>{text}</Text>
    </View>
  );
}

function SectionCard({ section }: { section: Section }) {
  const { colors: Colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: Colors.amber.light,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={section.icon} size={20} color={Colors.amber.dark} />
        </View>
        <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '800', color: Colors.text.primary }}>
          {section.id}. {section.title}
        </Text>
      </View>

      {section.blocks.map((block, i) => {
        if (block.type === 'subheading') {
          return (
            <Text
              key={i}
              style={{ fontSize: 13.5, fontWeight: '700', color: Colors.text.primary, marginTop: 12 }}
            >
              {block.text}
            </Text>
          );
        }
        if (block.type === 'bullets') {
          return (
            <View key={i} style={{ marginTop: 2 }}>
              {block.items.map((item, j) => (
                <Bullet key={j} text={item} />
              ))}
            </View>
          );
        }
        return (
          <Text
            key={i}
            style={{ fontSize: 13.5, lineHeight: 20, color: Colors.text.secondary, marginTop: 8 }}
          >
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

export default function PrivacyPolicy() {
  const { colors: Colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light]}
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Privacy Policy</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, marginTop: 14, marginLeft: 2 }}>
            Last updated: {PRIVACY_LAST_UPDATED}
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16, marginTop: -16, gap: 14 }}>
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 18,
              padding: 18,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontSize: 13.5, lineHeight: 20, color: Colors.text.secondary }}>
              This Privacy Policy explains how ZapFix (&quot;ZapFix&quot;, &quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;) collects, uses, discloses, and protects your information when you use the
              ZapFix mobile application and related services. By using ZapFix, you agree to the collection
              and use of information in accordance with this Privacy Policy.
            </Text>
          </View>

          {SECTIONS.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}

          {/* Contact */}
          <View
            style={{
              backgroundColor: Colors.navy.primary,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: 'rgba(245,166,35,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="mail-outline" size={20} color={Colors.amber.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '800', color: Colors.white }}>
                11. Contact Us
              </Text>
            </View>
            <Text style={{ fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,0.8)' }}>
              For questions or to exercise your data rights, contact our Grievance Officer:
            </Text>
            <Pressable
              onPress={() => Linking.openURL('mailto:support.zapfix@gmail.com')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
            >
              <Ionicons name="mail" size={16} color={Colors.amber.primary} />
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: Colors.white }}>support.zapfix@gmail.com</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('https://zapfix.vercel.app/')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}
            >
              <Ionicons name="globe-outline" size={16} color={Colors.amber.primary} />
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: Colors.white }}>https://zapfix.vercel.app</Text>
            </Pressable>
          </View>

          <Text
            style={{
              fontSize: 11.5,
              lineHeight: 17,
              color: Colors.text.muted,
              textAlign: 'center',
              paddingHorizontal: 12,
              marginTop: 4,
            }}
          >
            By using ZapFix, you acknowledge that you have read and understood this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
