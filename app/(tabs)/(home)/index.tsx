import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Mascot } from '@/components/Mascot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 48 - 12) / 2;

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  games: string[];
}

const CATEGORIES: Category[] = [
  { id: 'letters', label: 'Letters', emoji: '🔤', color: KIDS_COLORS.letters, bg: KIDS_COLORS.lettersMuted, games: ['alphabet-adventure', 'letter-trace', 'letter-match', 'phonics', 'spelling-bee'] },
  { id: 'numbers', label: 'Numbers', emoji: '🔢', color: KIDS_COLORS.numbers, bg: KIDS_COLORS.numbersMuted, games: ['counting', 'number-quiz', 'addition'] },
  { id: 'shapes', label: 'Shapes', emoji: '🔷', color: KIDS_COLORS.shapes, bg: KIDS_COLORS.shapesMuted, games: ['shape-sorter', 'memory-match', 'picture-word-match'] },
  { id: 'colors', label: 'Colors', emoji: '🎨', color: KIDS_COLORS.colors, bg: KIDS_COLORS.colorsMuted, games: ['color-paint', 'drawing-canvas'] },
  { id: 'animals', label: 'Animals', emoji: '🦁', color: KIDS_COLORS.animals, bg: KIDS_COLORS.animalsMuted, games: ['animal-sounds'] },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const { isSubscribed } = useSubscription();



  const getCategoryStars = (games: string[]) => {
    return games.reduce((sum, gameId) => {
      const g = progress.games[gameId];
      return sum + (g ? g.starsEarned : 0);
    }, 0);
  };

  const streakText = progress.streak > 0 ? `🔥 Day ${progress.streak} streak! Keep it up!` : '🌱 Start your learning streak today!';

  const handleCategoryPress = (categoryId: string) => {
    console.log('[HomeScreen] Category pressed:', categoryId);
    router.push(`/(tabs)/(home)/category/${categoryId}` as any);
  };

  const handlePremiumBannerPress = () => {
    console.log('[HomeScreen] Premium banner pressed — opening paywall');
    router.push('/paywall' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Mascot size={100} animate={true} expression="happy" />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hi there!</Text>
            <Text style={styles.subtitle}>Ready to learn?</Text>
          </View>
        </View>

        {/* Premium Banner — only shown to non-subscribers */}
        {!isSubscribed && (
          <AnimatedPressable style={styles.premiumBanner} onPress={handlePremiumBannerPress}>
            <Text style={styles.premiumBannerEmoji}>🔓</Text>
            <View style={styles.premiumBannerText}>
              <Text style={styles.premiumBannerTitle}>Unlock All Games</Text>
              <Text style={styles.premiumBannerSub}>One-time $4.99 • Yours forever</Text>
            </View>
            <Text style={styles.premiumBannerArrow}>›</Text>
          </AnimatedPressable>
        )}

        <Text style={styles.mainTitle}>Let's Play & Learn!</Text>

        {/* Category Grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const stars = getCategoryStars(cat.games);
            const maxStars = cat.games.length * 3;
            return (
              <AnimatedPressable
                key={cat.id}
                style={[styles.card, { backgroundColor: cat.bg }]}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <Text style={styles.cardEmoji}>{cat.emoji}</Text>
                <Text style={[styles.cardLabel, { color: cat.color }]}>{cat.label}</Text>
                <View style={[styles.starBadge, { backgroundColor: cat.color }]}>
                  <Text style={styles.starBadgeText}>⭐ {stars}/{maxStars}</Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Streak Banner */}
        <View style={styles.streakBanner}>
          <Text style={styles.streakText}>{streakText}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },

  headerText: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.text,
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
  },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: KIDS_COLORS.primary,
    gap: 12,
  },
  premiumBannerEmoji: {
    fontSize: 28,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: KIDS_COLORS.primary,
  },
  premiumBannerSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
  },
  premiumBannerArrow: {
    fontSize: 24,
    color: KIDS_COLORS.primary,
    fontFamily: 'Nunito_700Bold',
  },

  mainTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: KIDS_COLORS.text,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: CARD_SIZE,
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  cardLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  starBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  starBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  streakBanner: {
    backgroundColor: KIDS_COLORS.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  streakText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
