import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { BADGES } from '@/utils/progress';

interface SubjectDef {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  games: string[];
}

const SUBJECTS: SubjectDef[] = [
  { label: 'Letters', emoji: '🔤', color: KIDS_COLORS.letters, bg: KIDS_COLORS.lettersMuted, games: ['alphabet-adventure', 'letter-trace', 'letter-match', 'phonics', 'spelling-bee'] },
  { label: 'Numbers', emoji: '🔢', color: KIDS_COLORS.numbers, bg: KIDS_COLORS.numbersMuted, games: ['counting', 'number-quiz', 'addition'] },
  { label: 'Shapes', emoji: '🔷', color: KIDS_COLORS.shapes, bg: KIDS_COLORS.shapesMuted, games: ['shape-sorter', 'memory-match', 'jigsaw-puzzle'] },
  { label: 'Colors', emoji: '🎨', color: KIDS_COLORS.colors, bg: KIDS_COLORS.colorsMuted, games: ['color-paint', 'drawing-canvas'] },
  { label: 'Animals', emoji: '🦁', color: KIDS_COLORS.animals, bg: KIDS_COLORS.animalsMuted, games: ['animal-sounds'] },
];

const GAME_NAMES: Record<string, string> = {
  'alphabet-adventure': 'Alphabet Adventure',
  'letter-trace': 'Letter Tracing',
  'letter-match': 'Letter Match',
  'phonics': 'Phonics Fun',
  'spelling-bee': 'Spelling Bee',
  'counting': 'Counting Stars',
  'number-quiz': 'Number Quiz',
  'addition': 'Adding Up',
  'shape-sorter': 'Shape Sorter',
  'memory-match': 'Memory Match',
  'jigsaw-puzzle': 'Jigsaw Puzzle',
  'color-paint': 'Color Mixing',
  'drawing-canvas': 'Drawing Canvas',
  'animal-sounds': 'Animal Sounds',
};

