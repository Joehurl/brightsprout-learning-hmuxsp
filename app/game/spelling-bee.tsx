import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';
import { BadgeCelebration } from '@/components/BadgeCelebration';
import { Mascot } from '@/components/Mascot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WORDS = [
  { word: 'CAT', emoji: '🐱', hint: 'A furry pet that meows' },
  { word: 'DOG', emoji: '🐶', hint: 'A loyal pet that barks' },
  { word: 'SUN', emoji: '☀️', hint: 'It shines in the sky' },
  { word: 'HAT', emoji: '🎩', hint: 'You wear it on your head' },
  { word: 'CUP', emoji: '☕', hint: 'You drink from it' },
  { word: 'BED', emoji: '🛏️', hint: 'You sleep in it' },
  { word: 'PIG', emoji: '🐷', hint: 'A pink farm animal' },
  { word: 'FOX', emoji: '🦊', hint: 'An orange wild animal' },
  { word: 'HEN', emoji: '🐔', hint: 'A bird that lays eggs' },
  { word: 'MAP', emoji: '🗺️', hint: 'Shows you where to go' },
  { word: 'BUS', emoji: '🚌', hint: 'A big yellow vehicle' },
  { word: 'JAM', emoji: '🍓', hint: 'Sweet spread for toast' },
  { word: 'NET', emoji: '🥅', hint: 'Used to catch things' },
  { word: 'LOG', emoji: '🪵', hint: 'A piece of wood' },
  { word: 'ZIP', emoji: '🤐', hint: 'Closes your jacket' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLetterChoices(word: string): string[] {
  const wordLetters = word.split('');
  const extras: string[] = [];
  while (extras.length < 6) {
    const l = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!wordLetters.includes(l) && !extras.includes(l)) {
      extras.push(l);
    }
  }
  return shuffleArray([...wordLetters, ...extras]);
}

