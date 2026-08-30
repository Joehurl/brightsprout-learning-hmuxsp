import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Confetti } from '@/components/Confetti';
import { playSound } from '@/utils/sounds';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameCompleteOverlayProps {
  visible: boolean;
  stars: number;
  message: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const MESSAGES = ['Amazing!', 'Super Star!', 'Brilliant!', 'Fantastic!', 'Wonderful!'];

export function GameCompleteOverlay({ visible, stars, message, onPlayAgain, onGoHome }: GameCompleteOverlayProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const star1 = useRef(new Animated.Value(0)).current;
  const star2 = useRef(new Animated.Value(0)).current;
  const star3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      console.log('[GameCompleteOverlay] showing overlay, stars:', stars);
      playSound('complete');
      slideAnim.setValue(SCREEN_HEIGHT);
      star1.setValue(0);
      star2.setValue(0);
      star3.setValue(0);

      Animated.sequence([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 120,
        }),
        Animated.delay(200),
        Animated.spring(star1, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
        Animated.delay(150),
        Animated.spring(star2, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
        Animated.delay(150),
        Animated.spring(star3, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
      ]).start(() => {
        // Play star sounds staggered after animation
        const starCount = Math.min(stars, 3);
        for (let i = 0; i < starCount; i++) {
          setTimeout(() => {
            console.log('[GameCompleteOverlay] star sound', i + 1);
            playSound('star');
          }, i * 180);
        }
      });
    }
  }, [visible]);

  const starAnims = [star1, star2, star3];

  const starScale1 = star1.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const starScale2 = star2.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const starScale3 = star3.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const starScales = [starScale1, starScale2, starScale3];

  return (
    <Modal visible={visible} transparent animationType="none">
      <Confetti visible={visible} />
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Game Complete!</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.starsRow}>
            {[0, 1, 2].map(i => (
              <Animated.Text
                key={i}
                style={[
                  styles.starEmoji,
                  { transform: [{ scale: starScales[i] }] },
                  i >= stars && styles.starEmpty,
                ]}
              >
                {i < stars ? '⭐' : '☆'}
              </Animated.Text>
            ))}
          </View>

          <View style={styles.buttons}>
            <AnimatedPressable
              style={styles.playAgainBtn}
              onPress={() => {
                console.log('[GameCompleteOverlay] Play Again pressed');
                onPlayAgain();
              }}
            >
              <Text style={styles.playAgainText}>Play Again 🔄</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.homeBtn}
              onPress={() => {
                console.log('[GameCompleteOverlay] Back to Games pressed');
                onGoHome();
              }}
            >
              <Text style={styles.homeBtnText}>Back to Games 🏠</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: KIDS_COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    alignItems: 'center',
    paddingBottom: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: KIDS_COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: KIDS_COLORS.textSecondary,
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  starEmoji: {
    fontSize: 48,
  },
  starEmpty: {
    opacity: 0.3,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  playAgainBtn: {
    backgroundColor: KIDS_COLORS.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  homeBtn: {
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: KIDS_COLORS.primary,
  },
});
