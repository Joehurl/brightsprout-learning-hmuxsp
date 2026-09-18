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
import Svg, { Circle, Rect, Polygon, Path } from 'react-native-svg';
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

const SHAPE_PAIRS = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'] as const;
type ShapeId = typeof SHAPE_PAIRS[number];

const SHAPE_COLORS: Record<ShapeId, string> = {
  circle: '#4ECDC4',
  square: '#FF6B6B',
  triangle: '#F59E0B',
  star: '#A78BFA',
  heart: '#FF6B9D',
  diamond: '#34D399',
};

interface CardData {
  id: number;
  shape: ShapeId;
  pairId: number;
}

function ShapeIcon({ shape, size }: { shape: ShapeId; size: number }) {
  const color = SHAPE_COLORS[shape];
  const s = size;

  if (shape === 'circle') {
    return (
      <Svg width={s} height={s}>
        <Circle cx={s / 2} cy={s / 2} r={s / 2 - 4} fill={color} />
      </Svg>
    );
  }
  if (shape === 'square') {
    return (
      <Svg width={s} height={s}>
        <Rect x={6} y={6} width={s - 12} height={s - 12} fill={color} rx={4} />
      </Svg>
    );
  }
  if (shape === 'triangle') {
    const pts = `${s / 2},4 ${s - 4},${s - 4} 4,${s - 4}`;
    return (
      <Svg width={s} height={s}>
        <Polygon points={pts} fill={color} />
      </Svg>
    );
  }
  if (shape === 'star') {
    const cx = s / 2;
    const cy = s / 2;
    const outerR = s / 2 - 4;
    const innerR = outerR * 0.4;
    let d = '';
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      d += (i === 0 ? 'M' : 'L') + `${x},${y}`;
    }
    d += 'Z';
    return (
      <Svg width={s} height={s}>
        <Path d={d} fill={color} />
      </Svg>
    );
  }
  if (shape === 'heart') {
    const hw = s - 8;
    const hh = s - 8;
    const ox = 4;
    const oy = 4;
    const d = `M ${ox + hw / 2},${oy + hh * 0.3} C ${ox + hw / 2},${oy} ${ox},${oy} ${ox},${oy + hh * 0.3} C ${ox},${oy + hh * 0.6} ${ox + hw / 2},${oy + hh * 0.85} ${ox + hw / 2},${oy + hh} C ${ox + hw / 2},${oy + hh * 0.85} ${ox + hw},${oy + hh * 0.6} ${ox + hw},${oy + hh * 0.3} C ${ox + hw},${oy} ${ox + hw / 2},${oy} ${ox + hw / 2},${oy + hh * 0.3} Z`;
    return (
      <Svg width={s} height={s}>
        <Path d={d} fill={color} />
      </Svg>
    );
  }
  if (shape === 'diamond') {
    const cx = s / 2;
    const cy = s / 2;
    const pts = `${cx},4 ${s - 4},${cy} ${cx},${s - 4} 4,${cy}`;
    return (
      <Svg width={s} height={s}>
        <Polygon points={pts} fill={color} />
      </Svg>
    );
  }
  return null;
}

function createDeck(): CardData[] {
  const cards: CardData[] = [];
  SHAPE_PAIRS.forEach((shape, pairId) => {
    cards.push({ id: pairId * 2, shape, pairId });
    cards.push({ id: pairId * 2 + 1, shape, pairId });
  });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

interface CardProps {
  card: CardData;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
  flipAnim: Animated.Value;
}

function MemoryCard({ card, isFlipped, isMatched, onPress, flipAnim }: CardProps) {
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const shapeSize = CARD_SIZE * 0.55;

  return (
    <AnimatedPressable
      style={[styles.cardContainer, isMatched && styles.cardMatched]}
      onPress={onPress}
      disabled={isFlipped || isMatched}
    >
      {/* Back face (question mark) */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          { transform: [{ rotateY: frontRotate }], opacity: frontOpacity },
        ]}
      >
        <Text style={styles.cardBackText}>?</Text>
      </Animated.View>
      {/* Front face (SVG shape) */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardFront,
          isMatched && styles.cardFrontMatched,
          { transform: [{ rotateY: backRotate }], opacity: backOpacity },
        ]}
      >
        <ShapeIcon shape={card.shape} size={shapeSize} />
      </Animated.View>
    </AnimatedPressable>
  );
}

