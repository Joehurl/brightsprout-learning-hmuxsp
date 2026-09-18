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
import { playSound } from '@/utils/sounds';

const COUNTING_ROUNDS = [
  { count: 3, emoji: '⭐' }, { count: 5, emoji: '🍎' }, { count: 2, emoji: '🐱' },
  { count: 7, emoji: '🌸' }, { count: 4, emoji: '🦋' }, { count: 6, emoji: '🍭' },
  { count: 8, emoji: '⚽' }, { count: 1, emoji: '🦁' }, { count: 9, emoji: '🌟' },
  { count: 10, emoji: '🐟' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrongAnswers(correct: number): number[] {
  const wrong = new Set<number>();
  while (wrong.size < 2) {
    const offset = Math.floor(Math.random() * 4) + 1;
    const candidate = Math.random() > 0.5 ? correct + offset : Math.max(1, correct - offset);
    if (candidate !== correct) wrong.add(candidate);
  }
  return Array.from(wrong);
}

export default function CountingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const tapAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(1))).current;

  const round = COUNTING_ROUNDS[roundIndex];
  const wrongAnswers = getWrongAnswers(round.count);
  const choices = shuffle([round.count, ...wrongAnswers]);

  const handleTapObject = (i: number) => {
    if (tapped.has(i)) return;
    console.log('[Counting] Object tapped:', i);
    playSound('tap');
    setTapped(prev => new Set([...prev, i]));
    Animated.sequence([
      Animated.spring(tapAnims[i], { toValue: 1.3, useNativeDriver: true, speed: 50 }),
      Animated.spring(tapAnims[i], { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  };

  const handleAnswer = async (choice: number) => {
    if (answered) return;
    const isCorrect = choice === round.count;
    console.log('[Counting] Answer selected:', choice, 'correct:', isCorrect);
    setAnswered(true);
    playSound(isCorrect ? 'correct' : 'wrong');

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(async () => {
      if (roundIndex >= 9) {
        const stars = newScore >= 8 ? 3 : newScore >= 5 ? 2 : 1;
        await completeGame('counting', stars);
        setShowComplete(true);
      } else {
        setRoundIndex(i => i + 1);
        setTapped(new Set());
        setAnswered(false);
        tapAnims.forEach(a => a.setValue(1));
      }
    }, 800);
  };

  const handlePlayAgain = () => {
    console.log('[Counting] Play again pressed');
    setShowComplete(false);
    setRoundIndex(0);
    setScore(0);
    setTapped(new Set());
    setAnswered(false);
    tapAnims.forEach(a => a.setValue(1));
  };

  const stars = score >= 8 ? 3 : score >= 5 ? 2 : 1;
  const objectsArray = Array.from({ length: round.count }, (_, i) => i);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[Counting] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.numbers} />
        </AnimatedPressable>
        <Text style={styles.title}>Counting Stars ⭐</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{roundIndex + 1}/10</Text>
        </View>
      </View>

      <Text style={styles.question}>How many {round.emoji}s do you see?</Text>

      {/* Objects grid */}
      <View style={styles.objectsGrid}>
        {objectsArray.map(i => (
          <AnimatedPressable key={i} onPress={() => handleTapObject(i)}>
            <Animated.View style={[styles.objectWrapper, { transform: [{ scale: tapAnims[i] }] }]}>
              <Text style={styles.objectEmoji}>{round.emoji}</Text>
              {tapped.has(i) && (
                <View style={styles.checkOverlay}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </Animated.View>
          </AnimatedPressable>
        ))}
      </View>

      {tapped.size > 0 && (
        <Text style={styles.countDisplay}>I counted: {tapped.size}</Text>
      )}

      {/* Answer buttons */}
      <View style={styles.answersRow}>
        {choices.map((choice, i) => (
          <AnimatedPressable
            key={i}
            style={[styles.answerBtn, answered && choice === round.count && styles.answerBtnCorrect]}
            onPress={() => handleAnswer(choice)}
            disabled={answered}
          >
            <Text style={styles.answerBtnText}>{choice}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={stars}
        message={score >= 8 ? 'Counting Champion!' : 'Great counting!'}
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
  question: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: KIDS_COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  objectsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  objectWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectEmoji: {
    fontSize: 40,
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: KIDS_COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  countDisplay: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: KIDS_COLORS.numbers,
    textAlign: 'center',
    marginVertical: 12,
  },
  answersRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  answerBtn: {
    flex: 1,
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  answerBtnCorrect: {
    backgroundColor: KIDS_COLORS.success,
  },
  answerBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: KIDS_COLORS.text,
  },
});
