import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';

interface Choice {
  emoji: string;
  word: string;
}

interface Question {
  letter: string;
  correct: Choice;
  wrong: Choice[];
}

const PHONICS_QUESTIONS: Question[] = [
  { letter: 'B', correct: { emoji: '⚽', word: 'Ball' }, wrong: [{ emoji: '🐱', word: 'Cat' }, { emoji: '🐶', word: 'Dog' }] },
  { letter: 'C', correct: { emoji: '🐱', word: 'Cat' }, wrong: [{ emoji: '🍎', word: 'Apple' }, { emoji: '⚽', word: 'Ball' }] },
  { letter: 'D', correct: { emoji: '🐶', word: 'Dog' }, wrong: [{ emoji: '🐟', word: 'Fish' }, { emoji: '🍇', word: 'Grapes' }] },
  { letter: 'F', correct: { emoji: '🐟', word: 'Fish' }, wrong: [{ emoji: '🎩', word: 'Hat' }, { emoji: '🦁', word: 'Lion' }] },
  { letter: 'H', correct: { emoji: '🎩', word: 'Hat' }, wrong: [{ emoji: '🍦', word: 'Ice Cream' }, { emoji: '🪁', word: 'Kite' }] },
  { letter: 'L', correct: { emoji: '🦁', word: 'Lion' }, wrong: [{ emoji: '🌙', word: 'Moon' }, { emoji: '🐧', word: 'Penguin' }] },
  { letter: 'M', correct: { emoji: '🌙', word: 'Moon' }, wrong: [{ emoji: '🌈', word: 'Rainbow' }, { emoji: '☀️', word: 'Sun' }] },
  { letter: 'P', correct: { emoji: '🐧', word: 'Penguin' }, wrong: [{ emoji: '👑', word: 'Queen' }, { emoji: '🐯', word: 'Tiger' }] },
  { letter: 'R', correct: { emoji: '🌈', word: 'Rainbow' }, wrong: [{ emoji: '☀️', word: 'Sun' }, { emoji: '🐋', word: 'Whale' }] },
  { letter: 'S', correct: { emoji: '☀️', word: 'Sun' }, wrong: [{ emoji: '🐯', word: 'Tiger' }, { emoji: '🦓', word: 'Zebra' }] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PhonicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [answered, setAnswered] = useState(false);

  const shakeAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const flashAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const question = PHONICS_QUESTIONS[qIndex];
  const choices = shuffle([question.correct, ...question.wrong]);

  const handleAnswer = async (choice: Choice) => {
    if (answered) return;
    const isCorrect = choice.word === question.correct.word;
    console.log('[Phonics] Answer selected:', choice.word, 'correct:', isCorrect);
    setAnswered(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    const choiceIndex = choices.findIndex(c => c.word === choice.word);

    if (isCorrect) {
      Animated.spring(flashAnims[choiceIndex], { toValue: 1, useNativeDriver: false }).start();
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(async () => {
        flashAnims[choiceIndex].setValue(0);
        if (qIndex >= 9) {
          const stars = newScore >= 8 ? 3 : newScore >= 5 ? 2 : 1;
          await completeGame('phonics', stars);
          setShowComplete(true);
        } else {
          setQIndex(i => i + 1);
          setFeedback(null);
          setAnswered(false);
        }
      }, 1000);
    } else {
      Animated.sequence([
        Animated.timing(shakeAnims[choiceIndex], { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[choiceIndex], { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[choiceIndex], { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[choiceIndex], { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        shakeAnims.forEach(a => a.setValue(0));
        setFeedback(null);
        setAnswered(false);
      }, 1200);
    }
  };

  const handlePlayAgain = () => {
    console.log('[Phonics] Play again pressed');
    setShowComplete(false);
    setQIndex(0);
    setScore(0);
    setFeedback(null);
    setAnswered(false);
  };

  const stars = score >= 8 ? 3 : score >= 5 ? 2 : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[Phonics] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.letters} />
        </AnimatedPressable>
        <Text style={styles.title}>Phonics Fun 🔊</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}/{qIndex + (answered ? 1 : 0)}</Text>
        </View>
      </View>

      <View style={styles.questionArea}>
        <View style={styles.letterCircle}>
          <Text style={styles.letterText}>{question.letter}</Text>
        </View>
        <Text style={styles.questionText}>Which one starts with {question.letter}?</Text>
      </View>

      {feedback === 'wrong' && (
        <Text style={styles.tryAgain}>Try again! 🤔</Text>
      )}

      <View style={styles.choicesRow}>
        {choices.map((choice, i) => {
          const bgColor = flashAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [KIDS_COLORS.surface, '#D1FAE5'],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.choiceCard,
                { transform: [{ translateX: shakeAnims[i] }], backgroundColor: bgColor },
              ]}
            >
              <AnimatedPressable
                onPress={() => handleAnswer(choice)}
                style={styles.choiceInner}
              >
                <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
                <Text style={styles.choiceWord}>{choice.word}</Text>
              </AnimatedPressable>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.progress}>Question {qIndex + 1} of 10</Text>

      <GameCompleteOverlay
        visible={showComplete}
        stars={stars}
        message={score >= 8 ? 'Phonics Master!' : score >= 5 ? 'Great job!' : 'Keep practicing!'}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.lettersMuted,
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
    backgroundColor: KIDS_COLORS.letters,
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
    marginBottom: 16,
    flex: 1,
    justifyContent: 'center',
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: KIDS_COLORS.letters,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  letterText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 72,
    color: '#FFFFFF',
    lineHeight: 80,
  },
  questionText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  tryAgain: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  choicesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  choiceCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  choiceInner: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  choiceEmoji: {
    fontSize: 48,
  },
  choiceWord: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  progress: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
