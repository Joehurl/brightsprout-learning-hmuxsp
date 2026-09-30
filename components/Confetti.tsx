import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';

const CONFETTI_COLORS = ['#FF6B35', '#4ECDC4', '#FFD93D', '#FF6B6B', '#A78BFA', '#34D399', '#F472B6', '#F59E0B'];

interface ConfettiDot {
  x: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiProps {
  visible: boolean;
}

export function Confetti({ visible }: ConfettiProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const dots = useMemo<ConfettiDot[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.random() * 8,
      delay: Math.random() * 600,
    })),
  [SCREEN_WIDTH]);

  const animations = useRef(Array.from({ length: 20 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      const anims = animations.map((anim, i) =>
        Animated.sequence([
          Animated.delay(dots[i].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      Animated.parallel(anims).start();
    } else {
      animations.forEach(a => a.setValue(0));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((dot, i) => {
        const translateY = animations[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SCREEN_HEIGHT * 0.8],
        });
        const opacity = animations[i].interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = animations[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${(i % 2 === 0 ? 1 : -1) * 360}deg`],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: dot.x,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: dot.color,
              opacity,
              transform: [{ translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
