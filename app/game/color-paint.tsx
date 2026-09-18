import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Path, Circle, Rect, Polygon, Text as SvgText } from 'react-native-svg';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';
import { playSound } from '@/utils/sounds';

// All unique first letters — no duplicates
const PALETTE = [
  { name: 'Red', hex: '#FF4444' },      // R
  { name: 'Blue', hex: '#4488FF' },     // B
  { name: 'Yellow', hex: '#FFD700' },   // Y
  { name: 'Green', hex: '#44CC44' },    // G
  { name: 'Orange', hex: '#FF8C00' },   // O
  { name: 'Purple', hex: '#9944CC' },   // P
  { name: 'Teal', hex: '#00BCD4' },     // T
  { name: 'White', hex: '#F5F5F5' },    // W
];

const COLOR_LETTER: Record<string, string> = {
  Red: 'R',
  Blue: 'B',
  Yellow: 'Y',
  Green: 'G',
  Orange: 'O',
  Purple: 'P',
  Teal: 'T',
  White: 'W',
};

const REGIONS = ['sky', 'sun', 'house', 'roof', 'grass'] as const;
type Region = typeof REGIONS[number];

const DEFAULT_COLORS: Record<Region, string> = {
  sky: '#E8F4FD',
  sun: '#FFF9C4',
  house: '#F5F5F5',
  roof: '#EEEEEE',
  grass: '#E8F5E9',
};

