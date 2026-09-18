import React, { useState, useRef, useCallback } from 'react';
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
const CARD_MARGIN = 6;
const COLS = 4;
const CARD_SIZE = (SCREEN_WIDTH - 48 - CARD_MARGIN * (COLS - 1)) / COLS;

const PAIRS = [
  { emoji: '🐶', word: 'DOG' },
  { emoji: '🐱', word: 'CAT' },
  { emoji: '🌞', word: 'SUN' },
  { emoji: '🌈', word: 'RAINBOW' },
  { emoji: '🍎', word: 'APPLE' },
  { emoji: '🚗', word: 'CAR' },
  { emoji: '🏠', word: 'HOUSE' },
  { emoji: '🌸', word: 'FLOWER' },
];

type CardType = 'picture' | 'word';

interface CardData {
  id: string;
  pairIndex: number;
  type: CardType;
  emoji: string;
  word: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(): CardData[] {
  const pictureCards: CardData[] = PAIRS.map((p, i) => ({
    id: `pic-${i}`,
    pairIndex: i,
    type: 'picture',
    emoji: p.emoji,
    word: p.word,
  }));
  const wordCards: CardData[] = PAIRS.map((p, i) => ({
    id: `word-${i}`,
    pairIndex: i,
    type: 'word',
    emoji: p.emoji,
    word: p.word,
  }));
  return shuffle([...pictureCards, ...wordCards]);
}

interface CardProps {
  card: CardData;
  isSelected: boolean;
  isMatched: boolean;
  shakeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onPress: () => void;
}

function PairCard({ card, isSelected, isMatched, shakeAnim, scaleAnim, onPress }: CardProps) {
  const isPicture = card.type === 'picture';

  const bgColor = isMatched
    ? '#D1FAE5'
    : isPicture
    ? KIDS_COLORS.surface
    : KIDS_COLORS.shapes;

  const borderColor = isMatched
    ? '#10B981'
    : isSelected
    ? KIDS_COLORS.primary
    : 'transparent';

  const borderWidth = isSelected || isMatched ? 3 : 0;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [
            { translateX: shakeAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <AnimatedPressable
        style={[
          styles.card,
          {
            backgroundColor: bgColor,
            borderColor,
            borderWidth,
          },
          isMatched && styles.cardMatched,
        ]}
        onPress={onPress}
        disabled={isMatched}
      >
        {isPicture ? (
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
        ) : (
          <Text style={styles.cardWord}>{card.word}</Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function PictureWordMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [cards, setCards] = useState<CardData[]>(() => createCards());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedPairIndices, setMatchedPairIndices] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const shakeAnims = useRef<Record<string, Animated.Value>>({});
  const scaleAnims = useRef<Record<string, Animated.Value>>({});

  const getShakeAnim = useCallback((id: string) => {
    if (!shakeAnims.current[id]) {
      shakeAnims.current[id] = new Animated.Value(0);
    }
    return shakeAnims.current[id];
  }, []);

  const getScaleAnim = useCallback((id: string) => {
    if (!scaleAnims.current[id]) {
      scaleAnims.current[id] = new Animated.Value(1);
    }
    return scaleAnims.current[id];
  }, []);

  const runShake = useCallback((id1: string, id2: string) => {
    const s1 = getShakeAnim(id1);
    const s2 = getShakeAnim(id2);
    const seq = (anim: Animated.Value) =>
      Animated.sequence([
        Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]);
    Animated.parallel([seq(s1), seq(s2)]).start();
  }, [getShakeAnim]);

  const runMatchScale = useCallback((id1: string, id2: string) => {
    const sc1 = getScaleAnim(id1);
    const sc2 = getScaleAnim(id2);
    const seq = (anim: Animated.Value) =>
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.12, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1.0, duration: 100, useNativeDriver: true }),
      ]);
    Animated.parallel([seq(sc1), seq(sc2)]).start();
  }, [getScaleAnim]);