function StarRating({ stars }: { stars: number }) {
  return (
    <View style={styles.starRow}>
      {[0, 1, 2].map(i => (
        <Text key={i} style={[styles.starIcon, i >= stars && styles.starEmpty]}>
          {i < stars ? '⭐' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function AnimatedProgressBar({ value, color }: { value: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value, widthAnim]);

  const widthInterp = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarBg}>
      <Animated.View style={[styles.progressBarFill, { width: widthInterp as any, backgroundColor: color }]} />
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { progress, refreshProgress } = useProgress();

  useFocusEffect(
    React.useCallback(() => {
      console.log('[ProgressScreen] focused, refreshing progress');
      refreshProgress();
    }, [refreshProgress])
  );

  const gamesCompleted = Object.values(progress.games).filter(g => g.completed).length;
  const xpToNextLevel = 100;
  const xpInCurrentLevel = (progress.xp || 0) % 100;
  const xpProgress = xpInCurrentLevel / xpToNextLevel;

  const earnedBadges = (progress.badges || []);
  const badgeCount = earnedBadges.length;
  const totalBadges = BADGES.length;

  // 7-day calendar dots
  const today = new Date();
  const lastPlayDate = progress.lastPlayDate;
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
    // Mark as played if it's the lastPlayDate (simplified — streak tells us consecutive days)
    const isToday = dayStr === today.toDateString();
    const daysAgo = 6 - i;
    const isPlayed = daysAgo < progress.streak || (isToday && lastPlayDate === today.toDateString());
    return { dayLabel, isPlayed, isToday };
  });

  const levelEmoji = progress.level >= 5 ? '👑' : progress.level >= 3 ? '🌳' : '🌱';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Journey 🌟</Text>
          <View style={styles.starsBadge}>
            <Text style={styles.starsBadgeText}>⭐ {progress.totalStars}</Text>
          </View>
        </View>

        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelCardTop}>
            <Text style={styles.levelEmoji}>{levelEmoji}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {progress.level}</Text>
              <Text style={styles.levelSubtitle}>
                {xpInCurrentLevel} / {xpToNextLevel} XP to next level
              </Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>{progress.xp || 0} XP</Text>
            </View>
          </View>
          <AnimatedProgressBar value={xpProgress} color={KIDS_COLORS.primary} />
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakCount}>{progress.streak}</Text>
              <Text style={styles.streakLabel}>days in a row!</Text>
            </View>
          </View>
          <View style={styles.calendarRow}>
            {calendarDays.map((day, i) => (
              <View key={i} style={styles.calendarDay}>
                <View style={[styles.calendarDot, day.isPlayed && styles.calendarDotPlayed, day.isToday && styles.calendarDotToday]}>
                  {day.isPlayed && <Text style={styles.calendarDotCheck}>✓</Text>}
                </View>
                <Text style={[styles.calendarDayLabel, day.isToday && styles.calendarDayLabelToday]}>
                  {day.dayLabel}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <Text style={styles.badgeCount}>{badgeCount} / {totalBadges}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll} contentContainerStyle={styles.badgesContent}>
            {BADGES.map(badge => {
              const isEarned = earnedBadges.includes(badge.id);
              return (
                <View key={badge.id} style={[styles.badgeItem, !isEarned && styles.badgeItemLocked]}>
                  <Text style={[styles.badgeEmoji, !isEarned && styles.badgeEmojiLocked]}>
                    {isEarned ? badge.emoji : '🔒'}
                  </Text>
                  <Text style={[styles.badgeName, !isEarned && styles.badgeNameLocked]} numberOfLines={2}>
                    {badge.name}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Subject Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Progress</Text>
          {SUBJECTS.map(subject => {
            const subjectStars = subject.games.reduce((sum, g) => sum + (progress.games[g]?.starsEarned || 0), 0);
            const maxStars = subject.games.length * 3;
            const pct = maxStars > 0 ? subjectStars / maxStars : 0;
            return (
              <View key={subject.label} style={styles.subjectRow}>
                <View style={[styles.subjectIconBg, { backgroundColor: subject.bg }]}>
                  <Text style={styles.subjectIcon}>{subject.emoji}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <View style={styles.subjectLabelRow}>
                    <Text style={[styles.subjectName, { color: subject.color }]}>{subject.label}</Text>
                    <Text style={styles.subjectStars}>⭐ {subjectStars}/{maxStars}</Text>
                  </View>
                  <AnimatedProgressBar value={pct} color={subject.color} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Games Played */}
        {gamesCompleted > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Games Completed 🎮</Text>
            {Object.values(progress.games)
              .filter(g => g.completed)
              .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
              .map(gp => {
                const gameName = GAME_NAMES[gp.gameId] || gp.gameId;
                return (
                  <View key={gp.gameId} style={styles.gameRow}>
                    <Text style={styles.gameRowName}>{gameName}</Text>
                    <View style={styles.gameRowRight}>
                      <Text style={styles.gamePlayCount}>×{gp.playCount}</Text>
                      <StarRating stars={gp.starsEarned} />
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {gamesCompleted === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>Start playing to track your progress!</Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: KIDS_COLORS.text,
  },
  starsBadge: {
    backgroundColor: KIDS_COLORS.accent,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  starsBadgeText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: KIDS_COLORS.text,
  },
  // Level card
  levelCard: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelEmoji: {
    fontSize: 40,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.text,
  },
  levelSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
  },
  xpBadge: {
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  xpBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: KIDS_COLORS.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: KIDS_COLORS.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  // Streak card
  streakCard: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  streakTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakCount: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    color: KIDS_COLORS.primary,
  },
  streakLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
    gap: 4,
  },
  calendarDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KIDS_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDotPlayed: {
    backgroundColor: KIDS_COLORS.primary,
  },
  calendarDotToday: {
    borderWidth: 2,
    borderColor: KIDS_COLORS.primary,
  },
  calendarDotCheck: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Nunito_700Bold',
  },
  calendarDayLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: KIDS_COLORS.textTertiary,
  },
  calendarDayLabelToday: {
    color: KIDS_COLORS.primary,
    fontFamily: 'Nunito_700Bold',
  },
  // Sections
  section: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.text,
  },
  badgeCount: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
  },
  // Badges
  badgesScroll: {
    marginHorizontal: -4,
  },
  badgesContent: {
    gap: 10,
    paddingHorizontal: 4,
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
    gap: 4,
    backgroundColor: KIDS_COLORS.background,
    borderRadius: 16,
    padding: 10,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeEmojiLocked: {
    opacity: 0.6,
  },
  badgeName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: KIDS_COLORS.textTertiary,
  },
  // Subject rows
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIcon: {
    fontSize: 22,
  },
  subjectInfo: {
    flex: 1,
    gap: 6,
  },
  subjectLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  subjectStars: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
  },
  // Game rows
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: KIDS_COLORS.divider,
  },
  gameRowName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: KIDS_COLORS.text,
    flex: 1,
  },
  gameRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gamePlayCount: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textTertiary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
  starEmpty: {
    opacity: 0.3,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
});
