import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2, Star, Eraser } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';
import { BadgeCelebration } from '@/components/BadgeCelebration';
import { Mascot } from '@/components/Mascot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PALETTE_COLORS = [
  { id: 'red', color: '#FF4444', label: 'Red' },
  { id: 'orange', color: '#FF8C00', label: 'Orange' },
  { id: 'yellow', color: '#FFD700', label: 'Yellow' },
  { id: 'green', color: '#34D399', label: 'Green' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'purple', color: '#A78BFA', label: 'Purple' },
  { id: 'pink', color: '#F472B6', label: 'Pink' },
  { id: 'black', color: '#1A1A2E', label: 'Black' },
];

const BRUSH_SIZES = [
  { id: 'small', size: 4, label: 'S' },
  { id: 'medium', size: 10, label: 'M' },
  { id: 'large', size: 20, label: 'L' },
];

interface DrawPath {
  d: string;
  color: string;
  strokeWidth: number;
}

export default function DrawingCanvasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0].color);
  const [selectedBrush, setSelectedBrush] = useState(BRUSH_SIZES[1]);
  const [isEraser, setIsEraser] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);

  const isDrawing = useRef(false);
  const canvasRef = useRef<View>(null);
  const canvasLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const activeColorRef = useRef(selectedColor);
  const activeStrokeRef = useRef(selectedBrush.size);
  const isEraserRef = useRef(isEraser);

  // Keep refs in sync with state
  activeColorRef.current = isEraser ? '#FFFFFF' : selectedColor;
  activeStrokeRef.current = isEraser ? selectedBrush.size * 3 : selectedBrush.size;
  isEraserRef.current = isEraser;

  const getActiveColor = () => activeColorRef.current;
  const getActiveStrokeWidth = () => activeStrokeRef.current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDrawing.current = true;
        const { pageX, pageY } = evt.nativeEvent;
        const x = pageX - canvasLayout.current.x;
        const y = pageY - canvasLayout.current.y;
        setCurrentPath(`M${x.toFixed(1)},${y.toFixed(1)}`);
      },
      onPanResponderMove: (evt) => {
        if (!isDrawing.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const x = pageX - canvasLayout.current.x;
        const y = pageY - canvasLayout.current.y;
        setCurrentPath(prev => prev + ` L${x.toFixed(1)},${y.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        isDrawing.current = false;
        setCurrentPath(cp => {
          if (cp) {
            setPaths(prev => [
              ...prev,
              {
                d: cp,
                color: getActiveColor(),
                strokeWidth: getActiveStrokeWidth(),
              },
            ]);
          }
          return '';
        });
      },
    })
  ).current;

  const handleClear = () => {
    console.log('[DrawingCanvas] Clear button pressed');
    Alert.alert(
      'Clear Drawing?',
      'This will erase your whole drawing!',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            console.log('[DrawingCanvas] Drawing cleared');
            setPaths([]);
            setCurrentPath('');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    console.log('[DrawingCanvas] Save/complete pressed');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await completeGame('drawing-canvas', 3);
    setNewBadges(result.newBadges);
    setShowComplete(true);
  };

  const handleColorPress = (color: string) => {
    console.log('[DrawingCanvas] Color selected:', color);
    setSelectedColor(color);
    setIsEraser(false);
  };

  const handleBrushPress = (brush: typeof BRUSH_SIZES[0]) => {
    console.log('[DrawingCanvas] Brush size selected:', brush.id);
    setSelectedBrush(brush);
  };

  const handleEraserPress = () => {
    console.log('[DrawingCanvas] Eraser toggled:', !isEraser);
    setIsEraser(e => !e);
  };

  const handlePlayAgain = () => {
    console.log('[DrawingCanvas] Play again pressed');
    setShowComplete(false);
    setPaths([]);
    setCurrentPath('');
  };

  const handleBadgeDismiss = () => {
    console.log('[DrawingCanvas] Badge celebration dismissed');
    setShowBadges(false);
    setNewBadges([]);
  };

  const HEADER_HEIGHT = insets.top + 60;
  const TOOLBAR_HEIGHT = 140;
  const CANVAS_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TOOLBAR_HEIGHT - 20;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[DrawingCanvas] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.colors} />
        </AnimatedPressable>
        <Text style={styles.title}>Drawing Canvas 🎨</Text>
        <Mascot size={48} animate={false} expression="excited" />
      </View>

      {/* Canvas */}
      <View
        ref={canvasRef}
        style={[styles.canvas, { height: CANVAS_HEIGHT }]}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          canvasRef.current?.measure((_fx, _fy, _w, _h, pageX, pageY) => {
            canvasLayout.current = { x: pageX, y: pageY, width, height };
          });
        }}
        {...panResponder.panHandlers}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {paths.map((p, i) => (
            <Path
              key={i}
              d={p.d}
              stroke={p.color}
              strokeWidth={p.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath !== '' && (
            <Path
              d={currentPath}
              stroke={getActiveColor()}
              strokeWidth={getActiveStrokeWidth()}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>

        {paths.length === 0 && currentPath === '' && (
          <View style={styles.canvasPlaceholder} pointerEvents="none">
            <Text style={styles.canvasPlaceholderText}>Draw something! ✏️</Text>
          </View>
        )}
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Color palette */}
        <View style={styles.paletteRow}>
          {PALETTE_COLORS.map(item => (
            <AnimatedPressable
              key={item.id}
              style={[
                styles.colorDot,
                { backgroundColor: item.color },
                !isEraser && selectedColor === item.color && styles.colorDotSelected,
              ]}
              onPress={() => handleColorPress(item.color)}
            />
          ))}
        </View>

        {/* Brush sizes + tools */}
        <View style={styles.toolRow}>
          {BRUSH_SIZES.map(brush => (
            <AnimatedPressable
              key={brush.id}
              style={[styles.brushBtn, selectedBrush.id === brush.id && !isEraser && styles.brushBtnSelected]}
              onPress={() => handleBrushPress(brush)}
            >
              <View style={[styles.brushDot, { width: brush.size, height: brush.size, borderRadius: brush.size / 2, backgroundColor: isEraser ? KIDS_COLORS.textTertiary : selectedColor }]} />
              <Text style={styles.brushLabel}>{brush.label}</Text>
            </AnimatedPressable>
          ))}

          <View style={styles.toolSeparator} />

          <AnimatedPressable
            style={[styles.toolBtn, isEraser && styles.toolBtnActive]}
            onPress={handleEraserPress}
          >
            <Eraser size={20} color={isEraser ? '#FFFFFF' : KIDS_COLORS.textSecondary} />
          </AnimatedPressable>

          <AnimatedPressable style={styles.toolBtn} onPress={handleClear}>
            <Trash2 size={20} color={KIDS_COLORS.danger} />
          </AnimatedPressable>

          <AnimatedPressable style={[styles.toolBtn, styles.saveBtn]} onPress={handleSave}>
            <Star size={20} color="#FFFFFF" />
          </AnimatedPressable>
        </View>
      </View>

      <GameCompleteOverlay
        visible={showComplete}
        stars={3}
        message="Beautiful artwork! 🎨"
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
    backgroundColor: KIDS_COLORS.colorsMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
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
  canvas: {
    marginHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  canvasPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasPlaceholderText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: KIDS_COLORS.textTertiary,
  },
  toolbar: {
    backgroundColor: KIDS_COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    gap: 10,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: KIDS_COLORS.text,
    transform: [{ scale: 1.2 }],
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brushBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: KIDS_COLORS.background,
    gap: 2,
  },
  brushBtnSelected: {
    backgroundColor: KIDS_COLORS.colorsMuted,
    borderWidth: 2,
    borderColor: KIDS_COLORS.colors,
  },
  brushDot: {
    backgroundColor: KIDS_COLORS.text,
  },
  brushLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: KIDS_COLORS.textSecondary,
  },
  toolSeparator: {
    flex: 1,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: KIDS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: KIDS_COLORS.shapes,
  },
  saveBtn: {
    backgroundColor: KIDS_COLORS.primary,
  },
});
