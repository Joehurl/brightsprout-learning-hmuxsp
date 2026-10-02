import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Text as SvgText, Path } from 'react-native-svg';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';

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
  const { width, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Canvas size: leave room for header (~60pt), instruction (~30pt), buttons (~70pt), safe area, margins
  const usableHeight = SCREEN_HEIGHT - insets.top - 60 - 30 - 70 - 40;
  const CANVAS_SIZE = Math.min(width - 48, usableHeight, 300);

  const router = useRouter();
  const { completeGame } = useProgress();

  const [letterIndex, setLetterIndex] = useState(0);
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [tracedCount, setTracedCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const canvasRef = useRef<View>(null);
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
        const completed = [...currentPathRef.current];
        console.log('[LetterTrace] Drawing stroke completed, points:', completed.length);
        currentPathRef.current = [];
        setCurrentPath([]);
        if (completed.length > 1) {
          setPaths(prev => [...prev, completed]);
        }
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

  const allPaths = currentPath.length > 0 ? [...paths, currentPath] : paths;

  // Responsive font sizes
  const titleFontSize = Math.min(Math.round(SCREEN_HEIGHT * 0.026), 20);
  const instructionFontSize = Math.min(Math.round(SCREEN_HEIGHT * 0.02), 16);
  const btnFontSize = Math.min(Math.round(SCREEN_HEIGHT * 0.02), 16);
  const btnPadV = Math.round(SCREEN_HEIGHT * 0.016);
  const headerMarginBottom = Math.round(SCREEN_HEIGHT * 0.014);
  const instructionMarginBottom = Math.round(SCREEN_HEIGHT * 0.012);
  const btnRowMarginTop = Math.round(SCREEN_HEIGHT * 0.018);
  const btnRowMarginBottom = Math.round(SCREEN_HEIGHT * 0.022);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: headerMarginBottom }]}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[LetterTrace] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={26} color={KIDS_COLORS.letters} />
        </AnimatedPressable>
        <Text style={[styles.title, { fontSize: titleFontSize }]}>Letter Tracing ✏️</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{Math.min(tracedCount, 5)}/5</Text>
        </View>
      </View>

      <Text style={[styles.instruction, { fontSize: instructionFontSize, marginBottom: instructionMarginBottom }]}>
        Trace the letter with your finger!
      </Text>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View
          ref={canvasRef}
          style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}
          {...panResponder.panHandlers}
        >
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
            <SvgText
              x={CANVAS_SIZE / 2}
              y={CANVAS_SIZE * 0.78}
              fontSize={CANVAS_SIZE * 0.85}
              fontWeight="bold"
              textAnchor="middle"
              fill={KIDS_COLORS.letters}
              stroke="none"
              opacity={0.12}
            >
              {currentLetter}
            </SvgText>

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
      <View style={[styles.btnRow, { marginTop: btnRowMarginTop, marginBottom: btnRowMarginBottom }]}>
        <AnimatedPressable style={[styles.clearBtn, { paddingVertical: btnPadV }]} onPress={handleClear}>
          <Text style={[styles.clearBtnText, { fontSize: btnFontSize }]}>Clear ✕</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[styles.nextBtn, { paddingVertical: btnPadV }]} onPress={handleNextLetter}>
          <Text style={[styles.nextBtnText, { fontSize: btnFontSize }]}>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: KIDS_COLORS.text,
    flex: 1,
  },
  progressBadge: {
    backgroundColor: KIDS_COLORS.letters,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  progressText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: KIDS_COLORS.letters,
  },
  clearBtnText: {
    fontFamily: 'Nunito_700Bold',
    color: KIDS_COLORS.letters,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: KIDS_COLORS.letters,
    borderRadius: 18,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
  },
});
