import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
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
import { playSound } from '@/utils/sounds';

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

// ABC song melody: frequencies (Hz) per letter A-Z
// Standard ABC song in C major
const ABC_MELODY_FREQS = [
  261, 261, 392, 392, 440, 440, 392, // A B C D E F G (G is half note)
  349, 349, 330, 330, 294, 294, 261, // H I J K L M N (N is half note)
  392, 392, 349, 349, 330, 330, 294, // O P Q R S T U (U is half note)
  261, 392, 349, 330, 294, 261,       // V W X Y Z (end)
];

// Duration in ms per note (quarter=400ms, half=800ms)
const ABC_MELODY_DURATIONS = [
  400, 400, 400, 400, 400, 400, 800, // A-G
  400, 400, 400, 400, 400, 400, 800, // H-N
  400, 400, 400, 400, 400, 400, 800, // O-U
  400, 400, 400, 400, 400, 800,       // V-Z
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
  const noteAnim = useRef(new Animated.Value(0)).current;
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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

  const animateNote = useCallback(() => {
    noteAnim.setValue(0);
    Animated.sequence([
      Animated.timing(noteAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(noteAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [noteAnim]);

  const goToLetter = useCallback((index: number) => {
    setCurrentIndex(index);
    setVisited(prev => new Set([...prev, index]));
    animateLetter();
    playSound('tap');
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

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    const rafRef = (timeoutIdsRef as any).rafRef;
    if (rafRef?.id) {
      cancelAnimationFrame(rafRef.id);
      (timeoutIdsRef as any).rafRef = null;
    }
  }, []);

  const scheduleWithTimeouts = useCallback((startTimes: number[], totalDuration: number) => {
    goToLetter(0);
    for (let i = 0; i < 26; i++) {
      const idx = i;
      const id = setTimeout(() => {
        goToLetter(idx);
        animateNote();
      }, startTimes[i]);
      timeoutIdsRef.current.push(id);
    }
    const endId = setTimeout(() => {
      setIsPlaying(false);
      handleGameComplete();
    }, totalDuration + 200);
    timeoutIdsRef.current.push(endId);
  }, [goToLetter, animateNote]);

  const handlePlaySong = () => {
    console.log('[AlphabetAdventure] Play ABC Song pressed, isPlaying:', isPlaying);
    if (isPlaying) {
      setIsPlaying(false);
      clearAllTimeouts();
      return;
    }
    setIsPlaying(true);

    // Build cumulative start times for each letter (in ms from now)
    const startTimes: number[] = [];
    let acc = 0;
    for (let i = 0; i < 26; i++) {
      startTimes.push(acc);
      acc += ABC_MELODY_DURATIONS[i] ?? 400;
    }
    const totalDuration = acc;

    if (Platform.OS === 'web') {
      // Use Web Audio API — schedule all notes
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          const startAudioTime = ctx.currentTime;

          console.log('[AlphabetAdventure] Playing ABC melody via Web Audio API (rAF sync)');

          // Schedule all 26 notes
          ABC_MELODY_FREQS.forEach((freq, i) => {
            const noteStart = startAudioTime + startTimes[i] / 1000;
            const dur = (ABC_MELODY_DURATIONS[i] ?? 400) / 1000;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);
            gain.gain.setValueAtTime(0.4, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur * 0.85);
            osc.start(noteStart);
            osc.stop(noteStart + dur);
          });

          // Use rAF loop to sync visuals to audio clock
          let lastLetterIdx = -1;
          const rafRef = { id: 0 };
          const tick = () => {
            const elapsed = (ctx.currentTime - startAudioTime) * 1000; // ms
            // Find which letter should be active
            let activeIdx = 25;
            for (let i = 0; i < 26; i++) {
              if (elapsed < startTimes[i] + (ABC_MELODY_DURATIONS[i] ?? 400)) {
                activeIdx = i;
                break;
              }
            }
            if (activeIdx !== lastLetterIdx) {
              lastLetterIdx = activeIdx;
              goToLetter(activeIdx);
              animateNote();
            }
            if (elapsed < totalDuration + 200) {
              rafRef.id = requestAnimationFrame(tick);
            } else {
              setIsPlaying(false);
              handleGameComplete();
            }
          };
          rafRef.id = requestAnimationFrame(tick);
          // Store cancel function
          const cancelId = setTimeout(() => {
            cancelAnimationFrame(rafRef.id);
            setIsPlaying(false);
          }, totalDuration + 500);
          timeoutIdsRef.current.push(cancelId);
          // Store rafRef for cleanup
          (timeoutIdsRef as any).rafRef = rafRef;
        } catch (e) {
          console.log('[AlphabetAdventure] Web Audio error:', e);
          // Fall through to setTimeout approach
          scheduleWithTimeouts(startTimes, totalDuration);
        }
      } else {
        scheduleWithTimeouts(startTimes, totalDuration);
      }
    } else {
      // Native: use setTimeout (no audio, just visual)
      console.log('[AlphabetAdventure] Native: visual letter sync (no audio)');
      scheduleWithTimeouts(startTimes, totalDuration);
    }
  };

  const handleGameComplete = async () => {
    console.log('[AlphabetAdventure] Game complete!');
    playSound('correct');
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
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  const noteScale = noteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const isOnWeb = Platform.OS === 'web';
  const songButtonLabel = isPlaying
    ? '⏸ Stop Song'
    : isOnWeb
    ? '▶ Play ABC Song 🎵'
    : '▶ Play ABC Song ♪';

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
          <View style={styles.letterCircleWrapper}>
            <Animated.View style={[styles.letterCircle, { transform: [{ scale: bounceAnim }] }]}>
              <Text style={[styles.letterText, { color: letterColor }]}>{currentLetter.letter}</Text>
            </Animated.View>
            {isPlaying && (
              <Animated.Text style={[styles.musicNote, { transform: [{ scale: noteScale }] }]}>
                ♪
              </Animated.Text>
            )}
          </View>
          <Text style={styles.wordText}>
            {currentLetter.letter} is for {currentLetter.word} {currentLetter.emoji}
          </Text>
          {isPlaying && (
            <Text style={styles.playingHint}>
              {isOnWeb ? '🎵 Playing ABC Song!' : '♪ Watch the letters dance!'}
            </Text>
          )}
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
        <AnimatedPressable style={[styles.playBtn, isPlaying && styles.playBtnActive]} onPress={handlePlaySong}>
          <Text style={[styles.playBtnText, isPlaying && styles.playBtnTextActive]}>
            {songButtonLabel}
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
  letterCircleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  },
  letterText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 96,
    lineHeight: 110,
  },
  musicNote: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 32,
    color: '#FFFFFF',
  },
  wordText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  playingHint: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
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
  playBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  playBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FF6B6B',
  },
  playBtnTextActive: {
    color: '#FF4444',
  },
});
