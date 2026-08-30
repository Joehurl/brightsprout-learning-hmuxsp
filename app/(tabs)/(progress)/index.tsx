import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SubjectDef {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  games: string[];
}

const SUBJECTS: SubjectDef[] = [
  { label: 'Letters', emoji: '🔤', color: KIDS_COLORS.letters, bg: KIDS_COLORS.lettersMuted, games: ['alphabet-adventure', 'letter-trace', 'letter-match', 'phonics'] },
  { label: 'Numbers', emoji: '🔢', color: KIDS_COLORS.numbers, bg: KIDS_COLORS.numbersMuted, games: ['counting', 'number-quiz', 'addition'] },
  { label: 'Shapes', emoji: '🔷', color: KIDS_COLORS.shapes, bg: KIDS_COLORS.shapesMuted, games: ['shape-sorter'] },
  { label: 'Colors', emoji: '🎨', color: KIDS_COLORS.colors, bg: KIDS_COLORS.colorsMuted, games: ['color-paint'] },
  { label: 'Animals', emoji: '🦁', color: KIDS_COLORS.animals, bg: KIDS_COLORS.animalsMuted, games: ['animal-sounds'] },
  { label: 'Music', emoji: '🎵', color: KIDS_COLORS.music, bg: KIDS_COLORS.musicMuted, games: ['alphabet-adventure'] },
];

const GAME_NAMES: Record<string, string> = {
  'alphabet-adventure': 'Alphabet Adventure',
  'letter-trace': 'Letter Tracing',
  'letter-match': 'Letter Match',
  'phonics': 'Phonics Fun',
  'counting': 'Counting Stars',
  'number-quiz': 'Number Quiz',
  'addition': 'Adding Up',
  'shape-sorter': 'Shape Sorter',
  'color-paint': 'Color Mixing',
  'animal-sounds': 'Animal Sounds',
};

function StatCard({ emoji, value, label, bg }: { emoji: string; value: number; label: string; bg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { progress, refreshProgress } = useProgress();

  // Floating star particles
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * 300),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useFocusEffect(
    React.useCallback(() => {
      console.log('[ProgressScreen] focused, refreshing progress');
      refreshProgress();
    }, [refreshProgress])
  );

  useEffect(() => {
    if (progress.totalStars > 0) {
      particleAnims.forEach((anim, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(i * 300),
            Animated.parallel([
              Animated.timing(anim.opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
              Animated.timing(anim.y, { toValue: -60, duration: 2000, useNativeDriver: true }),
            ]),
            Animated.timing(anim.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        );
        loop.start();
      });
    }
  }, [progress.totalStars]);

  const gamesCompleted = Object.values(progress.games).filter(g => g.completed).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating particles */}
        {progress.totalStars > 0 && particleAnims.map((anim, i) => (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              left: anim.x,
              top: anim.y,
              opacity: anim.opacity,
              fontSize: 16,
              zIndex: 0,
            }}
            pointerEvents="none"
          >
            ⭐
          </Animated.Text>
        ))}

        <Text style={styles.title}>My Progress ⭐</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard emoji="⭐" value={progress.totalStars} label="Stars" bg={KIDS_COLORS.colorsMuted} />
          <StatCard emoji="🎮" value={gamesCompleted} label="Games" bg={KIDS_COLORS.secondaryMuted} />
          <StatCard emoji="🔥" value={progress.streak} label="Streak" bg={KIDS_COLORS.primaryMuted} />
        </View>

        {/* Subject Sections */}
        {SUBJECTS.map(subject => {
          const completed = subject.games.filter(g => progress.games[g]?.completed).length;
          const total = subject.games.length;
          const progressPct = total > 0 ? completed / total : 0;

          return (
            <View key={subject.label} style={styles.subjectSection}>
              <View style={[styles.subjectHeader, { backgroundColor: subject.bg }]}>
                <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                <Text style={[styles.subjectName, { color: subject.color }]}>{subject.label}</Text>
                <Text style={styles.subjectCount}>{completed}/{total}</Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct * 100}%` as any, backgroundColor: subject.color }]} />
              </View>

              {/* Game list */}
              {subject.games.map(gameId => {
                const gp = progress.games[gameId];
                const stars = gp ? gp.starsEarned : 0;
                const gameName = GAME_NAMES[gameId] || gameId;
                return (
                  <View key={gameId} style={styles.gameRow}>
                    <Text style={styles.gameRowName}>{gameName}</Text>
                    <StarRating stars={stars} />
                  </View>
                );
              })}
            </View>
          );
        })}
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
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: KIDS_COLORS.text,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: KIDS_COLORS.text,
  },
  statLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
  },
  subjectSection: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  subjectEmoji: {
    fontSize: 24,
  },
  subjectName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    flex: 1,
  },
  subjectCount: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: KIDS_COLORS.border,
    marginHorizontal: 16,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
});
