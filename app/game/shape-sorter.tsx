import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Circle, Rect, Polygon, Path } from 'react-native-svg';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPES = [
  { id: 'circle', label: 'Circle', color: '#4ECDC4', emoji: '🔵' },
  { id: 'square', label: 'Square', color: '#FF6B6B', emoji: '🟥' },
  { id: 'triangle', label: 'Triangle', color: '#F59E0B', emoji: '🔺' },
  { id: 'star', label: 'Star', color: '#A78BFA', emoji: '⭐' },
];

const HOLE_SIZE = 70;
const SHAPE_SIZE = 60;

function ShapeSvg({ id, color, size, filled }: { id: string; color: string; size: number; filled: boolean }) {
  const stroke = filled ? color : '#CCCCCC';
  const fill = filled ? color : 'none';
  const strokeWidth = filled ? 0 : 3;

  if (id === 'circle') {
    return (
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={filled ? undefined : '6,4'} />
      </Svg>
    );
  }
  if (id === 'square') {
    return (
      <Svg width={size} height={size}>
        <Rect x={4} y={4} width={size - 8} height={size - 8} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={filled ? undefined : '6,4'} />
      </Svg>
    );
  }
  if (id === 'triangle') {
    const pts = `${size / 2},4 ${size - 4},${size - 4} 4,${size - 4}`;
    return (
      <Svg width={size} height={size}>
        <Polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={filled ? undefined : '6,4'} />
      </Svg>
    );
  }
  if (id === 'star') {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = outerR * 0.4;
    const points = 5;
    let d = '';
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      d += (i === 0 ? 'M' : 'L') + `${x},${y}`;
    }
    d += 'Z';
    return (
      <Svg width={size} height={size}>
        <Path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={filled ? undefined : '6,4'} />
      </Svg>
    );
  }
  return null;
}

