import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';
import { BadgeCelebration } from '@/components/BadgeCelebration';
import { Mascot } from '@/components/Mascot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PIECES = [
  { id: 0, emoji: '🌈', color: '#FFE5E5', label: 'Rainbow' },
  { id: 1, emoji: '☀️', color: '#FFF9C4', label: 'Sun' },
  { id: 2, emoji: '🌸', color: '#FCE4EC', label: 'Flower' },
  { id: 3, emoji: '🦋', color: '#E8F5E9', label: 'Butterfly' },
  { id: 4, emoji: '🌿', color: '#E0F2F1', label: 'Leaf' },
  { id: 5, emoji: '🐝', color: '#FFF8E1', label: 'Bee' },
];

const GRID_COLS = 3;
const PIECE_SIZE = (SCREEN_WIDTH - 48 - 16) / GRID_COLS;
const SNAP_THRESHOLD = 60;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function JigsawPuzzleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [shuffledOrder] = useState(() => shuffleArray(PIECES.map(p => p.id)));
  const [snapped, setSnapped] = useState<Set<number>>(new Set());
  const [showComplete, setShowComplete] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);

  const positions = useRef(PIECES.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const bounceAnims = useRef(PIECES.map(() => new Animated.Value(1))).current;

  const dropZoneLayouts = useRef<Record<number, { x: number; y: number }>>({});
  // Original (pre-translation) layout measured ONCE per piece — never updated after first measure
  const originalPieceLayouts = useRef<Record<number, { x: number; y: number }>>({});
  const hasMeasured = useRef<Record<number, boolean>>({});
  // Locked snap offsets stored at the moment of correct placement
  const lockedOffsets = useRef<Record<number, { x: number; y: number }>>({});

  const handleDrop = useCallback(async (pieceId: number, pageX: number, pageY: number) => {
    // Already placed — ignore
    if (lockedOffsets.current[pieceId]) return;

    const dropZone = dropZoneLayouts.current[pieceId];
    if (!dropZone) {
      Animated.spring(positions[pieceId], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      return;
    }

    const dx = Math.abs(pageX - dropZone.x);
    const dy = Math.abs(pageY - dropZone.y);
    const dist = Math.sqrt(dx * dx + dy * dy);

    console.log('[JigsawPuzzle] Piece dropped:', PIECES[pieceId].emoji, 'distance:', dist.toFixed(0));

    if (dist < SNAP_THRESHOLD) {
      const origin = originalPieceLayouts.current[pieceId];
      const snapX = origin ? dropZone.x - origin.x : 0;
      const snapY = origin ? dropZone.y - origin.y : 0;

      // Lock immediately so no subsequent re-render can move this piece
      lockedOffsets.current[pieceId] = { x: snapX, y: snapY };

      Animated.spring(positions[pieceId], {
        toValue: { x: snapX, y: snapY },
        useNativeDriver: false,
        damping: 8,
        stiffness: 200,
      }).start();

      // Bounce animation
      Animated.sequence([
        Animated.spring(bounceAnims[pieceId], { toValue: 1.2, useNativeDriver: true, damping: 6, stiffness: 300 }),
        Animated.spring(bounceAnims[pieceId], { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
      ]).start();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newSnapped = new Set([...snapped, pieceId]);
      setSnapped(newSnapped);

      if (newSnapped.size === PIECES.length) {
        console.log('[JigsawPuzzle] Puzzle complete!');
        setTimeout(async () => {
          const result = await completeGame('jigsaw-puzzle', 3);
          setNewBadges(result.newBadges);
          setShowComplete(true);
        }, 500);
      }
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(positions[pieceId], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    }
  }, [snapped, positions, bounceAnims, completeGame]);

  const createPanResponder = useCallback((pieceId: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedOffsets.current[pieceId],
      onMoveShouldSetPanResponder: () => !lockedOffsets.current[pieceId],
      onPanResponderGrant: () => {
        console.log('[JigsawPuzzle] Drag started:', PIECES[pieceId].emoji);
        positions[pieceId].setOffset({
          x: (positions[pieceId].x as any)._value,
          y: (positions[pieceId].y as any)._value,
        });
        positions[pieceId].setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: positions[pieceId].x, dy: positions[pieceId].y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt) => {
        positions[pieceId].flattenOffset();
        const { pageX, pageY } = evt.nativeEvent;
        handleDrop(pieceId, pageX, pageY);
      },
    });
  }, [positions, handleDrop]);

  const panResponders = useRef(PIECES.map(p => createPanResponder(p.id)));

  useEffect(() => {
    panResponders.current = PIECES.map(p => createPanResponder(p.id));
  }, [snapped, createPanResponder]);

  const handlePlayAgain = () => {
    console.log('[JigsawPuzzle] Play again pressed');
    setShowComplete(false);
    setSnapped(new Set());
    lockedOffsets.current = {};
    hasMeasured.current = {};
    originalPieceLayouts.current = {};
    positions.forEach(p => p.setValue({ x: 0, y: 0 }));
    bounceAnims.forEach(a => a.setValue(1));
  };

  const handleBadgeDismiss = () => {
    console.log('[JigsawPuzzle] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[JigsawPuzzle] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.shapes} />
        </AnimatedPressable>
        <Text style={styles.title}>Jigsaw Puzzle 🧩</Text>
        <Mascot size={56} animate={false} expression="happy" />
      </View>

      <Text style={styles.instruction}>Match each piece to its letter!</Text>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{snapped.size} / {PIECES.length} pieces placed</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(snapped.size / PIECES.length) * 100}%` as any }]} />
        </View>
      </View>

      {/* Drop zones grid */}
      <View style={styles.dropGrid}>
        {PIECES.map(piece => (
          <View
            key={piece.id}
            style={[
              styles.dropZone,
              snapped.has(piece.id) && styles.dropZoneFilled,
            ]}
            ref={(ref) => {
              if (ref) {
                (ref as any).measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
                  dropZoneLayouts.current[piece.id] = {
                    x: pageX + width / 2,
                    y: pageY + height / 2,
                  };
                });
              }
            }}
          >
            {snapped.has(piece.id) ? (
              <Text style={styles.dropZoneEmoji}>{piece.emoji}</Text>
            ) : (
              <Text style={styles.dropZoneHint}>{piece.label[0]}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Pieces tray */}
      <Text style={styles.trayLabel}>Pieces Tray</Text>
      <View style={styles.tray}>
        {shuffledOrder.map(pieceId => {
          const piece = PIECES[pieceId];
          const isSnapped = snapped.has(pieceId);
          return (
            <Animated.View
              key={pieceId}
              style={[
                styles.piece,
                { backgroundColor: piece.color },
                {
                  transform: [
                    { translateX: positions[pieceId].x },
                    { translateY: positions[pieceId].y },
                    { scale: bounceAnims[pieceId] },
                  ],
                  opacity: 1,
                  zIndex: isSnapped ? 0 : 10,
                  pointerEvents: isSnapped ? 'none' : 'auto',
                },
              ]}
              ref={(ref) => {
                if (ref && !hasMeasured.current[pieceId]) {
                  (ref as any).measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
                    if (!hasMeasured.current[pieceId]) {
                      hasMeasured.current[pieceId] = true;
                      originalPieceLayouts.current[pieceId] = {
                        x: pageX + width / 2,
                        y: pageY + height / 2,
                      };
                    }
                  });
                }
              }}
              {...panResponders.current[pieceId].panHandlers}
            >
              <Text style={styles.pieceEmoji}>{piece.emoji}</Text>
              <Text style={styles.pieceLabel}>{piece.label[0]}</Text>
            </Animated.View>
          );
        })}
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={3}
        message="Puzzle Master! 🧩"
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
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressRow: {
    marginBottom: 16,
    gap: 6,
  },
  progressText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: KIDS_COLORS.border,
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: KIDS_COLORS.shapes,
    borderRadius: 4,
  },
  dropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  dropZone: {
    width: PIECE_SIZE,
    height: PIECE_SIZE,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: KIDS_COLORS.shapes,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.08)',
  },
  dropZoneFilled: {
    borderStyle: 'solid',
    backgroundColor: KIDS_COLORS.shapesMuted,
    borderColor: KIDS_COLORS.success,
  },
  dropZoneEmoji: {
    fontSize: 40,
  },
  dropZoneHint: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: KIDS_COLORS.shapes,
    opacity: 0.3,
  },
  divider: {
    height: 2,
    backgroundColor: KIDS_COLORS.border,
    marginVertical: 16,
  },
  trayLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    flex: 1,
    alignContent: 'flex-start',
  },
  piece: {
    width: PIECE_SIZE,
    height: PIECE_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  pieceEmoji: {
    fontSize: 36,
  },
  pieceLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: KIDS_COLORS.shapes,
    marginTop: 2,
  },
});
