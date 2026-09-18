import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Defs, ClipPath, Path, Circle, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
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

// 3 cols × 2 rows = 6 pieces
// Full scene SVG viewBox: 300×200
// Each piece covers a 100×100 region: col*100, row*100
const GRID_COLS = 3;
const GRID_ROWS = 2;
const PIECE_COUNT = GRID_COLS * GRID_ROWS;
const SNAP_THRESHOLD = 80;

// Piece display size in tray and drop zone
const DROP_PIECE_SIZE = Math.floor((SCREEN_WIDTH - 48 - 16) / GRID_COLS);
const TRAY_PIECE_SIZE = 80;

// Piece metadata: id = row*3+col
const PIECES = [
  { id: 0, col: 0, row: 0, label: 'S', name: 'Sun' },
  { id: 1, col: 1, row: 0, label: 'C', name: 'Cloud' },
  { id: 2, col: 2, row: 0, label: 'H', name: 'House' },
  { id: 3, col: 0, row: 1, label: 'T', name: 'Tree' },
  { id: 4, col: 1, row: 1, label: 'F', name: 'Flower' },
  { id: 5, col: 2, row: 1, label: 'R', name: 'Rainbow' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the jigsaw clip path for a piece at (col, row) in a 3×2 grid.
// The path covers a 100×100 region. Tab = semicircle protruding outward (r=12).
// Notch = semicircle cut inward.
// Pattern: right edge has tab if (col+row) is even, notch if odd.
// Left edge is opposite of the right edge of the piece to its left.
// Top edge matches the bottom of the piece above (tab if row>0 and above-piece bottom was notch, etc.)
// Row 0 top = flat. Col 0 left = flat. Col 2 right = flat. Row 1 bottom = flat.
function getPieceClipPath(col: number, row: number, size: number): string {
  const R = size * 0.12; // connector radius
  const S = size; // piece size (100 in scene coords, or scaled)

  // Determine edge types: true = tab (protrudes out), false = notch (cut in)
  const rightTab = (col + row) % 2 === 0;
  const leftTab = col === 0 ? null : !((col - 1 + row) % 2 === 0); // opposite of left neighbor's right
  const topTab = row === 0 ? null : !((col + (row - 1)) % 2 === 0); // opposite of above neighbor's bottom
  const bottomTab = row === GRID_ROWS - 1 ? null : !rightTab; // notch if right is tab, tab if right is notch (arbitrary but consistent)

  // Build path starting from top-left, going clockwise
  // Top edge (left to right)
  let d = `M 0 0 `;

  if (topTab === null) {
    // flat top
    d += `L ${S} 0 `;
  } else {
    const mid = S / 2;
    d += `L ${mid - R} 0 `;
    d += `A ${R} ${R} 0 0 ${topTab ? 0 : 1} ${mid + R} 0 `;
    d += `L ${S} 0 `;
  }

  // Right edge (top to bottom)
  if (col === GRID_COLS - 1) {
    // flat right
    d += `L ${S} ${S} `;
  } else {
    const mid = S / 2;
    d += `L ${S} ${mid - R} `;
    d += `A ${R} ${R} 0 0 ${rightTab ? 1 : 0} ${S} ${mid + R} `;
    d += `L ${S} ${S} `;
  }

  // Bottom edge (right to left)
  if (bottomTab === null) {
    // flat bottom
    d += `L 0 ${S} `;
  } else {
    const mid = S / 2;
    d += `L ${mid + R} ${S} `;
    d += `A ${R} ${R} 0 0 ${bottomTab ? 1 : 0} ${mid - R} ${S} `;
    d += `L 0 ${S} `;
  }

  // Left edge (bottom to top)
  if (leftTab === null) {
    // flat left
    d += `L 0 0 `;
  } else {
    const mid = S / 2;
    d += `L 0 ${mid + R} `;
    d += `A ${R} ${R} 0 0 ${leftTab ? 1 : 0} 0 ${mid - R} `;
    d += `L 0 0 `;
  }

  d += 'Z';
  return d;
}

// The full kids scene SVG content (300×200 viewBox)
// Rendered inside each piece clipped to its region
function SceneSvgContent() {
  return (
    <>
      {/* Sky background */}
      <Rect x={0} y={0} width={300} height={200} fill="#87CEEB" />
      {/* Rainbow */}
      <Path d="M 200 200 A 80 80 0 0 1 360 200" stroke="#FF6B6B" strokeWidth={8} fill="none" />
      <Path d="M 210 200 A 70 70 0 0 1 350 200" stroke="#FFD700" strokeWidth={8} fill="none" />
      <Path d="M 220 200 A 60 60 0 0 1 340 200" stroke="#44CC44" strokeWidth={8} fill="none" />
      <Path d="M 230 200 A 50 50 0 0 1 330 200" stroke="#4488FF" strokeWidth={8} fill="none" />
      {/* Sun */}
      <Circle cx={50} cy={40} r={28} fill="#FFD700" />
      <Path d="M 50 5 L 50 15 M 50 65 L 50 75 M 15 40 L 25 40 M 75 40 L 85 40 M 25 15 L 32 22 M 68 58 L 75 65 M 75 15 L 68 22 M 25 65 L 32 58" stroke="#FFD700" strokeWidth={4} strokeLinecap="round" />
      {/* Clouds */}
      <Ellipse cx={160} cy={30} rx={35} ry={18} fill="#FFFFFF" />
      <Ellipse cx={145} cy={38} rx={22} ry={14} fill="#FFFFFF" />
      <Ellipse cx={178} cy={38} rx={22} ry={14} fill="#FFFFFF" />
      <Ellipse cx={260} cy={50} rx={28} ry={14} fill="#FFFFFF" />
      <Ellipse cx={248} cy={57} rx={18} ry={11} fill="#FFFFFF" />
      <Ellipse cx={272} cy={57} rx={18} ry={11} fill="#FFFFFF" />
      {/* Ground */}
      <Rect x={0} y={150} width={300} height={50} fill="#5DBB63" />
      {/* House body */}
      <Rect x={110} y={110} width={80} height={60} fill="#F4A460" />
      {/* Roof */}
      <Path d="M 100 115 L 150 75 L 200 115 Z" fill="#CC4444" />
      {/* Door */}
      <Rect x={138} y={140} width={24} height={30} fill="#8B4513" rx={4} />
      {/* Window */}
      <Rect x={118} y={120} width={20} height={18} fill="#87CEEB" rx={3} />
      <Rect x={162} y={120} width={20} height={18} fill="#87CEEB" rx={3} />
      {/* Tree trunk */}
      <Rect x={42} y={130} width={16} height={30} fill="#8B4513" />
      {/* Tree top */}
      <Ellipse cx={50} cy={115} rx={28} ry={32} fill="#228B22" />
      <Ellipse cx={50} cy={100} rx={22} ry={26} fill="#2ECC40" />
      {/* Flowers */}
      <Circle cx={230} cy={148} r={8} fill="#FF69B4" />
      <Circle cx={230} cy={148} r={4} fill="#FFD700" />
      <Circle cx={250} cy={152} r={7} fill="#FF4444" />
      <Circle cx={250} cy={152} r={3} fill="#FFD700" />
      <Circle cx={268} cy={147} r={8} fill="#9944CC" />
      <Circle cx={268} cy={147} r={4} fill="#FFD700" />
      {/* Flower stems */}
      <Path d="M 230 156 L 230 168" stroke="#228B22" strokeWidth={3} />
      <Path d="M 250 159 L 250 170" stroke="#228B22" strokeWidth={3} />
      <Path d="M 268 155 L 268 167" stroke="#228B22" strokeWidth={3} />
    </>
  );
}

interface PieceSvgProps {
  col: number;
  row: number;
  size: number;
  label: string;
  isDashed?: boolean;
}

function PieceSvg({ col, row, size, label, isDashed }: PieceSvgProps) {
  const clipId = `clip-${col}-${row}-${size}`;
  const clipPath = getPieceClipPath(col, row, size);

  if (isDashed) {
    // Ghost outline for drop zone
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={clipPath} />
          </ClipPath>
        </Defs>
        <Path
          d={clipPath}
          fill="rgba(167,139,250,0.08)"
          stroke={KIDS_COLORS.shapes}
          strokeWidth={2.5}
          strokeDasharray="6,4"
        />
        <SvgText
          x={size / 2}
          y={size / 2 + 10}
          textAnchor="middle"
          fontSize={size * 0.28}
          fontWeight="bold"
          fill={KIDS_COLORS.shapes}
          opacity={0.3}
        >
          {label}
        </SvgText>
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={clipPath} />
        </ClipPath>
      </Defs>
      {/* Scene content clipped to piece shape */}
      <Svg
        width={size}
        height={size}
        viewBox={`${col * 100} ${row * 100} 100 100`}
        clipPath={`url(#${clipId})`}
      >
        <SceneSvgContent />
      </Svg>
      {/* Piece border */}
      <Path
        d={clipPath}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={2}
      />
      {/* Label */}
      <SvgText
        x={size / 2}
        y={size / 2 + 8}
        textAnchor="middle"
        fontSize={size * 0.28}
        fontWeight="bold"
        fill="white"
        stroke="#333"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {label}
      </SvgText>
    </Svg>
  );
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

  // Drag overlay state
  const [draggingPieceId, setDraggingPieceId] = useState<number | null>(null);
  const draggingPieceIdRef = useRef<number | null>(null);
  const dragOverlayPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // positions are used ONLY for the snap spring animation after a successful drop
  const positions = useRef(PIECES.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const bounceAnims = useRef(PIECES.map(() => new Animated.Value(1))).current;

  const dropZoneLayouts = useRef<Record<number, { x: number; y: number }>>({});
  const dropZoneRefs = useRef<Map<number, View | null>>(new Map());
  const originalPieceLayouts = useRef<Record<number, { x: number; y: number }>>({});
  const hasMeasured = useRef<Record<number, boolean>>({});
  const lockedOffsets = useRef<Record<number, { x: number; y: number }>>({});
  // Track snapped count via ref so pan responder callbacks don't need stale closure
  const snappedCountRef = useRef(0);

  const handleDrop = useCallback(async (pieceId: number, pageX: number, pageY: number) => {
    if (lockedOffsets.current[pieceId]) return;

    const dropZone = dropZoneLayouts.current[pieceId];
    if (!dropZone) {
      Animated.spring(positions[pieceId], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      return;
    }

    const dx = Math.abs(pageX - dropZone.x);
    const dy = Math.abs(pageY - dropZone.y);
    const dist = Math.sqrt(dx * dx + dy * dy);

    console.log('[JigsawPuzzle] Piece dropped:', PIECES[pieceId].name, 'distance:', dist.toFixed(0));

    if (dist < SNAP_THRESHOLD) {
      const origin = originalPieceLayouts.current[pieceId];
      const snapX = origin ? dropZone.x - origin.x : 0;
      const snapY = origin ? dropZone.y - origin.y : 0;

      lockedOffsets.current[pieceId] = { x: snapX, y: snapY };

      Animated.spring(positions[pieceId], {
        toValue: { x: snapX, y: snapY },
        useNativeDriver: false,
        damping: 8,
        stiffness: 200,
      }).start();

      Animated.sequence([
        Animated.spring(bounceAnims[pieceId], { toValue: 1.2, useNativeDriver: true, damping: 6, stiffness: 300 }),
        Animated.spring(bounceAnims[pieceId], { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
      ]).start();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      snappedCountRef.current += 1;
      setSnapped(prev => {
        const next = new Set([...prev, pieceId]);
        return next;
      });

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
      Animated.spring(positions[pieceId], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    }
  }, [positions, bounceAnims, completeGame]);

  // Create pan responders ONCE — never recreated. Uses refs for all state checks.
  // Key principle: during drag the tray piece stays still (opacity 0).
  // Only the overlay moves, positioned directly in screen space via pageX/pageY.
  const panResponders = useRef(
    PIECES.map(piece =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !lockedOffsets.current[piece.id],
        onMoveShouldSetPanResponder: () => !lockedOffsets.current[piece.id],
        onPanResponderGrant: (evt) => {
          console.log('[JigsawPuzzle] Drag started:', piece.name);
          const { pageX, pageY } = evt.nativeEvent;
          // Position overlay centered on finger
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
    originalPieceLayouts.current = {};
    positions.forEach(p => p.setValue({ x: 0, y: 0 }));
    bounceAnims.forEach(a => a.setValue(1));
  };

  const handleBadgeDismiss = () => {
    console.log('[JigsawPuzzle] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
  };

  const snappedSize = snapped.size;
  const progressPct = `${(snappedSize / PIECE_COUNT) * 100}%` as any;

  // Resolve the piece being dragged for the overlay
  const draggingPiece = draggingPieceId !== null ? PIECES[draggingPieceId] : null;

  return (
    // Outer wrapper — no padding, flex:1. Overlay lives here so position:absolute
    // left:0 top:0 maps to true screen origin (unaffected by inner padding).
    <View style={styles.outerWrapper}>
      {/* Inner container with all the padding */}
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
            // Re-measure all drop zones after the grid lays out
            setTimeout(() => {
              dropZoneRefs.current.forEach((ref, pieceId) => {
                if (ref) {
                  (ref as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                    dropZoneLayouts.current[pieceId] = {
                      x: x + w / 2,
                      y: y + h / 2,
                    };
                  });
                }
              });
            }, 150);
          }}
        >
          {PIECES.map(piece => {
            const isSnapped = snapped.has(piece.id);
            return (
              <View
                key={piece.id}
                style={styles.dropZoneWrapper}
                ref={(ref) => {
                  dropZoneRefs.current.set(piece.id, ref);
                  if (ref) {
                    setTimeout(() => {
                      (ref as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                        dropZoneLayouts.current[piece.id] = {
                          x: x + w / 2,
                          y: y + h / 2,
                        };
                      });
                    }, 100);
                  }
                }}
              >
                {isSnapped ? (
                  <PieceSvg col={piece.col} row={piece.row} size={DROP_PIECE_SIZE} label={piece.label} />
                ) : (
                  <PieceSvg col={piece.col} row={piece.row} size={DROP_PIECE_SIZE} label={piece.label} isDashed />
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
          contentContainerStyle={styles.trayContent}
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
                    // No translateX/translateY — tray piece stays still during drag.
                    // positions values are only animated during snap spring after drop.
                    transform: [
                      { scale: bounceAnims[pieceId] },
                    ],
                    zIndex: isSnapped ? 0 : 10,
                    opacity: pieceOpacity,
                  },
                ]}
                pointerEvents={isSnapped ? 'none' : 'auto'}
                ref={(ref) => {
                  if (ref && !hasMeasured.current[pieceId]) {
                    setTimeout(() => {
                      if (!hasMeasured.current[pieceId]) {
                        (ref as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                          if (!hasMeasured.current[pieceId]) {
                            hasMeasured.current[pieceId] = true;
                            originalPieceLayouts.current[pieceId] = {
                              x: x + w / 2,
                              y: y + h / 2,
                            };
                          }
                        });
                      }
                    }, 100);
                  }
                }}
                {...panResponders[pieceId].panHandlers}
              >
                <PieceSvg col={piece.col} row={piece.row} size={TRAY_PIECE_SIZE} label={piece.label} />
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

      {/* Drag overlay — lives outside the padded container so position:absolute
          left:0 top:0 is the true screen origin. dragOverlayPos holds screen coords. */}
      {draggingPiece !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              transform: [
                { translateX: dragOverlayPos.x },
                { translateY: dragOverlayPos.y },
              ],
            },
          ]}
        >
          <PieceSvg col={draggingPiece.col} row={draggingPiece.row} size={TRAY_PIECE_SIZE} label={draggingPiece.label} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: KIDS_COLORS.shapesMuted,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    overflow: 'visible',
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
    marginBottom: 12,
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
  dropZoneWrapper: {
    width: DROP_PIECE_SIZE,
    height: DROP_PIECE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: KIDS_COLORS.border,
    marginVertical: 12,
  },
  trayLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  tray: {
    flexGrow: 0,
  },
  trayContent: {
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pieceWrapper: {
    width: TRAY_PIECE_SIZE,
    height: TRAY_PIECE_SIZE,
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
    width: TRAY_PIECE_SIZE,
    height: TRAY_PIECE_SIZE,
    zIndex: 9999,
    elevation: 9999,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
});