export default function ShapeSorterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [round, setRound] = useState(0);
  const [sorted, setSorted] = useState<Set<string>>(new Set());
  const [showComplete, setShowComplete] = useState(false);

  const positions = useRef(
    SHAPES.map(() => new Animated.ValueXY({ x: 0, y: 0 }))
  ).current;

  const holeLayouts = useRef<Record<string, { x: number; y: number }>>({});
  const shapeLayouts = useRef<Record<string, { x: number; y: number }>>({});
  // Stores the original (pre-translation) layout measured once on mount — never updated after first measure
  const originalShapeLayouts = useRef<Record<string, { x: number; y: number }>>({});

  const handleDrop = useCallback(async (shapeId: string, shapeIndex: number, finalX: number, finalY: number) => {
    const holeLayout = holeLayouts.current[shapeId];
    if (!holeLayout) {
      Animated.spring(positions[shapeIndex], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      return;
    }

    const dx = Math.abs(finalX - holeLayout.x);
    const dy = Math.abs(finalY - holeLayout.y);
    const dist = Math.sqrt(dx * dx + dy * dy);

    console.log('[ShapeSorter] Shape dropped:', shapeId, 'distance to hole:', dist);

    if (dist < 80) {
      // Snap to hole — use original (pre-translation) layout so already-snapped shapes don't drift
      const snapX = holeLayout.x - (originalShapeLayouts.current[shapeId]?.x ?? shapeLayouts.current[shapeId]?.x ?? 0);
      const snapY = holeLayout.y - (originalShapeLayouts.current[shapeId]?.y ?? shapeLayouts.current[shapeId]?.y ?? 0);
      Animated.spring(positions[shapeIndex], {
        toValue: { x: snapX, y: snapY },
        useNativeDriver: false,
        damping: 10,
        stiffness: 200,
      }).start();

      const newSorted = new Set([...sorted, shapeId]);
      setSorted(newSorted);

      if (newSorted.size >= 4) {
        const nextRound = round + 1;
        if (nextRound >= 5) {
          await completeGame('shape-sorter', 3);
          setShowComplete(true);
        } else {
          setTimeout(() => {
            setRound(nextRound);
            setSorted(new Set());
            positions.forEach(p => p.setValue({ x: 0, y: 0 }));
          }, 800);
        }
      }
    } else {
      Animated.spring(positions[shapeIndex], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    }
  }, [sorted, round, positions, completeGame]);

  const createPanResponder = useCallback((shapeId: string, shapeIndex: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !sorted.has(shapeId),
      onMoveShouldSetPanResponder: () => !sorted.has(shapeId),
      onPanResponderGrant: () => {
        console.log('[ShapeSorter] Drag started:', shapeId);
        positions[shapeIndex].setOffset({
          x: (positions[shapeIndex].x as any)._value,
          y: (positions[shapeIndex].y as any)._value,
        });
        positions[shapeIndex].setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: positions[shapeIndex].x, dy: positions[shapeIndex].y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt) => {
        positions[shapeIndex].flattenOffset();
        const { pageX, pageY } = evt.nativeEvent;
        handleDrop(shapeId, shapeIndex, pageX, pageY);
      },
    });
  }, [sorted, positions, handleDrop]);

  const panResponders = useRef(
    SHAPES.map((shape, i) => createPanResponder(shape.id, i))
  );

  // Recreate pan responders when sorted changes
  React.useEffect(() => {
    panResponders.current = SHAPES.map((shape, i) => createPanResponder(shape.id, i));
  }, [sorted, createPanResponder]);

  const handlePlayAgain = () => {
    console.log('[ShapeSorter] Play again pressed');
    setShowComplete(false);
    setRound(0);
    setSorted(new Set());
    positions.forEach(p => p.setValue({ x: 0, y: 0 }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[ShapeSorter] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.shapes} />
        </AnimatedPressable>
        <Text style={styles.title}>Shape Sorter 🔷</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Round {round + 1}/5</Text>
        </View>
      </View>

      <Text style={styles.instruction}>Drag each shape to its matching hole!</Text>

      {/* Holes */}
      <View style={styles.holesRow}>
        {SHAPES.map(shape => (
          <View
            key={shape.id}
            style={styles.hole}
            ref={(ref) => {
              if (ref) {
                ref.measure((_x, _y, width, height, pageX, pageY) => {
                  holeLayouts.current[shape.id] = {
                    x: pageX + width / 2,
                    y: pageY + height / 2,
                  };
                });
              }
            }}
          >
            <ShapeSvg id={shape.id} color={shape.color} size={HOLE_SIZE} filled={sorted.has(shape.id)} />
            <Text style={styles.holeLabel}>{shape.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Draggable shapes */}
      <View style={styles.shapesRow}>
        {SHAPES.map((shape, i) => (
          <Animated.View
            key={shape.id}
            style={[
              styles.draggableShape,
              {
                transform: [
                  { translateX: positions[i].x },
                  { translateY: positions[i].y },
                ],
                opacity: sorted.has(shape.id) ? 0.3 : 1,
              },
            ]}
            ref={(ref) => {
              if (ref) {
                (ref as any).measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
                  const center = { x: pageX + width / 2, y: pageY + height / 2 };
                  shapeLayouts.current[shape.id] = center;
                  // Only store original layout once — never overwrite after first measure
                  if (!originalShapeLayouts.current[shape.id]) {
                    originalShapeLayouts.current[shape.id] = center;
                  }
                });
              }
            }}
            {...panResponders.current[i].panHandlers}
          >
            <ShapeSvg id={shape.id} color={shape.color} size={SHAPE_SIZE} filled />
          </Animated.View>
        ))}
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={3}
        message="Shape Master!"
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.back()}
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
    backgroundColor: KIDS_COLORS.shapes,
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
  holesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    alignItems: 'center',
  },
  hole: {
    alignItems: 'center',
    gap: 8,
  },
  holeLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
  },
  divider: {
    height: 2,
    backgroundColor: KIDS_COLORS.border,
    marginVertical: 20,
  },
  shapesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  draggableShape: {
    padding: 8,
  },
});