export default function MemoryMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [deck, setDeck] = useState<CardData[]>(() => createDeck());
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);

  const flipAnims = useRef(deck.map(() => new Animated.Value(0))).current;

  const flipCard = useCallback((index: number, toValue: number, duration = 200) => {
    return new Promise<void>(resolve => {
      Animated.timing(flipAnims[index], {
        toValue,
        duration,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }, [flipAnims]);

  const handleCardPress = useCallback(async (cardIndex: number) => {
    const card = deck[cardIndex];
    if (isChecking || flippedIds.includes(cardIndex) || matchedPairs.has(card.pairId)) return;

    console.log('[MemoryMatch] Card pressed:', card.shape, 'index:', cardIndex);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await flipCard(cardIndex, 1);

    const newFlipped = [...flippedIds, cardIndex];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const newMoves = moves + 1;
      setMoves(newMoves);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = deck[firstIdx];
      const secondCard = deck[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        console.log('[MemoryMatch] Match found:', firstCard.shape);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newMatched = new Set([...matchedPairs, firstCard.pairId]);
        setMatchedPairs(newMatched);
        setFlippedIds([]);
        setIsChecking(false);

        if (newMatched.size === SHAPE_PAIRS.length) {
          const stars = newMoves <= 12 ? 3 : newMoves <= 18 ? 2 : 1;
          setEarnedStars(stars);
          console.log('[MemoryMatch] Game complete! Moves:', newMoves, 'Stars:', stars);
          const result = await completeGame('memory-match', stars);
          setNewBadges(result.newBadges);
          setShowComplete(true);
        }
      } else {
        console.log('[MemoryMatch] No match, flipping back');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(async () => {
          await Promise.all([
            flipCard(firstIdx, 0),
            flipCard(secondIdx, 0),
          ]);
          setFlippedIds([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [deck, flippedIds, matchedPairs, moves, isChecking, flipCard, completeGame]);

  const handlePlayAgain = () => {
    console.log('[MemoryMatch] Play again pressed');
    const newDeck = createDeck();
    setDeck(newDeck);
    flipAnims.forEach(a => a.setValue(0));
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setIsChecking(false);
    setShowComplete(false);
  };

  const handleBadgeDismiss = () => {
    console.log('[MemoryMatch] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
  };

  const starsLabel = earnedStars === 3 ? '⭐⭐⭐ Amazing!' : earnedStars === 2 ? '⭐⭐ Great job!' : '⭐ You did it!';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[MemoryMatch] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.shapes} />
        </AnimatedPressable>
        <Text style={styles.title}>Shape Memory 🔷</Text>
        <Mascot size={56} animate={false} expression="thinking" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>🎯 Moves: {moves}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>✅ {matchedPairs.size}/{SHAPE_PAIRS.length} pairs</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {deck.map((card, index) => (
          <MemoryCard
            key={card.id}
            card={card}
            isFlipped={flippedIds.includes(index)}
            isMatched={matchedPairs.has(card.pairId)}
            onPress={() => handleCardPress(index)}
            flipAnim={flipAnims[index]}
          />
        ))}
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={earnedStars}
        message={starsLabel}
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
    justifyContent: 'center',
    flex: 1,
    alignContent: 'center',
  },
  cardContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardMatched: {
    borderWidth: 3,
    borderColor: KIDS_COLORS.success,
    borderRadius: 14,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: KIDS_COLORS.shapes,
  },
  cardFront: {
    backgroundColor: KIDS_COLORS.surface,
  },
  cardFrontMatched: {
    backgroundColor: '#D1FAE5',
  },
  cardBackText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: '#FFFFFF',
  },
});
