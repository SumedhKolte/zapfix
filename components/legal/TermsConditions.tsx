import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export const TERMS_LAST_UPDATED = 'June 12, 2026';

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
    icon: 'information-circle-outline',
    title: 'About ZapFix',
    blocks: [
      { type: 'paragraph', text: 'ZapFix is a technology platform that helps users:' },
      { type: 'bullets', items: [
        'Upload appliance photos and videos',
        'Receive AI-assisted issue diagnostics',
        'Connect with independent service professionals',
        'Request home repair and maintenance services',
      ] },
      { type: 'paragraph', text: 'ZapFix acts solely as a platform facilitating connections between users and independent service professionals. ZapFix is not a service provider and does not itself perform repairs.' },
    ],
  },
  {
    id: '2',
    icon: 'person-outline',
    title: 'Eligibility',
    blocks: [
      { type: 'paragraph', text: 'You must be at least 18 years old and legally capable of entering into a binding contract under applicable law to use ZapFix.' },
      { type: 'paragraph', text: 'By using the platform, you represent that you are legally capable of entering into a binding agreement and that all information you provide is accurate and complete.' },
    ],
  },
  {
    id: '3',
    icon: 'lock-closed-outline',
    title: 'User Accounts',
    blocks: [
      { type: 'paragraph', text: 'You may be required to create an account. You are responsible for:' },
      { type: 'bullets', items: [
        'Maintaining account security',
        'Protecting your login credentials',
        'All activities performed through your account',
      ] },
      { type: 'paragraph', text: 'You must immediately notify ZapFix of any unauthorized use of your account.' },
    ],
  },
  {
    id: '4',
    icon: 'sparkles-outline',
    title: 'AI Diagnosis Disclaimer',
    blocks: [
      { type: 'paragraph', text: 'ZapFix may provide AI-generated appliance diagnostics based on photos, videos, and user-provided information. AI-generated results:' },
      { type: 'bullets', items: [
        'Are estimates only',
        'Are not guaranteed to be accurate',
        'Should not be considered professional technical advice',
        'May differ from actual inspection results',
      ] },
      { type: 'paragraph', text: 'You should rely on qualified professionals for final repair decisions. ZapFix accepts no liability for decisions made on the basis of AI-generated output.' },
    ],
  },
  {
    id: '5',
    icon: 'people-outline',
    title: 'Service Professionals',
    blocks: [
      { type: 'paragraph', text: 'Service professionals available through ZapFix are independent service providers and are not employees, agents, or partners of ZapFix. No agency, partnership, joint venture, or employment relationship is created between ZapFix and any professional or user.' },
      { type: 'paragraph', text: 'While ZapFix may perform verification and screening processes:' },
      { type: 'bullets', items: [
        'ZapFix does not guarantee service quality',
        'ZapFix does not guarantee professional performance',
        'ZapFix is not responsible for the acts or omissions of independent professionals',
      ] },
      { type: 'paragraph', text: 'You are encouraged to review ratings and service details before booking.' },
    ],
  },
  {
    id: '6',
    icon: 'pricetag-outline',
    title: 'Pricing and Payments',
    blocks: [
      { type: 'paragraph', text: 'Service prices may vary depending on appliance type, issue complexity, parts required, location, and professional availability.' },
      { type: 'paragraph', text: 'Any estimates displayed by ZapFix are indicative only and may not represent final charges. Payments processed through third-party payment providers (such as Cashfree) are subject to their own terms and policies.' },
    ],
  },
  {
    id: '7',
    icon: 'arrow-undo-outline',
    title: 'Cancellations and Refunds',
    blocks: [
      { type: 'paragraph', text: 'Cancellation and refund eligibility may vary depending on service status, time of cancellation, and the extent of professional engagement.' },
      { type: 'paragraph', text: 'Refund decisions are made at ZapFix’s reasonable discretion in accordance with ZapFix’s refund policies and applicable laws. Cancellation fees may apply where a professional has already been dispatched or has commenced work.' },
    ],
  },
  {
    id: '8',
    icon: 'hand-left-outline',
    title: 'User Responsibilities',
    blocks: [
      { type: 'paragraph', text: 'You agree not to:' },
      { type: 'bullets', items: [
        'Provide false or misleading information',
        'Misuse the platform',
        'Harass service professionals or other users',
        'Upload illegal, harmful, or misleading content',
        'Attempt to interfere with or disrupt platform operations',
      ] },
      { type: 'paragraph', text: 'ZapFix reserves the right to suspend or terminate accounts that violate these Terms.' },
    ],
  },
  {
    id: '9',
    icon: 'shield-outline',
    title: 'Indemnification',
    blocks: [
      { type: 'paragraph', text: 'You agree to indemnify, defend, and hold harmless ZapFix, its founders, employees, and affiliates from and against any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of or related to your use of the platform, your violation of these Terms, or your violation of any rights of a third party.' },
    ],
  },
  {
    id: '10',
    icon: 'ribbon-outline',
    title: 'Intellectual Property',
    blocks: [
      { type: 'paragraph', text: 'All content, branding, logos, software, designs, and technology associated with ZapFix remain the exclusive property of ZapFix or its licensors. You may not copy, distribute, reverse engineer, or reproduce any part of the platform without prior written authorization.' },
    ],
  },
  {
    id: '11',
    icon: 'alert-circle-outline',
    title: 'Disclaimer of Warranties',
    blocks: [
      { type: 'paragraph', text: 'The platform and all services are provided on an "as is" and "as available" basis, without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. ZapFix does not warrant that the platform will be uninterrupted, error-free, or secure.' },
    ],
  },
  {
    id: '12',
    icon: 'remove-circle-outline',
    title: 'Limitation of Liability',
    blocks: [
      { type: 'paragraph', text: 'To the maximum extent permitted by law, ZapFix shall not be liable for:' },
      { type: 'bullets', items: [
        'Service delays',
        'Repair outcomes',
        'Property damage caused by third-party professionals',
        'Indirect, incidental, special, or consequential damages',
        'Loss of profits, data, or business opportunities',
      ] },
      { type: 'paragraph', text: 'You acknowledge that services are performed by independent professionals. In all cases, ZapFix’s total aggregate liability arising out of or relating to the platform or these Terms shall not exceed the total service fees actually paid by you to ZapFix for the specific service giving rise to the claim during the three (3) months preceding the event.' },
    ],
  },
  {
    id: '13',
    icon: 'cloud-offline-outline',
    title: 'Availability of Services',
    blocks: [
      { type: 'paragraph', text: 'ZapFix does not guarantee continuous availability, availability in all locations, or the availability of specific professionals. Services may be modified, suspended, or discontinued at any time without notice and without liability.' },
    ],
  },
  {
    id: '14',
    icon: 'close-circle-outline',
    title: 'Termination',
    blocks: [
      { type: 'paragraph', text: 'ZapFix may suspend or terminate your access at its discretion, including where these Terms are violated, fraudulent activity is detected, or legal compliance requires action. You may stop using the platform at any time. Provisions relating to intellectual property, indemnification, disclaimers, and limitation of liability survive termination.' },
    ],
  },
  {
    id: '15',
    icon: 'refresh-outline',
    title: 'Changes to Terms',
    blocks: [
      { type: 'paragraph', text: 'ZapFix may update these Terms periodically. Updated versions will be published on the website and/or application. Your continued use of ZapFix after updates constitutes acceptance of the revised Terms.' },
    ],
  },
  {
    id: '16',
    icon: 'business-outline',
    title: 'Governing Law & Dispute Resolution',
    blocks: [
      { type: 'paragraph', text: 'These Terms shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to these Terms shall first be attempted to be resolved amicably, and failing that, shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, seated in India, conducted in English by a sole arbitrator appointed by ZapFix.' },
      { type: 'paragraph', text: 'Subject to the above, the courts located in India shall have exclusive jurisdiction.' },
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

export default function TermsConditions() {
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
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Terms & Conditions</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, marginTop: 14, marginLeft: 2 }}>
            Last updated: {TERMS_LAST_UPDATED}
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
              These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the ZapFix
              mobile application, website, and related services. By accessing or using ZapFix, you agree
              to be bound by these Terms.
            </Text>
          </View>

          {SECTIONS.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}

          {/* Contact */}
          <View style={{ backgroundColor: Colors.navy.primary, borderRadius: 18, padding: 18 }}>
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
                17. Contact Information
              </Text>
            </View>
            <Text style={{ fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,0.8)' }}>
              For questions regarding these Terms, contact:
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
            By accessing or using ZapFix, you acknowledge that you have read, understood, and agreed to
            these Terms and Conditions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
