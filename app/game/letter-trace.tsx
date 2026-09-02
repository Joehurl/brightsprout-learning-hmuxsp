import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Text as SvgText, Path } from 'react-native-svg';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 48, 320);

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Point {
  x: number;
  y: number;
}

function pointsToPath(points: Point[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  const d = [`M ${first.x} ${first.y}`];
  rest.forEach(p => d.push(`L ${p.x} ${p.y}`));
  return d.join(' ');
}

export default function LetterTraceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [letterIndex, setLetterIndex] = useState(0);
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [tracedCount, setTracedCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const canvasRef = useRef<View>(null);
  const canvasOffset = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef<Point[]>([]);

  const currentLetter = LETTERS[letterIndex % LETTERS.length];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        console.log('[LetterTrace] Drawing started at:', locationX, locationY);
        currentPathRef.current = [{ x: locationX, y: locationY }];
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [...currentPathRef.current, { x: locationX, y: locationY }];
        setCurrentPath([...currentPathRef.current]);
      },
      onPanResponderRelease: () => {
        console.log('[LetterTrace] Drawing stroke completed, points:', currentPathRef.current.length);
        if (currentPathRef.current.length > 0) {
          setPaths(p => [...p, currentPathRef.current]);
        }
        currentPathRef.current = [];
        setCurrentPath([]);
      },
    })
  ).current;

  const handleClear = () => {
    console.log('[LetterTrace] Clear pressed');
    setPaths([]);
    setCurrentPath([]);
  };

  const handleNextLetter = async () => {
    console.log('[LetterTrace] Next letter pressed, tracedCount:', tracedCount + 1);
    const newCount = tracedCount + 1;
    setTracedCount(newCount);
    setPaths([]);
    setCurrentPath([]);
    setLetterIndex(i => i + 1);

    if (newCount >= 5) {
      await completeGame('letter-trace', 2);
      setShowComplete(true);
    }
  };

  const handlePlayAgain = () => {
    console.log('[LetterTrace] Play again pressed');
    setShowComplete(false);
    setLetterIndex(0);
    setTracedCount(0);
    setPaths([]);
    setCurrentPath([]);
  };

  const allPaths = [...paths, currentPath];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[LetterTrace] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.letters} />
        </AnimatedPressable>
        <Text style={styles.title}>Letter Tracing ✏️</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{Math.min(tracedCount, 5)}/5</Text>
        </View>
      </View>

      <Text style={styles.instruction}>Trace the letter with your finger!</Text>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View
          ref={canvasRef}
          style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}
          {...panResponder.panHandlers}
        >
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
            {/* Guide letter */}
            <SvgText
              x={CANVAS_SIZE / 2}
              y={CANVAS_SIZE * 0.78}
              fontSize={CANVAS_SIZE * 0.85}
              fontWeight="bold"
              textAnchor="middle"
              fill="none"
              stroke={KIDS_COLORS.letters}
              strokeWidth="3"
              strokeDasharray="8,6"
              opacity={0.35}
            >
              {currentLetter}
            </SvgText>

            {/* Drawn paths */}
            {allPaths.map((pts, i) => {
              const d = pointsToPath(pts);
              if (!d) return null;
              return (
                <Path
                  key={i}
                  d={d}
                  stroke={KIDS_COLORS.letters}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}
          </Svg>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <AnimatedPressable style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Clear ✕</Text>
        </AnimatedPressable>
        <AnimatedPressable style={styles.nextBtn} onPress={handleNextLetter}>
          <Text style={styles.nextBtnText}>
            {tracedCount >= 4 ? 'Finish! 🎉' : 'Next Letter →'}
          </Text>
        </AnimatedPressable>
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={2}
        message="Great tracing!"
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
    fontSize: 24,
    color: KIDS_COLORS.text,
    flex: 1,
  },
  progressBadge: {
    backgroundColor: KIDS_COLORS.letters,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  progressText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 24,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: 20,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: KIDS_COLORS.letters,
  },
  clearBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.letters,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: KIDS_COLORS.letters,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