// Center points for the letter label in each region (SVG coords, viewBox 300x220)
const REGION_LABEL_POS: Record<Region, { x: number; y: number }> = {
  sky: { x: 60, y: 70 },
  sun: { x: 240, y: 40 },
  house: { x: 150, y: 130 },
  roof: { x: 150, y: 78 },
  grass: { x: 60, y: 170 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTargetColors(): Record<Region, string> {
  const picked = shuffle(PALETTE.map(p => p.name)).slice(0, 5);
  return {
    sky: picked[0],
    sun: picked[1],
    house: picked[2],
    roof: picked[3],
    grass: picked[4],
  };
}

export default function ColorPaintScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
  const [targetColors, setTargetColors] = useState<Record<Region, string>>(generateTargetColors);
  const [paintedColors, setPaintedColors] = useState<Record<Region, string | null>>({
    sky: null, sun: null, house: null, roof: null, grass: null,
  });
  const [errorRegions, setErrorRegions] = useState<Set<Region>>(new Set());
  const [round, setRound] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const roundCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectColor = (color: { name: string; hex: string }) => {
    console.log('[ColorPaint] Color selected:', color.name, '→ letter:', COLOR_LETTER[color.name]);
    playSound('pop');
    setSelectedColor(color.hex);
    setSelectedColorName(color.name);
  };

  const handleRegionPress = useCallback(async (region: Region) => {
    if (!selectedColorName) return;
    console.log('[ColorPaint] Region pressed:', region, 'selected color:', selectedColorName, 'target:', targetColors[region]);

    const isCorrect = selectedColorName === targetColors[region];

    if (isCorrect) {
      playSound('pop');
      const newPainted = { ...paintedColors, [region]: selectedColor };
      setPaintedColors(newPainted);

      const allDone = REGIONS.every(r => newPainted[r] !== null);
      if (allDone) {
        console.log('[ColorPaint] Round', round, 'complete!');
        if (round >= 3) {
          await completeGame('color-paint', 2);
          setShowComplete(true);
        } else {
          setShowRoundComplete(true);
          roundCompleteTimerRef.current = setTimeout(() => {
            setShowRoundComplete(false);
            const newTargets = generateTargetColors();
            setTargetColors(newTargets);
            setPaintedColors({ sky: null, sun: null, house: null, roof: null, grass: null });
            setRound(r => r + 1);
            setSelectedColor(null);
            setSelectedColorName(null);
          }, 5000);
        }
      }
    } else {
      console.log('[ColorPaint] Wrong tap — region:', region, 'expected:', targetColors[region], 'got:', selectedColorName);
      setErrorRegions(prev => new Set([...prev, region]));
      setTimeout(() => {
        setErrorRegions(prev => {
          const next = new Set(prev);
          next.delete(region);
          return next;
        });
      }, 400);
    }
  }, [selectedColorName, selectedColor, targetColors, paintedColors, round, completeGame]);

  const handlePlayAgain = () => {
    console.log('[ColorPaint] Play again pressed');
    if (roundCompleteTimerRef.current) clearTimeout(roundCompleteTimerRef.current);
    setShowComplete(false);
    setShowRoundComplete(false);
    setTargetColors(generateTargetColors());
    setPaintedColors({ sky: null, sun: null, house: null, roof: null, grass: null });
    setSelectedColor(null);
    setSelectedColorName(null);
    setRound(1);
    setErrorRegions(new Set());
  };

  const handleClear = () => {
    console.log('[ColorPaint] Clear pressed');
    setPaintedColors({ sky: null, sun: null, house: null, roof: null, grass: null });
    setSelectedColor(null);
    setSelectedColorName(null);
  };

  // Resolve fill for each region
  const getFill = (region: Region): string => {
    if (errorRegions.has(region)) return '#FF4444';
    if (paintedColors[region]) return paintedColors[region] as string;
    return DEFAULT_COLORS[region];
  };

  const skyFill = getFill('sky');
  const sunFill = getFill('sun');
  const houseFill = getFill('house');
  const roofFill = getFill('roof');
  const grassFill = getFill('grass');

  // Show letter label only if not yet painted
  const showLabel = (region: Region): boolean => paintedColors[region] === null;

  const getLabel = (region: Region): string => COLOR_LETTER[targetColors[region]] ?? '?';

  const paintedCount = REGIONS.filter(r => paintedColors[r] !== null).length;

  const selectedLetter = selectedColorName ? (COLOR_LETTER[selectedColorName] ?? selectedColorName[0]) : null;
  const instructionText = selectedColorName
    ? `Tap the section showing "${selectedLetter}"`
    : 'Pick a color, then tap the section showing its first letter!';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[ColorPaint] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.colors} />
        </AnimatedPressable>
        <Text style={styles.title}>Paint the House 🎨</Text>
        <AnimatedPressable style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>🗑 Clear</Text>
        </AnimatedPressable>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{round}/3</Text>
        </View>
      </View>

      <Text style={styles.instruction}>{instructionText}</Text>

      {/* Scene */}
      <View style={styles.sceneContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 300 220">
          {/* Sky */}
          <Rect
            x={0} y={0} width={300} height={140}
            fill={skyFill}
            onPress={() => handleRegionPress('sky')}
          />
          {/* Sun */}
          <Circle
            cx={240} cy={40} r={30}
            fill={sunFill}
            stroke="#E0E0E0"
            strokeWidth={1}
            onPress={() => handleRegionPress('sun')}
          />
          {/* Grass */}
          <Rect
            x={0} y={140} width={300} height={80}
            fill={grassFill}
            onPress={() => handleRegionPress('grass')}
          />
          {/* House body */}
          <Rect
            x={80} y={100} width={140} height={80}
            fill={houseFill}
            stroke="#CCCCCC"
            strokeWidth={1}
            onPress={() => handleRegionPress('house')}
          />
          {/* Roof */}
          <Polygon
            points="70,100 150,50 230,100"
            fill={roofFill}
            stroke="#CCCCCC"
            strokeWidth={1}
            onPress={() => handleRegionPress('roof')}
          />
          {/* Door */}
          <Rect x={135} y={140} width={30} height={40} fill="#8B6914" rx={4} />
          {/* Windows */}
          <Rect x={95} y={115} width={30} height={25} fill="#87CEEB" rx={3} />
          <Rect x={175} y={115} width={30} height={25} fill="#87CEEB" rx={3} />

          {/* Target letters */}
          {showLabel('sky') && (
            <SvgText
              x={REGION_LABEL_POS.sky.x}
              y={REGION_LABEL_POS.sky.y}
              fontSize={28}
              fontWeight="bold"
              fill="#333333"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {getLabel('sky')}
            </SvgText>
          )}
          {showLabel('sun') && (
            <SvgText
              x={REGION_LABEL_POS.sun.x}
              y={REGION_LABEL_POS.sun.y}
              fontSize={22}
              fontWeight="bold"
              fill="#333333"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {getLabel('sun')}
            </SvgText>
          )}
          {showLabel('house') && (
            <SvgText
              x={REGION_LABEL_POS.house.x}
              y={REGION_LABEL_POS.house.y}
              fontSize={28}
              fontWeight="bold"
              fill="#333333"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {getLabel('house')}
            </SvgText>
          )}
          {showLabel('roof') && (
            <SvgText
              x={REGION_LABEL_POS.roof.x}
              y={REGION_LABEL_POS.roof.y}
              fontSize={22}
              fontWeight="bold"
              fill="#333333"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {getLabel('roof')}
            </SvgText>
          )}
          {showLabel('grass') && (
            <SvgText
              x={REGION_LABEL_POS.grass.x}
              y={REGION_LABEL_POS.grass.y}
              fontSize={28}
              fontWeight="bold"
              fill="#333333"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {getLabel('grass')}
            </SvgText>
          )}
        </Svg>
      </View>

      {/* Color palette */}
      <View style={styles.palette}>
        {PALETTE.map(color => (
          <AnimatedPressable
            key={color.name}
            style={[
              styles.colorCircle,
              { backgroundColor: color.hex },
              selectedColor === color.hex && styles.colorCircleSelected,
              color.name === 'White' && styles.colorCircleWhite,
            ]}
            onPress={() => handleSelectColor(color)}
          >
            <Text style={[styles.colorLetter, color.name === 'White' && styles.colorLetterDark]}>
              {COLOR_LETTER[color.name]}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.progressHint}>{paintedCount}/5 sections painted</Text>

      {/* Round complete overlay */}
      {showRoundComplete && (
        <View style={styles.roundCompleteOverlay}>
          <Text style={styles.roundCompleteEmoji}>🎉</Text>
          <Text style={styles.roundCompleteTitle}>Round Complete!</Text>
          <Text style={styles.roundCompleteSubtitle}>Get ready for the next round…</Text>
        </View>
      )}

      <GameCompleteOverlay
        visible={showComplete}
        stars={2}
        message="Beautiful painting!"
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
    backgroundColor: KIDS_COLORS.colors,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  clearBtn: {
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: '#CC3333',
  },
  roundCompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  roundCompleteEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  roundCompleteTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  roundCompleteSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  palette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderColor: KIDS_COLORS.text,
    transform: [{ scale: 1.2 }],
  },
  colorCircleWhite: {
    borderColor: KIDS_COLORS.border,
  },
  colorLetter: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  colorLetterDark: {
    color: KIDS_COLORS.textSecondary,
  },
  progressHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: KIDS_COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
});
