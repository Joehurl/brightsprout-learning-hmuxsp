import React, { useState, useRef, useCallback } from 'react';
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

const ROUNDS = [
  ['A', 'B', 'C', 'D'],
  ['E', 'F', 'G', 'H'],
  ['I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T'],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CardState {
  letter: string;
  matched: boolean;
  selected: boolean;
}

export default function LetterMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const buildRound = useCallback((ri: number) => {
    const letters = ROUNDS[ri % ROUNDS.length];
    const upper: CardState[] = letters.map(l => ({ letter: l, matched: false, selected: false }));
    const lower: CardState[] = shuffle(letters.map(l => ({ letter: l.toLowerCase(), matched: false, selected: false })));
    return { upper, lower };
  }, []);

  const [upper, setUpper] = useState<CardState[]>(() => buildRound(0).upper);
  const [lower, setLower] = useState<CardState[]>(() => buildRound(0).lower);
  const [selectedUpper, setSelectedUpper] = useState<number | null>(null);
  const [selectedLower, setSelectedLower] = useState<number | null>(null);

  const shakeAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const flashAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;

  const shakeCard = (indices: number[]) => {
    const anims = indices.map(i =>
      Animated.sequence([
        Animated.timing(shakeAnims[i], { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: 0, duration: 60, useNativeDriver: true }),
      ])
    );
    Animated.parallel(anims).start();
  };

  const flashGreen = (indices: number[]) => {
    const anims = indices.map(i =>
      Animated.sequence([
        Animated.timing(flashAnims[i], { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.timing(flashAnims[i], { toValue: 0, duration: 300, useNativeDriver: false }),
      ])
    );
    Animated.parallel(anims).start();
  };

  const checkMatch = useCallback(async (ui: number, li: number) => {
    const upperLetter = upper[ui].letter;
    const lowerLetter = lower[li].letter;
    const isMatch = upperLetter.toLowerCase() === lowerLetter;

    console.log('[LetterMatch] Checking match:', upperLetter, lowerLetter, isMatch);

    if (isMatch) {
      flashGreen([ui, li + 4]);
      setTimeout(() => {
        setUpper(prev => prev.map((c, i) => i === ui ? { ...c, matched: true, selected: false } : c));
        setLower(prev => prev.map((c, i) => i === li ? { ...c, matched: true, selected: false } : c));
        setSelectedUpper(null);
        setSelectedLower(null);

        const newScore = score + 1;
        setScore(newScore);

        // Check if round complete
        const allMatched = upper.filter((c, i) => i !== ui || c.matched).every(c => c.matched) &&
          upper[ui] !== undefined;

        const remainingUnmatched = upper.filter((c, i) => i !== ui && !c.matched).length;
        if (remainingUnmatched === 0) {
          // Round complete
          const nextRound = roundIndex + 1;
          if (nextRound >= 5) {
            completeGame('letter-match', 3).then(() => setShowComplete(true));
          } else {
            setTimeout(() => {
              setRoundIndex(nextRound);
              const { upper: nu, lower: nl } = buildRound(nextRound);
              setUpper(nu);
              setLower(nl);
            }, 500);
          }
        }
      }, 400);
    } else {
      shakeCard([ui, li + 4]);
      setTimeout(() => {
        setSelectedUpper(null);
        setSelectedLower(null);
        setUpper(prev => prev.map((c, i) => i === ui ? { ...c, selected: false } : c));
        setLower(prev => prev.map((c, i) => i === li ? { ...c, selected: false } : c));
      }, 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upper, lower, score, roundIndex, buildRound, completeGame]);

  const handleUpperPress = (i: number) => {
    if (upper[i].matched) return;
    console.log('[LetterMatch] Upper card pressed:', upper[i].letter);
    setSelectedUpper(i);
    setUpper(prev => prev.map((c, idx) => ({ ...c, selected: idx === i })));
    if (selectedLower !== null) {
      checkMatch(i, selectedLower);
    }
  };

  const handleLowerPress = (i: number) => {
    if (lower[i].matched) return;
    console.log('[LetterMatch] Lower card pressed:', lower[i].letter);
    setSelectedLower(i);
    setLower(prev => prev.map((c, idx) => ({ ...c, selected: idx === i })));
    if (selectedUpper !== null) {
      checkMatch(selectedUpper, i);
    }
  };

  const handlePlayAgain = () => {
    console.log('[LetterMatch] Play again pressed');
    setShowComplete(false);
    setRoundIndex(0);
    setScore(0);
    const { upper: nu, lower: nl } = buildRound(0);
    setUpper(nu);
    setLower(nl);
    setSelectedUpper(null);
    setSelectedLower(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[LetterMatch] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.letters} />
        </AnimatedPressable>
        <Text style={styles.title}>Letter Match 🔤</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Round {roundIndex + 1}/5</Text>
        </View>
      </View>

      <Text style={styles.instruction}>Match the uppercase to lowercase!</Text>

      <View style={styles.gameArea}>
        {/* Uppercase column */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>BIG</Text>
          {upper.map((card, i) => {
            const bgColor = flashAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [card.selected ? KIDS_COLORS.primaryMuted : KIDS_COLORS.surface, '#D1FAE5'],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.card,
                  card.matched && styles.cardMatched,
                  { transform: [{ translateX: shakeAnims[i] }], backgroundColor: bgColor },
                ]}
              >
                <AnimatedPressable
                  onPress={() => handleUpperPress(i)}
                  disabled={card.matched}
                  style={styles.cardInner}
                >
                  <Text style={[styles.cardLetter, card.matched && styles.cardLetterMatched]}>
                    {card.letter}
                  </Text>
                </AnimatedPressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Lowercase column */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>small</Text>
          {lower.map((card, i) => {
            const bgColor = flashAnims[i + 4].interpolate({
              inputRange: [0, 1],
              outputRange: [card.selected ? KIDS_COLORS.primaryMuted : KIDS_COLORS.surface, '#D1FAE5'],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.card,
                  card.matched && styles.cardMatched,
                  { transform: [{ translateX: shakeAnims[i + 4] }], backgroundColor: bgColor },
                ]}
              >
                <AnimatedPressable
                  onPress={() => handleLowerPress(i)}
                  disabled={card.matched}
                  style={styles.cardInner}
                >
                  <Text style={[styles.cardLetter, card.matched && styles.cardLetterMatched]}>
                    {card.letter}
                  </Text>
                </AnimatedPressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={3}
        message="Perfect matching!"
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
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  column: {
    flex: 1,
    gap: 12,
    alignItems: 'center',
  },
  columnLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    marginBottom: 4,
  },
  card: {
    width: 80,
    height: 80,
    borderRadius: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardMatched: {
    opacity: 0.4,
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLetter: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 40,
    color: KIDS_COLORS.text,
  },
  cardLetterMatched: {
    color: KIDS_COLORS.success,
  },
});