  const handleCardPress = useCallback(async (card: CardData) => {
    if (isLocked || matchedPairIndices.has(card.pairIndex)) return;

    console.log('[PictureWordMatch] Card pressed:', card.type, card.word, 'id:', card.id);

    if (selectedId === null) {
      setSelectedId(card.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (selectedId === card.id) {
      setSelectedId(null);
      return;
    }

    const selectedCard = cards.find(c => c.id === selectedId);
    if (!selectedCard) {
      setSelectedId(card.id);
      return;
    }

    // Same type — swap selection
    if (selectedCard.type === card.type) {
      console.log('[PictureWordMatch] Same type tapped, swapping selection');
      setSelectedId(card.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsLocked(true);
    setSelectedId(null);

    if (selectedCard.pairIndex === card.pairIndex) {
      // Correct match
      console.log('[PictureWordMatch] Correct match:', card.word);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      runMatchScale(selectedCard.id, card.id);

      const newMatched = new Set([...matchedPairIndices, card.pairIndex]);
      setMatchedPairIndices(newMatched);
      setIsLocked(false);

      if (newMatched.size === PAIRS.length) {
        const stars = mistakes <= 10 ? 3 : mistakes <= 16 ? 2 : 1;
        setEarnedStars(stars);
        console.log('[PictureWordMatch] Game complete! Mistakes:', mistakes, 'Stars:', stars);
        const result = await completeGame('picture-word-match', stars);
        setNewBadges(result.newBadges);
        setShowComplete(true);
      }
    } else {
      // Wrong match
      console.log('[PictureWordMatch] Wrong match:', selectedCard.word, 'vs', card.word);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      runShake(selectedCard.id, card.id);
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setTimeout(() => {
        setIsLocked(false);
      }, 400);
    }
  }, [isLocked, selectedId, cards, matchedPairIndices, mistakes, runShake, runMatchScale, completeGame]);

  const handlePlayAgain = () => {
    console.log('[PictureWordMatch] Play again pressed');
    const newCards = createCards();
    setCards(newCards);
    shakeAnims.current = {};
    scaleAnims.current = {};
    setSelectedId(null);
    setMatchedPairIndices(new Set());
    setMistakes(0);
    setIsLocked(false);
    setShowComplete(false);
  };

  const handleGoHome = () => {
    console.log('[PictureWordMatch] Go home pressed');
    setShowComplete(false);
    if (newBadges.length > 0) {
      setShowBadges(true);
    } else {
      router.back();
    }
  };

  const handleBadgeDismiss = () => {
    console.log('[PictureWordMatch] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
    router.back();
  };

  const matchedCount = matchedPairIndices.size;
  const starsLabel = earnedStars === 3 ? '⭐⭐⭐ Amazing!' : earnedStars === 2 ? '⭐⭐ Great job!' : '⭐ You did it!';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[PictureWordMatch] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.shapes} />
        </AnimatedPressable>
        <Text style={styles.title}>Picture Match 🖼️</Text>
        <Mascot size={56} animate={false} expression="happy" />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>❌ Mistakes: {mistakes}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>✅ {matchedCount}/{PAIRS.length} matched</Text>
        </View>
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>Tap a picture, then tap its matching word!</Text>

      {/* Card Grid */}
      <View style={styles.grid}>
        {cards.map(card => (
          <PairCard
            key={card.id}
            card={card}
            isSelected={selectedId === card.id}
            isMatched={matchedPairIndices.has(card.pairIndex)}
            shakeAnim={getShakeAnim(card.id)}
            scaleAnim={getScaleAnim(card.id)}
            onPress={() => handleCardPress(card)}
          />
        ))}
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={earnedStars}
        message={starsLabel}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />

      <BadgeCelebration
        visible={showBadges}
        badges={newBadges}
        onDismiss={handleBadgeDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.shapesMuted,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  statBadge: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: KIDS_COLORS.text,
  },
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
    justifyContent: 'center',
    flex: 1,
    alignContent: 'center',
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMatched: {
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    elevation: 4,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardWord: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
