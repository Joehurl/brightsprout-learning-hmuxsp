import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';

const ADDITION_QUESTIONS = [
  { a: 1, b: 1, emoji: '⭐' }, { a: 2, b: 1, emoji: '🍎' }, { a: 2, b: 2, emoji: '🐱' },
  { a: 3, b: 1, emoji: '🌸' }, { a: 3, b: 2, emoji: '🦋' }, { a: 4, b: 1, emoji: '🍭' },
  { a: 3, b: 3, emoji: '⚽' }, { a: 4, b: 2, emoji: '🌟' }, { a: 5, b: 2, emoji: '🐟' },
  { a: 4, b: 3, emoji: '🎈' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getChoices(correct: number): number[] {
  const wrong = new Set<number>();
  while (wrong.size < 2) {
    const offset = Math.floor(Math.random() * 3) + 1;
    const c = Math.random() > 0.5 ? correct + offset : Math.max(1, correct - offset);
    if (c !== correct) wrong.add(c);
  }
  return shuffle([correct, ...Array.from(wrong)]);
}

export default function AdditionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  const question = ADDITION_QUESTIONS[qIndex];
  const correctAnswer = question.a + question.b;
  const choices = getChoices(correctAnswer);

  const handleAnswer = async (choice: number) => {
    if (answered) return;
    const isCorrect = choice === correctAnswer;
    console.log('[Addition] Answer selected:', choice, 'correct:', isCorrect);
    setAnswered(true);
    setSelectedChoice(choice);

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(async () => {
      if (qIndex >= 9) {
        const stars = newScore >= 8 ? 3 : newScore >= 5 ? 2 : 1;
        await completeGame('addition', stars);
        setShowComplete(true);
      } else {
        setQIndex(i => i + 1);
        setAnswered(false);
        setSelectedChoice(null);
      }
    }, 900);
  };

  const handlePlayAgain = () => {
    console.log('[Addition] Play again pressed');
    setShowComplete(false);
    setQIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedChoice(null);
  };

  const stars = score >= 8 ? 3 : score >= 5 ? 2 : 1;
  const aObjects = Array.from({ length: question.a }, (_, i) => i);
  const bObjects = Array.from({ length: question.b }, (_, i) => i);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[Addition] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.numbers} />
        </AnimatedPressable>
        <Text style={styles.title}>Adding Up ➕</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}/{qIndex}</Text>
        </View>
      </View>

      <View style={styles.equationArea}>
        {/* Group A */}
        <View style={styles.group}>
          <View style={styles.objectsGrid}>
            {aObjects.map(i => (
              <Text key={i} style={styles.objectEmoji}>{question.emoji}</Text>
            ))}
          </View>
          <Text style={styles.groupNumber}>{question.a}</Text>
        </View>

        <Text style={styles.plusSign}>+</Text>

        {/* Group B */}
        <View style={styles.group}>
          <View style={styles.objectsGrid}>
            {bObjects.map(i => (
              <Text key={i} style={styles.objectEmoji}>{question.emoji}</Text>
            ))}
          </View>
          <Text style={styles.groupNumber}>{question.b}</Text>
        </View>

        <Text style={styles.equalsSign}>=</Text>
        <Text style={styles.questionMark}>?</Text>
      </View>

      <View style={styles.answersRow}>
        {choices.map((choice, i) => {
          const isCorrect = choice === correctAnswer;
          const isSelected = selectedChoice === choice;
          const cardBg = answered && isSelected
            ? (isCorrect ? KIDS_COLORS.success : KIDS_COLORS.danger)
            : KIDS_COLORS.surface;

          return (
            <AnimatedPressable
              key={i}
              style={[styles.answerBtn, { backgroundColor: cardBg }]}
              onPress={() => handleAnswer(choice)}
              disabled={answered}
            >
              <Text style={[styles.answerText, answered && isSelected && { color: '#FFFFFF' }]}>
                {choice}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={styles.progress}>Question {qIndex + 1} of 10</Text>

      <GameCompleteOverlay
        visible={showComplete}
        stars={stars}
        message={score >= 8 ? 'Math Wizard!' : 'Great adding!'}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.numbersMuted,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KIDS_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.text,
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: KIDS_COLORS.numbers,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  equationArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  group: {
    alignItems: 'center',
    gap: 8,
  },
  objectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 80,
    gap: 2,
  },
  objectEmoji: {
    fontSize: 28,
  },
  groupNumber: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    color: KIDS_COLORS.numbers,
  },
  plusSign: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 48,
    color: KIDS_COLORS.primary,
  },
  equalsSign: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 48,
    color: KIDS_COLORS.text,
  },
  questionMark: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 64,
    color: KIDS_COLORS.numbers,
  },
  answersRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  answerBtn: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  answerText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    color: KIDS_COLORS.text,
  },
  progress: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
