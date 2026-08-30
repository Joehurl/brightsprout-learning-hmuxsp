import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';
import { Mascot } from '@/components/Mascot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LETTER_DATA = [
  { letter: 'A', word: 'Apple', emoji: '🍎' },
  { letter: 'B', word: 'Ball', emoji: '⚽' },
  { letter: 'C', word: 'Cat', emoji: '🐱' },
  { letter: 'D', word: 'Dog', emoji: '🐶' },
  { letter: 'E', word: 'Elephant', emoji: '🐘' },
  { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'G', word: 'Grapes', emoji: '🍇' },
  { letter: 'H', word: 'Hat', emoji: '🎩' },
  { letter: 'I', word: 'Ice Cream', emoji: '🍦' },
  { letter: 'J', word: 'Jellyfish', emoji: '🪼' },
  { letter: 'K', word: 'Kite', emoji: '🪁' },
  { letter: 'L', word: 'Lion', emoji: '🦁' },
  { letter: 'M', word: 'Moon', emoji: '🌙' },
  { letter: 'N', word: 'Nest', emoji: '🪺' },
  { letter: 'O', word: 'Orange', emoji: '🍊' },
  { letter: 'P', word: 'Penguin', emoji: '🐧' },
  { letter: 'Q', word: 'Queen', emoji: '👑' },
  { letter: 'R', word: 'Rainbow', emoji: '🌈' },
  { letter: 'S', word: 'Sun', emoji: '☀️' },
  { letter: 'T', word: 'Tiger', emoji: '🐯' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️' },
  { letter: 'V', word: 'Violin', emoji: '🎻' },
  { letter: 'W', word: 'Whale', emoji: '🐋' },
  { letter: 'X', word: 'Xylophone', emoji: '🎵' },
  { letter: 'Y', word: 'Yak', emoji: '🐃' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓' },
];

const LETTER_COLORS = [
  KIDS_COLORS.letters, KIDS_COLORS.numbers, KIDS_COLORS.shapes,
  KIDS_COLORS.colors, KIDS_COLORS.animals, KIDS_COLORS.music,
];

export default function AlphabetAdventureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const playIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const currentLetter = LETTER_DATA[currentIndex];
  const letterColor = LETTER_COLORS[currentIndex % LETTER_COLORS.length];

  const animateLetter = useCallback(() => {
    bounceAnim.setValue(0.5);
    Animated.spring(bounceAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 6,
      stiffness: 200,
    }).start();
  }, [bounceAnim]);

  const goToLetter = useCallback((index: number) => {
    setCurrentIndex(index);
    setVisited(prev => new Set([...prev, index]));
    animateLetter();
    scrollRef.current?.scrollTo({ x: index * 40, animated: true });
  }, [animateLetter]);

  const handleNext = () => {
    console.log('[AlphabetAdventure] Next letter pressed, current:', currentIndex);
    if (currentIndex < 25) {
      goToLetter(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    console.log('[AlphabetAdventure] Prev letter pressed, current:', currentIndex);
    if (currentIndex > 0) {
      goToLetter(currentIndex - 1);
    }
  };

  const handlePlaySong = () => {
    console.log('[AlphabetAdventure] Play ABC Song pressed');
    if (isPlaying) {
      setIsPlaying(false);
      if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
      return;
    }
    setIsPlaying(true);
    goToLetter(0);

    const advance = (idx: number) => {
      if (idx >= 26) {
        setIsPlaying(false);
        handleGameComplete();
        return;
      }
      goToLetter(idx);
      playIntervalRef.current = setTimeout(() => advance(idx + 1), 1500);
    };
    playIntervalRef.current = setTimeout(() => advance(1), 1500);
  };

  const handleGameComplete = async () => {
    console.log('[AlphabetAdventure] Game complete!');
    await completeGame('alphabet-adventure', 3);
    setShowComplete(true);
  };

  const handlePlayAgain = () => {
    console.log('[AlphabetAdventure] Play again pressed');
    setShowComplete(false);
    setCurrentIndex(0);
    setVisited(new Set([0]));
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
    };
  }, []);

  return (
    <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 12 }]}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedPressable
            style={styles.backBtn}
            onPress={() => {
              console.log('[AlphabetAdventure] Back pressed');
              router.back();
            }}
          >
            <ChevronLeft size={28} color="#FFFFFF" />
          </AnimatedPressable>
          <Text style={styles.title}>Alphabet Adventure 🎵</Text>
          <Mascot size={60} animate={false} expression="happy" />
        </View>

        {/* Letter Display */}
        <View style={styles.letterDisplay}>
          <Animated.View style={[styles.letterCircle, { transform: [{ scale: bounceAnim }] }]}>
            <Text style={[styles.letterText, { color: letterColor }]}>{currentLetter.letter}</Text>
          </Animated.View>
          <Text style={styles.wordText}>
            {currentLetter.letter} is for {currentLetter.word} {currentLetter.emoji}
          </Text>
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <AnimatedPressable
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navBtnText}>← Back</Text>
          </AnimatedPressable>
          <Text style={styles.letterCounter}>{currentIndex + 1} / 26</Text>
          <AnimatedPressable
            style={[styles.navBtn, currentIndex === 25 && styles.navBtnDisabled]}
            onPress={handleNext}
            disabled={currentIndex === 25}
          >
            <Text style={styles.navBtnText}>Next →</Text>
          </AnimatedPressable>
        </View>

        {/* Letter dots */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dotsScroll}
          contentContainerStyle={styles.dotsContent}
        >
          {LETTER_DATA.map((item, i) => {
            const isVisited = visited.has(i);
            const isCurrent = i === currentIndex;
            return (
              <AnimatedPressable
                key={i}
                style={[
                  styles.dot,
                  isVisited && styles.dotVisited,
                  isCurrent && styles.dotCurrent,
                ]}
                onPress={() => {
                  console.log('[AlphabetAdventure] Letter dot pressed:', item.letter);
                  goToLetter(i);
                }}
              >
                <Text style={[styles.dotText, (isVisited || isCurrent) && styles.dotTextActive]}>
                  {item.letter}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {/* Play button */}
        <AnimatedPressable style={styles.playBtn} onPress={handlePlaySong}>
          <Text style={styles.playBtnText}>
            {isPlaying ? '⏸ Stop Song' : '▶ Play ABC Song'}
          </Text>
        </AnimatedPressable>
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={3}
        message="You know all your ABCs!"
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.back()}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: '#FFFFFF',
    flex: 1,
  },
  letterDisplay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  letterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  letterText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 96,
    lineHeight: 110,
  },
  wordText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  letterCounter: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  dotsScroll: {
    maxHeight: 52,
    marginBottom: 16,
  },
  dotsContent: {
    gap: 6,
    paddingHorizontal: 4,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotVisited: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotCurrent: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  dotText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  dotTextActive: {
    color: '#FF6B6B',
  },
  playBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  playBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FF6B6B',
  },
});
