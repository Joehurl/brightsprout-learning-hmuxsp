import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';

const PALETTE = [
  { name: 'Red', hex: '#FF4444' },
  { name: 'Blue', hex: '#4488FF' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Green', hex: '#44CC44' },
  { name: 'Orange', hex: '#FF8C00' },
  { name: 'Purple', hex: '#9944CC' },
  { name: 'Pink', hex: '#FF69B4' },
  { name: 'White', hex: '#FFFFFF' },
];

const COLOR_MIXES = [
  { c1: 'Red', c2: 'Blue', result: 'Purple', emoji: '🟣' },
  { c1: 'Red', c2: 'Yellow', result: 'Orange', emoji: '🟠' },
  { c1: 'Blue', c2: 'Yellow', result: 'Green', emoji: '🟢' },
];

const REGIONS = ['sky', 'sun', 'house', 'roof', 'grass'] as const;
type Region = typeof REGIONS[number];

const DEFAULT_COLORS: Record<Region, string> = {
  sky: '#E8F4FD',
  sun: '#FFF9C4',
  house: '#F5F5F5',
  roof: '#EEEEEE',
  grass: '#E8F5E9',
};

export default function ColorPaintScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
  const [regionColors, setRegionColors] = useState<Record<Region, string>>({ ...DEFAULT_COLORS });
  const [coloredRegions, setColoredRegions] = useState<Set<Region>>(new Set());
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const [mixHint, setMixHint] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  const handleSelectColor = (color: { name: string; hex: string }) => {
    console.log('[ColorPaint] Color selected:', color.name);

    // Check for mix hint
    if (lastSelected) {
      const mix = COLOR_MIXES.find(
        m => (m.c1 === lastSelected && m.c2 === color.name) || (m.c1 === color.name && m.c2 === lastSelected)
      );
      if (mix) {
        setMixHint(`${mix.c1} + ${mix.c2} = ${mix.result}! ${mix.emoji}`);
        setTimeout(() => setMixHint(null), 2500);
      }
    }

    setLastSelected(color.name);
    setSelectedColor(color.hex);
    setSelectedColorName(color.name);
  };

  const handleRegionPress = async (region: Region) => {
    if (!selectedColor) return;
    console.log('[ColorPaint] Region pressed:', region, 'with color:', selectedColorName);

    const newColors = { ...regionColors, [region]: selectedColor };
    setRegionColors(newColors);

    const newColored = new Set([...coloredRegions, region]);
    setColoredRegions(newColored);

    if (newColored.size >= 5) {
      await completeGame('color-paint', 2);
      setShowComplete(true);
    }
  };

  const handlePlayAgain = () => {
    console.log('[ColorPaint] Play again pressed');
    setShowComplete(false);
    setRegionColors({ ...DEFAULT_COLORS });
    setColoredRegions(new Set());
    setSelectedColor(null);
    setSelectedColorName(null);
    setLastSelected(null);
    setMixHint(null);
  };

  const sky = regionColors.sky;
  const sun = regionColors.sun;
  const house = regionColors.house;
  const roof = regionColors.roof;
  const grass = regionColors.grass;

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
        <Text style={styles.title}>Color Mixing 🎨</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{coloredRegions.size}/5</Text>
        </View>
      </View>

      {selectedColorName && (
        <Text style={styles.selectedColorText}>
          Selected: <Text style={{ color: selectedColor ?? KIDS_COLORS.text }}>{selectedColorName}</Text>
        </Text>
      )}
      {!selectedColor && (
        <Text style={styles.instruction}>Pick a color, then tap a part of the scene!</Text>
      )}

      {mixHint && (
        <View style={styles.mixHintBanner}>
          <Text style={styles.mixHintText}>{mixHint}</Text>
        </View>
      )}

      {/* Scene */}
      <View style={styles.sceneContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 300 220">
          {/* Sky */}
          <Rect
            x={0} y={0} width={300} height={140}
            fill={sky}
            onPress={() => handleRegionPress('sky')}
          />
          {/* Sun */}
          <Circle
            cx={240} cy={40} r={30}
            fill={sun}
            stroke="#E0E0E0"
            strokeWidth={1}
            onPress={() => handleRegionPress('sun')}
          />
          {/* Grass */}
          <Rect
            x={0} y={140} width={300} height={80}
            fill={grass}
            onPress={() => handleRegionPress('grass')}
          />
          {/* House body */}
          <Rect
            x={80} y={100} width={140} height={80}
            fill={house}
            stroke="#CCCCCC"
            strokeWidth={1}
            onPress={() => handleRegionPress('house')}
          />
          {/* Roof */}
          <Polygon
            points="70,100 150,50 230,100"
            fill={roof}
            stroke="#CCCCCC"
            strokeWidth={1}
            onPress={() => handleRegionPress('roof')}
          />
          {/* Door */}
          <Rect x={135} y={140} width={30} height={40} fill="#8B6914" rx={4} />
          {/* Windows */}
          <Rect x={95} y={115} width={30} height={25} fill="#87CEEB" rx={3} />
          <Rect x={175} y={115} width={30} height={25} fill="#87CEEB" rx={3} />
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
            ]}
            onPress={() => handleSelectColor(color)}
          />
        ))}
      </View>

      <Text style={styles.regionHint}>Tap: sky • sun • house • roof • grass</Text>

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
  selectedColorText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  mixHintBanner: {
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  mixHintText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.primary,
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
  },
  colorCircleSelected: {
    borderColor: KIDS_COLORS.text,
    transform: [{ scale: 1.2 }],
  },
  regionHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: KIDS_COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
});