export default function SpellingBeeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [roundIndex, setRoundIndex] = useState(0);
  const [wordOrder] = useState(() => shuffleArray(WORDS.slice(0, 15)).slice(0, 5));
  const [typed, setTyped] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);
  const [letterChoices, setLetterChoices] = useState<string[]>([]);
  const [correctFlash, setCorrectFlash] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const currentWord = wordOrder[roundIndex];

  useEffect(() => {
    if (currentWord) {
      setLetterChoices(getLetterChoices(currentWord.word));
      setTyped([]);
      setMistakes(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  useEffect(() => {
    if (currentWord) {
      setLetterChoices(getLetterChoices(currentWord.word));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shakeWord = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const flashCorrect = useCallback(() => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  }, [flashAnim]);

  const handleLetterPress = useCallback(async (letter: string) => {
    if (!currentWord) return;
    const nextIndex = typed.length;
    const expectedLetter = currentWord.word[nextIndex];

    console.log('[SpellingBee] Letter pressed:', letter, 'expected:', expectedLetter);

    if (letter === expectedLetter) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newTyped = [...typed, letter];
      setTyped(newTyped);

      if (newTyped.length === currentWord.word.length) {
        // Word complete!
        console.log('[SpellingBee] Word complete:', currentWord.word, 'mistakes:', mistakes);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        flashCorrect();
        setCorrectFlash(true);
        setTimeout(async () => {
          setCorrectFlash(false);
          const nextRound = roundIndex + 1;
          const roundMistakes = mistakes;
          const newTotal = totalMistakes + roundMistakes;
          setTotalMistakes(newTotal);

          if (nextRound >= 5) {
            // Game over
            const stars = newTotal === 0 ? 3 : newTotal <= 2 ? 2 : 1;
            setEarnedStars(stars);
            const result = await completeGame('spelling-bee', stars);
            setNewBadges(result.newBadges);
            setShowComplete(true);
          } else {
            setRoundIndex(nextRound);
          }
        }, 700);
      }
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setMistakes(m => m + 1);
      shakeWord();
    }
  }, [typed, currentWord, mistakes, totalMistakes, roundIndex, completeGame, shakeWord, flashCorrect]);

  const handleDelete = () => {
    console.log('[SpellingBee] Delete pressed');
    setTyped(t => t.slice(0, -1));
  };

  const handlePlayAgain = () => {
    console.log('[SpellingBee] Play again pressed');
    setShowComplete(false);
    setRoundIndex(0);
    setTyped([]);
    setMistakes(0);
    setTotalMistakes(0);
  };

  const handleBadgeDismiss = () => {
    console.log('[SpellingBee] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
  };

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(52,211,153,0)', 'rgba(52,211,153,0.3)'],
  });

  if (!currentWord) return null;

  const wordDisplay = currentWord.word.split('').map((letter, i) => {
    const isTyped = i < typed.length;
    const isNext = i === typed.length;
    return { letter, isTyped, isNext };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[SpellingBee] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.letters} />
        </AnimatedPressable>
        <Text style={styles.title}>Spelling Bee 🐝</Text>
        <Mascot size={56} animate={false} expression="thinking" />
      </View>

      {/* Round indicator */}
      <View style={styles.roundRow}>
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.roundDot,
              i < roundIndex && styles.roundDotDone,
              i === roundIndex && styles.roundDotActive,
            ]}
          />
        ))}
      </View>

      {/* Word emoji + hint */}
      <View style={styles.wordDisplay}>
        <Text style={styles.wordEmoji}>{currentWord.emoji}</Text>
        <Text style={styles.hintText}>{currentWord.hint}</Text>
      </View>

      {/* Typed word display */}
      <Animated.View
        style={[
          styles.typedRow,
          { transform: [{ translateX: shakeAnim }], backgroundColor: flashBg as any },
        ]}
      >
        {wordDisplay.map((item, i) => (
          <View
            key={i}
            style={[
              styles.letterSlot,
              item.isTyped && styles.letterSlotFilled,
              item.isNext && styles.letterSlotNext,
              correctFlash && item.isTyped && styles.letterSlotCorrect,
            ]}
          >
            <Text style={[styles.letterSlotText, item.isTyped && styles.letterSlotTextFilled]}>
              {item.isTyped ? item.letter : '_'}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Mistakes */}
      <Text style={styles.mistakesText}>
        {mistakes === 0 ? '✨ Perfect so far!' : `❌ ${mistakes} mistake${mistakes > 1 ? 's' : ''}`}
      </Text>

      {/* Letter tiles */}
      <View style={styles.tilesGrid}>
        {letterChoices.map((letter, i) => {
          const alreadyUsed = typed.includes(letter) && typed.filter(l => l === letter).length >= currentWord.word.split('').filter(l => l === letter).length;
          return (
            <AnimatedPressable
              key={i}
              style={[styles.letterTile, alreadyUsed && styles.letterTileUsed]}
              onPress={() => !alreadyUsed && handleLetterPress(letter)}
              disabled={alreadyUsed}
            >
              <Text style={[styles.letterTileText, alreadyUsed && styles.letterTileTextUsed]}>
                {letter}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Delete button */}
      {typed.length > 0 && (
        <AnimatedPressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>⌫ Delete</Text>
        </AnimatedPressable>
      )}

      <GameCompleteOverlay
        visible={showComplete}
        stars={earnedStars}
        message={earnedStars === 3 ? 'Perfect Spelling!' : earnedStars === 2 ? 'Great Job!' : 'You Did It!'}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => {
          setShowComplete(false);
          if (newBadges.length > 0) {
            setShowBadges(true);
          } else {
            router.back();
          }
        }}
      />

      <BadgeCelebration
        visible={showBadges}
        badges={newBadges}
        onDismiss={handleBadgeDismiss}
      />
    </View>
  );
}

const TILE_SIZE = (SCREEN_WIDTH - 48 - 30) / 6;

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
    marginBottom: 12,
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
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  roundDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: KIDS_COLORS.border,
  },
  roundDotDone: {
    backgroundColor: KIDS_COLORS.success,
  },
  roundDotActive: {
    backgroundColor: KIDS_COLORS.letters,
    width: 20,
  },
  wordDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  hintText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
  typedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  letterSlot: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: KIDS_COLORS.border,
    backgroundColor: KIDS_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSlotFilled: {
    borderColor: KIDS_COLORS.letters,
    backgroundColor: KIDS_COLORS.lettersMuted,
  },
  letterSlotNext: {
    borderColor: KIDS_COLORS.letters,
    borderStyle: 'dashed',
  },
  letterSlotCorrect: {
    borderColor: KIDS_COLORS.success,
    backgroundColor: '#D1FAE5',
  },
  letterSlotText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: KIDS_COLORS.textTertiary,
  },
  letterSlotTextFilled: {
    color: KIDS_COLORS.letters,
  },
  mistakesText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  letterTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 12,
    backgroundColor: KIDS_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: KIDS_COLORS.letters,
  },
  letterTileUsed: {
    opacity: 0.3,
    borderColor: KIDS_COLORS.border,
  },
  letterTileText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.letters,
  },
  letterTileTextUsed: {
    color: KIDS_COLORS.textTertiary,
  },
  deleteBtn: {
    alignSelf: 'center',
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: KIDS_COLORS.border,
  },
  deleteBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
  },
});
