import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { selectInterviewQuestions, type MCQQuestion } from '@/lib/interviewQuestions';
import { gradeInterview } from '@/lib/gemini';
import { parseInterview } from '@/utils/ai/parseInterview';
import type { InterviewResponse } from '@/utils/ai/validators';

type Answer = {
  question: MCQQuestion;
  selectedOptionId: string | null;
  note: string;
};

const speakQuestion = (q: MCQQuestion) => {
  try {
    Speech.stop();
  } catch {}
  const optionsLine = q.options
    .map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o.text}`)
    .join('. ');
  Speech.speak(`${q.prompt}. ${optionsLine}`, {
    language: 'en-IN',
    pitch: 1.0,
    rate: 0.92,
  });
};

export default function Interview() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');

  // Pull this pro's saved skills → derive trades for question selection.
  const proSkillsQuery = useQuery({
    queryKey: ['pro-skills', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_skills')
        .select('skill_id, catalog_skills:skill_id(trade)')
        .eq('pro_id', profile?.id ?? '');
      if (error) throw error;
      return data ?? [];
    },
  });

  const trades = useMemo(() => {
    const rows = (proSkillsQuery.data ?? []) as any[];
    const set = new Set<string>();
    rows.forEach((r) => {
      const trade = r?.catalog_skills?.trade;
      if (trade) set.add(String(trade));
    });
    return Array.from(set);
  }, [proSkillsQuery.data]);

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pick questions once trades are known (or even with no skills — fallback works).
  useEffect(() => {
    if (proSkillsQuery.isLoading) return;
    const picked = selectInterviewQuestions(trades, 5);
    setQuestions(picked);
    setAnswers(picked.map((q) => ({ question: q, selectedOptionId: null, note: '' })));
  }, [proSkillsQuery.isLoading, trades.join('|')]);

  const currentQuestion = questions[currentIndex];

  // Auto-speak when question changes (if voice is on).
  useEffect(() => {
    if (!currentQuestion || score !== null) return;
    if (voiceOn) speakQuestion(currentQuestion);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    return () => {
      try {
        Speech.stop();
      } catch {}
    };
  }, [currentIndex, currentQuestion?.id, voiceOn]);

  const setOption = (optionId: string) => {
    if (!currentQuestion) return;
    Haptics.selectionAsync().catch(() => undefined);
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, selectedOptionId: optionId } : a))
    );
  };

  const setNote = (text: string) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, note: text } : a))
    );
  };

  const replay = () => {
    if (currentQuestion) speakQuestion(currentQuestion);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    try {
      Speech.stop();
    } catch {}
    setCurrentIndex((i) => i - 1);
  };

  const goNext = async () => {
    const current = answers[currentIndex];
    if (!current?.selectedOptionId) {
      Alert.alert('Pick an option', 'Choose one of the options to continue.');
      return;
    }
    if (currentIndex < questions.length - 1) {
      try {
        Speech.stop();
      } catch {}
      setCurrentIndex((i) => i + 1);
      return;
    }
    await finish();
  };

  const finish = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      try {
        Speech.stop();
      } catch {}
      const correct = answers.filter(
        (a) => a.selectedOptionId === a.question.correctOptionId
      ).length;
      const total = answers.length || 1;
      const localScore = Math.max(1, Math.round((correct / total) * 10));

      const transcript = answers.map((a) => {
        const selected = a.question.options.find((o) => o.id === a.selectedOptionId);
        const correctOption = a.question.options.find((o) => o.id === a.question.correctOptionId);
        return {
          question: a.question.prompt,
          answer: [
            selected ? `Selected: ${selected.text}` : 'No answer selected',
            correctOption ? `Expected answer: ${correctOption.text}` : '',
            a.note ? `Worker note: ${a.note}` : '',
          ].filter(Boolean).join('\n'),
        };
      });

      let aiResult: InterviewResponse | null = null;
      try {
        const response = await gradeInterview(transcript);
        const parsed = parseInterview(response.data);
        if (parsed.success) {
          aiResult = parsed.data;
        }
      } catch (err) {
        console.warn('AI interview grading unavailable, using local score', err);
      }

      const aiScore = aiResult ? Math.max(1, Math.min(10, Math.round(aiResult.score))) : localScore;
      let fb = aiResult?.feedback ?? '';
      if (!fb) {
        if (aiScore >= 9) fb = "Outstanding. You're ready for premium jobs.";
        else if (aiScore >= 7) fb = 'Great work. You cleared the bar for live jobs.';
        else if (aiScore >= 5) fb = "You're on track. Review the explanations and retake any time.";
        else fb = "Some core areas need brushing up. Don't worry, you can retake the test.";
      }

      setScore(aiScore);
      setFeedback(fb);

      await updateProDetails({
        id: profile.id,
        data: {
          ai_skill_score: aiScore,
          interview_transcript: {
            answers: answers.map((a) => ({
              question_id: a.question.id,
              prompt: a.question.prompt,
              selected_option_id: a.selectedOptionId,
              correct_option_id: a.question.correctOptionId,
              note: a.note,
            })),
            local_score: localScore,
            ai_result: aiResult,
            graded_at: new Date().toISOString(),
          },
          interview_locked_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          onboarding_step: 'toolkit',
        },
      });
    } catch (err) {
      console.error('Could not save interview', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(pro)/onboarding/toolkit');
  };

  const handleRetake = () => {
    const picked = selectInterviewQuestions(trades, 5);
    setQuestions(picked);
    setAnswers(picked.map((q) => ({ question: q, selectedOptionId: null, note: '' })));
    setCurrentIndex(0);
    setScore(null);
    setFeedback('');
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (proSkillsQuery.isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.midGray }}>Preparing your interview…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────
  if (score !== null) {
    const correctCount = answers.filter((a) => a.selectedOptionId === a.question.correctOptionId).length;
    const passing = correctCount / answers.length >= 0.7;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 36, alignItems: 'center' }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: passing ? Colors.success : Colors.amber.primary, alignItems: 'center', justifyContent: 'center', shadowColor: passing ? Colors.success : Colors.amber.dark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 14 }}>
              <Text style={{ color: Colors.white, fontSize: 36, fontWeight: '800' }}>{score}</Text>
            </View>
            <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 16 }}>
              {passing ? 'You passed!' : 'Almost there'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
              {feedback}
            </Text>
          </LinearGradient>

          <View style={{ paddingHorizontal: 20, gap: 14, marginTop: -16 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.midGray, letterSpacing: 0.5 }}>CORRECT</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.success, marginTop: 4 }}>{correctCount} / {answers.length}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.midGray, letterSpacing: 0.5 }}>SCORE</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.navy.primary, marginTop: 4 }}>{score}/10</Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text.primary, marginTop: 8, marginLeft: 4 }}>REVIEW</Text>
            {answers.map((a, i) => {
              const wasCorrect = a.selectedOptionId === a.question.correctOptionId;
              const chosenOption = a.question.options.find((o) => o.id === a.selectedOptionId);
              const correctOption = a.question.options.find((o) => o.id === a.question.correctOptionId);
              return (
                <View key={a.question.id} style={{ backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: wasCorrect ? Colors.success + '50' : Colors.error + '50' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: wasCorrect ? Colors.success : Colors.error, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={wasCorrect ? 'checkmark' : 'close'} size={13} color={Colors.white} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: wasCorrect ? Colors.success : Colors.error, letterSpacing: 0.5 }}>
                      QUESTION {i + 1}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: Colors.text.primary, fontWeight: '700' }}>{a.question.prompt}</Text>
                  <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 8 }}>
                    Your answer: <Text style={{ fontWeight: '700', color: wasCorrect ? Colors.success : Colors.error }}>{chosenOption?.text ?? '—'}</Text>
                  </Text>
                  {!wasCorrect ? (
                    <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 2 }}>
                      Correct: <Text style={{ fontWeight: '700', color: Colors.success }}>{correctOption?.text}</Text>
                    </Text>
                  ) : null}
                  {a.question.explanation ? (
                    <Text style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 8, fontStyle: 'italic', lineHeight: 17 }}>
                      {a.question.explanation}
                    </Text>
                  ) : null}
                  {a.note ? (
                    <View style={{ marginTop: 10, backgroundColor: Colors.amber.light, padding: 10, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.amber.dark, letterSpacing: 0.5, marginBottom: 4 }}>YOUR NOTE</Text>
                      <Text style={{ fontSize: 12, color: Colors.text.primary }}>{a.note}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}

            <Button onPress={handleContinue}>
              {passing ? 'Continue to next step' : 'Continue anyway'}
            </Button>
            <Button variant="secondary" onPress={handleRetake}>
              Retake test
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active question screen ───────────────────────────────────────────────
  const current = answers[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>AI SKILL INTERVIEW</Text>
              <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
            </View>
            <Pressable
              onPress={() => setVoiceOn((v) => !v)}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: voiceOn ? Colors.amber.primary : 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={voiceOn ? 'volume-high' : 'volume-mute'} size={18} color={voiceOn ? Colors.navy.primary : Colors.white} />
            </Pressable>
          </View>

          {/* Progress bar */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: Colors.amber.primary, borderRadius: 3 }} />
          </View>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginTop: -14, gap: 14 }}>
          {/* Voice control card */}
          <View style={{ backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: Colors.navy.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.amber.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="mic" size={20} color={Colors.amber.dark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text.primary }}>AI is reading the question</Text>
              <Text style={{ fontSize: 11, color: Colors.midGray, marginTop: 2 }}>Tap replay anytime · toggle the speaker icon to mute</Text>
            </View>
            <Pressable
              onPress={replay}
              style={{ backgroundColor: Colors.navy.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Ionicons name="play" size={13} color={Colors.white} />
              <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '800' }}>Replay</Text>
            </Pressable>
          </View>

          {/* Question */}
          <View style={{ backgroundColor: Colors.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.navy.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.amber.dark, letterSpacing: 0.5 }}>
              {currentQuestion?.trade?.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text.primary, marginTop: 8, lineHeight: 24 }}>
              {currentQuestion?.prompt}
            </Text>
          </View>

          {/* Options */}
          <View style={{ gap: 10 }}>
            {currentQuestion?.options.map((opt, i) => {
              const isSelected = current?.selectedOptionId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setOption(opt.id)}
                  style={{
                    backgroundColor: isSelected ? Colors.amber.light : Colors.white,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 2,
                    borderColor: isSelected ? Colors.amber.primary : Colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: isSelected ? Colors.amber.primary : Colors.lightGray,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? Colors.navy.primary : Colors.midGray }}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text.primary, lineHeight: 19 }}>
                    {opt.text}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.amber.dark} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Note */}
          <View style={{ backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="create-outline" size={15} color={Colors.navy.primary} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text.primary }}>
                Your note <Text style={{ color: Colors.midGray, fontWeight: '500' }}>(optional)</Text>
              </Text>
            </View>
            <TextInput
              value={current?.note ?? ''}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              placeholder="Why did you pick that option? Any real-world example?"
              placeholderTextColor={Colors.midGray}
              style={{
                minHeight: 80,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                padding: 12,
                color: Colors.text.primary,
                fontSize: 13,
                lineHeight: 19,
                backgroundColor: Colors.offWhite,
              }}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          backgroundColor: Colors.white,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        {currentIndex > 0 ? (
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={goPrev}>
              Back
            </Button>
          </View>
        ) : null}
        <View style={{ flex: currentIndex > 0 ? 2 : 1 }}>
          <Button onPress={goNext} loading={submitting} disabled={submitting || !current?.selectedOptionId}>
            {currentIndex === questions.length - 1 ? 'Submit answers' : 'Next question'}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
