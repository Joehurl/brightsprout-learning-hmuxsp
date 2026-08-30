import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Confetti } from '@/components/Confetti';
import { BADGES } from '@/utils/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BadgeCelebrationProps {
  badges: string[];
  onDismiss: () => void;
  visible: boolean;
}

export function BadgeCelebration({ badges, onDismiss, visible }: BadgeCelebrationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;

  const currentBadgeId = badges[currentIndex];
  const currentBadge = BADGES.find(b => b.id === currentBadgeId);

  const isLast = currentIndex >= badges.length - 1;

  useEffect(() => {
    if (visible && badges.length > 0) {
      console.log('[BadgeCelebration] Showing badge celebration for:', badges);
      setCurrentIndex(0);
      scaleAnim.setValue(0); // eslint-disable-line react-hooks/exhaustive-deps
      emojiScale.setValue(0); // eslint-disable-line react-hooks/exhaustive-deps
      shimmerAnim.setValue(0); // eslint-disable-line react-hooks/exhaustive-deps

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 180,
        }),
        Animated.delay(100),
        Animated.spring(emojiScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 8,
          stiffness: 200,
        }),
      ]).start();

      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      shimmerLoop.start();
    } else {
      shimmerAnim.stopAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, badges]);

  const handleNext = () => {
    console.log('[BadgeCelebration] Next badge pressed, index:', currentIndex + 1);
    const nextIndex = currentIndex + 1;
    if (nextIndex < badges.length) {
      emojiScale.setValue(0);
      scaleAnim.setValue(0);
      setCurrentIndex(nextIndex);
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 180,
        }),
        Animated.spring(emojiScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 8,
          stiffness: 200,
        }),
      ]).start();
    }
  };

  const handleDismiss = () => {
    console.log('[BadgeCelebration] Dismissed');
    onDismiss();
  };

  if (!visible || badges.length === 0 || !currentBadge) return null;

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const badgeCountText = badges.length > 1 ? `${currentIndex + 1} / ${badges.length}` : '';

  return (
    <Modal visible={visible} transparent animationType="none">
      <Confetti visible={visible} />
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Gold shimmer background */}
          <Animated.View style={[styles.shimmerBg, { opacity: shimmerOpacity }]} />

          <Text style={styles.newBadgeLabel}>🎉 New Badge!</Text>

          {badgeCountText !== '' && (
            <Text style={styles.badgeCount}>{badgeCountText}</Text>
          )}

          <Animated.Text style={[styles.badgeEmoji, { transform: [{ scale: emojiScale }] }]}>
            {currentBadge.emoji}
          </Animated.Text>

          <Text style={styles.badgeName}>{currentBadge.name}</Text>
          <Text style={styles.badgeDescription}>{currentBadge.description}</Text>

          {isLast ? (
            <AnimatedPressable style={styles.awesomeBtn} onPress={handleDismiss}>
              <Text style={styles.awesomeBtnText}>Awesome! 🌟</Text>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next Badge →</Text>
            </AnimatedPressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH - 64,
    overflow: 'hidden',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  shimmerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF9E6',
    borderRadius: 32,
  },
  newBadgeLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.primary,
    marginBottom: 4,
    zIndex: 1,
  },
  badgeCount: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textTertiary,
    marginBottom: 8,
    zIndex: 1,
  },
  badgeEmoji: {
    fontSize: 80,
    marginVertical: 16,
    zIndex: 1,
  },
  badgeName: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 26,
    color: KIDS_COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  badgeDescription: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    zIndex: 1,
  },
  awesomeBtn: {
    backgroundColor: KIDS_COLORS.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    zIndex: 1,
  },
  awesomeBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  nextBtn: {
    backgroundColor: KIDS_COLORS.secondary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    zIndex: 1,
  },
  nextBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
});
