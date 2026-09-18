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

const QUESTIONS = [
  { number: 3, emoji: '⭐' },
  { number: 5, emoji: '🍎' },
  { number: 2, emoji: '🐱' },
  { number: 7, emoji: '🌸' },
  { number: 4, emoji: '🦋' },
  { number: 6, emoji: '🍭' },
  { number: 8, emoji: '⚽' },
  { number: 1, emoji: '🦁' },
  { number: 9, emoji: '🌟' },
  { number: 10, emoji: '🐟' },
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

export default function NumberQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  const question = QUESTIONS[qIndex];
  const choices = getChoices(question.number);

  const handleAnswer = async (choice: number) => {
    if (answered) return;
    const isCorrect = choice === question.number;
    console.log('[NumberQuiz] Answer selected:', choice, 'correct:', isCorrect);
    setAnswered(true);
    setSelectedChoice(choice);

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(async () => {
      if (qIndex >= 9) {
        const stars = newScore >= 8 ? 3 : newScore >= 5 ? 2 : 1;
        await completeGame('number-quiz', stars);
        setShowComplete(true);
      } else {
        setQIndex(i => i + 1);
        setAnswered(false);
        setSelectedChoice(null);
      }
    }, 900);
  };

  const handlePlayAgain = () => {
    console.log('[NumberQuiz] Play again pressed');
    setShowComplete(false);
    setQIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedChoice(null);
  };

  const stars = score >= 8 ? 3 : score >= 5 ? 2 : 1;
  const objectsArray = Array.from({ length: question.number }, (_, i) => i);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[NumberQuiz] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.numbers} />
        </AnimatedPressable>
        <Text style={styles.title}>Number Quiz 🔢</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}/{qIndex}</Text>
        </View>
      </View>

      <View style={styles.questionArea}>
        <Text style={styles.bigNumber}>{question.number}</Text>
        <Text style={styles.instruction}>Pick the card with {question.number} objects!</Text>
      </View>

      <View style={styles.choicesRow}>
        {choices.map((choice, i) => {
          const isCorrect = choice === question.number;
          const isSelected = selectedChoice === choice;
          const cardBg = answered && isSelected
            ? (isCorrect ? KIDS_COLORS.success : KIDS_COLORS.danger)
            : KIDS_COLORS.surface;

          const choiceObjects = Array.from({ length: choice }, (_, j) => j);

          return (
            <AnimatedPressable
              key={i}
              style={[styles.choiceCard, { backgroundColor: cardBg }]}
              onPress={() => handleAnswer(choice)}
              disabled={answered}
            >
              <View style={styles.choiceObjects}>
                {choiceObjects.map(j => (
                  <Text key={j} style={styles.choiceEmoji}>{question.emoji}</Text>
                ))}
              </View>
              <Text style={[styles.choiceNumber, answered && isSelected && { color: '#FFFFFF' }]}>
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
        message={score >= 8 ? 'Number Genius!' : 'Great work!'}
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
  questionArea: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bigNumber: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 96,
    color: KIDS_COLORS.numbers,
    lineHeight: 110,
  },
  instruction: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  choicesRow: {
    flexDirection: 'column',
    gap: 20,
    flex: 1,
    marginBottom: 16,
  },
  choiceCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  choiceObjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    flex: 1,
    alignContent: 'center',
  },
  choiceEmoji: {
    fontSize: 28,
  },
  choiceNumber: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
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
