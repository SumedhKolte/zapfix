import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AIBadge } from '@/components/ui/AIBadge';
import { useAuth } from '@/hooks/useAuth';
import { generateInterviewQuestions, gradeInterview } from '@/lib/gemini';
import { useProfile } from '@/hooks/useProfile';

export default function Interview() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [transcript, setTranscript] = useState<{ question: string; answer: string }[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await generateInterviewQuestions(['general']);
      setQuestions((data?.questions as string[]) ?? []);
    };

    fetchQuestions();
  }, []);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);

  const handleSend = () => {
    if (!currentQuestion || !answer.trim()) {
      return;
    }
    const nextTranscript = [...transcript, { question: currentQuestion, answer }];
    setTranscript(nextTranscript);
    setAnswer('');

    if (currentIndex >= 2) {
      handleGrade(nextTranscript);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleGrade = async (nextTranscript: { question: string; answer: string }[]) => {
    const { data } = await gradeInterview(nextTranscript);
    setScore(data?.score ?? 0);
    setFeedback(data?.feedback ?? '');

    if (profile?.id) {
      await updateProDetails({
        id: profile.id,
        data: {
          ai_skill_score: data?.score ?? 0,
          interview_transcript: nextTranscript,
          onboarding_step: 'toolkit'
        }
      });
    }
  };

  const handleContinue = () => {
    router.replace('/(pro)/onboarding/toolkit');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 3 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>AI Skill Interview</Text>
        <AIBadge size="md" />

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Your responses are graded on accuracy</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>
            Score 7.0 or above to unlock premium jobs.
          </Text>
        </Card>

        {score === null ? (
          <View style={{ gap: 12 }}>
            <Card>
              <Text style={{ color: Colors.darkGray }}>{currentQuestion}</Text>
            </Card>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type your answer"
              style={{
                borderWidth: 1.5,
                borderColor: Colors.border,
                borderRadius: 12,
                padding: 12,
                minHeight: 100,
                textAlignVertical: 'top'
              }}
              multiline
            />
            <Button onPress={handleSend}>Send Answer</Button>
          </View>
        ) : (
          <Card>
            <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.navy.primary }}>{score}</Text>
            <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{feedback}</Text>
            <Button onPress={handleContinue}>Continue to next step</Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
