import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  useWindowDimensions,
  ScrollView,
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

const PIECE_COUNT = 6;
const SNAP_THRESHOLD = 80;

const PIECES = [
  { id: 0, label: 'S', name: 'Sun',     color: '#FFD700', emoji: '☀️' },
  { id: 1, label: 'C', name: 'Cloud',   color: '#87CEEB', emoji: '☁️' },
  { id: 2, label: 'H', name: 'House',   color: '#F4A460', emoji: '🏠' },
  { id: 3, label: 'T', name: 'Tree',    color: '#228B22', emoji: '🌳' },
  { id: 4, label: 'F', name: 'Flower',  color: '#FF69B4', emoji: '🌸' },
  { id: 5, label: 'R', name: 'Rainbow', color: '#A78BFA', emoji: '🌈' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function JigsawPuzzleScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const DROP_SIZE = Math.floor((SCREEN_WIDTH - 48 - 32) / 3);
  // Tray piece size scales with screen height, capped so it fits
  const TRAY_PIECE_SIZE = Math.min(Math.round(SCREEN_HEIGHT * 0.09), 72);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [shuffledOrder] = useState(() => shuffleArray(PIECES.map(p => p.id)));
  const [snapped, setSnapped] = useState<Set<number>>(new Set());
  const [showComplete, setShowComplete] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);

  const [draggingPieceId, setDraggingPieceId] = useState<number | null>(null);
  const draggingPieceIdRef = useRef<number | null>(null);
  const dragOverlayPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const bounceAnims = useRef(PIECES.map(() => new Animated.Value(1))).current;

  const dropZoneLayouts = useRef<Record<number, { x: number; y: number }>>({});
  const dropZoneRefs = useRef<Map<number, View | null>>(new Map());
  const hasMeasured = useRef<Record<number, boolean>>({});
  const lockedOffsets = useRef<Record<number, boolean>>({});
  const snappedCountRef = useRef(0);

  const handleDrop = useCallback(async (pieceId: number, pageX: number, pageY: number) => {
    if (lockedOffsets.current[pieceId]) return;

    const dropZone = dropZoneLayouts.current[pieceId];
    if (!dropZone) {
      console.log('[JigsawPuzzle] Drop zone not measured yet for piece:', PIECES[pieceId].name);
      return;
    }

    const dx = Math.abs(pageX - dropZone.x);
    const dy = Math.abs(pageY - dropZone.y);
    const dist = Math.sqrt(dx * dx + dy * dy);

    console.log('[JigsawPuzzle] Piece dropped:', PIECES[pieceId].name, 'distance:', dist.toFixed(0));

    if (dist < SNAP_THRESHOLD) {
      lockedOffsets.current[pieceId] = true;

      Animated.sequence([
        Animated.spring(bounceAnims[pieceId], { toValue: 1.2, useNativeDriver: true, damping: 6, stiffness: 300 }),
        Animated.spring(bounceAnims[pieceId], { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
      ]).start();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      snappedCountRef.current += 1;
      setSnapped(prev => new Set([...prev, pieceId]));

      if (snappedCountRef.current === PIECE_COUNT) {
        console.log('[JigsawPuzzle] Puzzle complete!');
        setTimeout(async () => {
          const result = await completeGame('jigsaw-puzzle', 3);
          setNewBadges(result.newBadges);
          setShowComplete(true);
        }, 500);
      }
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [bounceAnims, completeGame]);

  const panResponders = useRef(
    PIECES.map(piece =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !lockedOffsets.current[piece.id],
        onMoveShouldSetPanResponder: () => !lockedOffsets.current[piece.id],
        onPanResponderGrant: (evt) => {
          console.log('[JigsawPuzzle] Drag started:', piece.name);
          const { pageX, pageY } = evt.nativeEvent;
          dragOverlayPos.setValue({
            x: pageX - TRAY_PIECE_SIZE / 2,
            y: pageY - TRAY_PIECE_SIZE / 2,
          });
          draggingPieceIdRef.current = piece.id;
          setDraggingPieceId(piece.id);
        },
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          dragOverlayPos.setValue({
            x: pageX - TRAY_PIECE_SIZE / 2,
            y: pageY - TRAY_PIECE_SIZE / 2,
          });
        },
        onPanResponderRelease: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          draggingPieceIdRef.current = null;
          setDraggingPieceId(null);
          handleDrop(piece.id, pageX, pageY);
        },
        onPanResponderTerminate: () => {
          draggingPieceIdRef.current = null;
          setDraggingPieceId(null);
        },
      })
    )
  ).current;

  const handlePlayAgain = () => {
    console.log('[JigsawPuzzle] Play again pressed');
    setShowComplete(false);
    setSnapped(new Set());
    snappedCountRef.current = 0;
    lockedOffsets.current = {};
    hasMeasured.current = {};
    bounceAnims.forEach(a => a.setValue(1));
  };

  const handleBadgeDismiss = () => {
    console.log('[JigsawPuzzle] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
  };

  const snappedSize = snapped.size;
  const progressPct = `${(snappedSize / PIECE_COUNT) * 100}%` as `${number}%`;
  const draggingPiece = draggingPieceId !== null ? PIECES[draggingPieceId] : null;

  return (
    <View style={styles.outerWrapper}>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedPressable
            style={styles.backBtn}
            onPress={() => {
              console.log('[JigsawPuzzle] Back pressed');
              router.back();
            }}
          >
            <ChevronLeft size={26} color={KIDS_COLORS.shapes} />
          </AnimatedPressable>
          <Text style={styles.title}>Jigsaw Puzzle 🧩</Text>
          <Mascot size={44} animate={false} expression="happy" />
        </View>

        <Text style={styles.instruction}>Drag each piece to its matching spot!</Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{snappedSize} / {PIECE_COUNT} pieces placed</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: progressPct }]} />
          </View>
        </View>

        {/* Drop zones grid */}
        <View
          style={styles.dropGrid}
          onLayout={() => {
            setTimeout(() => {
              dropZoneRefs.current.forEach((ref, pieceId) => {
                if (ref) {
                  (ref as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                    dropZoneLayouts.current[pieceId] = { x: x + w / 2, y: y + h / 2 };
                  });
                }
              });
            }, 300);
          }}
        >
          {PIECES.map(piece => {
            const isSnapped = snapped.has(piece.id);
            return (
              <View
                key={piece.id}
                ref={(ref) => {
                  dropZoneRefs.current.set(piece.id, ref);
                  if (ref) {
                    setTimeout(() => {
                      (ref as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                        dropZoneLayouts.current[piece.id] = { x: x + w / 2, y: y + h / 2 };
                      });
                    }, 200);
                  }
                }}
              >
                {isSnapped ? (
                  <SnappedDropZone piece={piece} dropSize={DROP_SIZE} />
                ) : (
                  <EmptyDropZone piece={piece} dropSize={DROP_SIZE} />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Pieces tray */}
        <Text style={styles.trayLabel}>Pieces Tray</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.trayContent, { gap: 10 }]}
          style={styles.tray}
        >
          {shuffledOrder.map(pieceId => {
            const piece = PIECES[pieceId];
            const isSnapped = snapped.has(pieceId);
            const isDragging = draggingPieceId === pieceId;
            const pieceOpacity = isSnapped ? 0.3 : isDragging ? 0 : 1;
            return (
              <Animated.View
                key={pieceId}
                style={[
                  styles.pieceWrapper,
                  {
                    width: TRAY_PIECE_SIZE,
                    height: TRAY_PIECE_SIZE,
                    transform: [{ scale: bounceAnims[pieceId] }],
                    zIndex: isSnapped ? 0 : 10,
                    opacity: pieceOpacity,
                    pointerEvents: isSnapped ? 'none' : 'auto',
                  },
                ]}
                ref={(ref) => {
                  if (ref && !hasMeasured.current[pieceId]) {
                    setTimeout(() => {
                      if (!hasMeasured.current[pieceId]) {
                        hasMeasured.current[pieceId] = true;
                      }
                    }, 100);
                  }
                }}
                {...panResponders[pieceId].panHandlers}
              >
                <TrayPiece piece={piece} size={TRAY_PIECE_SIZE} />
              </Animated.View>
            );
          })}
        </ScrollView>

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

      {draggingPiece !== null && (
        <Animated.View
          style={[
            styles.dragOverlay,
            {
              pointerEvents: 'none',
              width: TRAY_PIECE_SIZE,
              height: TRAY_PIECE_SIZE,
              transform: [
                { translateX: dragOverlayPos.x },
                { translateY: dragOverlayPos.y },
              ],
            },
          ]}
        >
          <TrayPiece piece={draggingPiece} size={TRAY_PIECE_SIZE} />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PieceData {
  id: number;
  label: string;
  name: string;
  color: string;
  emoji: string;
}

function TrayPiece({ piece, size }: { piece: PieceData; size: number }) {
  const emojiFontSize = Math.round(size * 0.36);
  const labelFontSize = Math.round(size * 0.22);
  return (
    <View style={[styles.trayPiece, { backgroundColor: piece.color, width: size, height: size }]}>
      <Text style={[styles.trayPieceEmoji, { fontSize: emojiFontSize }]}>{piece.emoji}</Text>
      <Text style={[styles.trayPieceLabel, { fontSize: labelFontSize }]}>{piece.label}</Text>
    </View>
  );
}

function EmptyDropZone({ piece, dropSize }: { piece: PieceData; dropSize: number }) {
  return (
    <View style={[styles.emptyDropZone, { width: dropSize, height: dropSize }]}>
      <Text style={[styles.emptyDropZoneLabel, { color: KIDS_COLORS.shapes, fontSize: dropSize * 0.35 }]}>{piece.label}</Text>
    </View>
  );
}

function SnappedDropZone({ piece, dropSize }: { piece: PieceData; dropSize: number }) {
  return (
    <View style={[styles.snappedDropZone, { backgroundColor: piece.color, width: dropSize, height: dropSize }]}>
      <Text style={[styles.snappedDropZoneEmoji, { fontSize: dropSize * 0.4 }]}>{piece.emoji}</Text>
      <Text style={[styles.snappedDropZoneLabel, { fontSize: dropSize * 0.25 }]}>{piece.label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: KIDS_COLORS.shapesMuted,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
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
    fontSize: 20,
    color: KIDS_COLORS.text,
    flex: 1,
  },
  instruction: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressRow: {
    marginBottom: 10,
    gap: 5,
  },
  progressText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: KIDS_COLORS.border,
    borderRadius: 4,
  },
  progressBarFill: {
    height: 7,
    backgroundColor: KIDS_COLORS.shapes,
    borderRadius: 4,
  },
  dropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: KIDS_COLORS.border,
    marginVertical: 10,
  },
  trayLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  tray: {
    flexGrow: 0,
  },
  trayContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pieceWrapper: {
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  dragOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 9999,
    elevation: 9999,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  trayPiece: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  trayPieceEmoji: {
  },
  trayPieceLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptyDropZone: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: KIDS_COLORS.shapes,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(167,139,250,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDropZoneLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    opacity: 0.4,
  },
  snappedDropZone: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  snappedDropZoneEmoji: {
  },
  snappedDropZoneLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
});
