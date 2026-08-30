import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface GameDef {
  name: string;
  desc: string;
  emoji: string;
  minAge: number;
}

const GAMES: Record<string, GameDef> = {
  'alphabet-adventure': { name: 'Alphabet Adventure', desc: 'Sing & learn the ABCs!', emoji: '🎵', minAge: 2 },
  'letter-trace': { name: 'Letter Tracing', desc: 'Trace letters with your finger', emoji: '✏️', minAge: 3 },
  'letter-match': { name: 'Letter Match', desc: 'Match uppercase to lowercase', emoji: '🔤', minAge: 4 },
  'phonics': { name: 'Phonics Fun', desc: 'Tap the letter that makes the sound', emoji: '🔊', minAge: 4 },
  'spelling-bee': { name: 'Spelling Bee', desc: 'Spell words by tapping letters', emoji: '🐝', minAge: 5 },
  'counting': { name: 'Counting Stars', desc: 'Count the objects on screen', emoji: '⭐', minAge: 2 },
  'number-quiz': { name: 'Number Quiz', desc: 'Pick the right number', emoji: '🔢', minAge: 3 },
  'addition': { name: 'Adding Up', desc: 'Add colorful objects together', emoji: '➕', minAge: 6 },
  'shape-sorter': { name: 'Shape Sorter', desc: 'Drop shapes into the right holes', emoji: '🔷', minAge: 2 },
  'memory-match': { name: 'Memory Match', desc: 'Find matching pairs of cards', emoji: '🧠', minAge: 3 },
  'jigsaw-puzzle': { name: 'Jigsaw Puzzle', desc: 'Drag pieces to complete the puzzle', emoji: '🧩', minAge: 2 },
  'color-paint': { name: 'Color Mixing', desc: 'Mix colors to paint a scene', emoji: '🎨', minAge: 2 },
  'drawing-canvas': { name: 'Drawing Canvas', desc: 'Draw anything you imagine!', emoji: '✏️', minAge: 2 },
  'animal-sounds': { name: 'Animal Sounds', desc: 'Guess the animal by its sound', emoji: '🦁', minAge: 2 },
};

interface Category {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  games: string[];
}

const CATEGORIES: Record<string, Category> = {
  letters: { label: 'Letters', emoji: '🔤', color: KIDS_COLORS.letters, bg: KIDS_COLORS.lettersMuted, games: ['alphabet-adventure', 'letter-trace', 'letter-match', 'phonics', 'spelling-bee'] },
  numbers: { label: 'Numbers', emoji: '🔢', color: KIDS_COLORS.numbers, bg: KIDS_COLORS.numbersMuted, games: ['counting', 'number-quiz', 'addition'] },
  shapes: { label: 'Shapes', emoji: '🔷', color: KIDS_COLORS.shapes, bg: KIDS_COLORS.shapesMuted, games: ['shape-sorter', 'memory-match', 'jigsaw-puzzle'] },
  colors: { label: 'Colors', emoji: '🎨', color: KIDS_COLORS.colors, bg: KIDS_COLORS.colorsMuted, games: ['color-paint', 'drawing-canvas'] },
  animals: { label: 'Animals', emoji: '🦁', color: KIDS_COLORS.animals, bg: KIDS_COLORS.animalsMuted, games: ['animal-sounds'] },
  music: { label: 'Music', emoji: '🎵', color: KIDS_COLORS.music, bg: KIDS_COLORS.musicMuted, games: ['alphabet-adventure'] },
};

const AGE_MAP: Record<string, number> = { '2-4': 2, '5-6': 5, '7-8': 7 };

// Free games — playable without purchase (5 free preview games)
const FREE_GAMES = new Set(['alphabet-adventure', 'counting', 'shape-sorter', 'color-paint', 'animal-sounds']);

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

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const { isSubscribed } = useSubscription();

  const category = CATEGORIES[id as string];
  if (!category) return null;

  const minAge = AGE_MAP[progress.ageGroup] ?? 2;

  const filteredGames = category.games.filter(gameId => {
    const game = GAMES[gameId];
    return game && game.minAge <= minAge;
  });

  const handleBack = () => {
    console.log('[CategoryScreen] Back pressed');
    router.back();
  };

  const handlePlayGame = (gameId: string, isLocked: boolean) => {
    if (isLocked) {
      console.log('[CategoryScreen] Locked game tapped — opening paywall:', gameId);
      router.push('/paywall' as any);
    } else {
      console.log('[CategoryScreen] Play game pressed:', gameId);
      router.push(`/game/${gameId}` as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: category.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={styles.backBtn} onPress={handleBack}>
          <ChevronLeft size={28} color={category.color} />
        </AnimatedPressable>
        <Text style={styles.headerEmoji}>{category.emoji}</Text>
        <Text style={[styles.headerTitle, { color: category.color }]}>{category.label}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔒</Text>
            <Text style={styles.emptyText}>These games unlock at a higher age group!</Text>
            <Text style={styles.emptySubtext}>Ask a parent to change the age setting.</Text>
          </View>
        ) : (
          filteredGames.map(gameId => {
            const game = GAMES[gameId];
            if (!game) return null;
            const gameProgress = progress.games[gameId];
            const stars = gameProgress ? gameProgress.starsEarned : 0;
            const isFree = FREE_GAMES.has(gameId);
            const isLocked = !isSubscribed && !isFree;

            return (
              <View key={gameId} style={[styles.gameCard, isLocked && styles.gameCardLocked]}>
                <View style={styles.gameCardLeft}>
                  <Text style={[styles.gameEmoji, isLocked && styles.lockedEmoji]}>
                    {isLocked ? '🔒' : game.emoji}
                  </Text>
                  <View style={styles.gameInfo}>
                    <Text style={[styles.gameName, isLocked && styles.lockedText]}>{game.name}</Text>
                    <Text style={styles.gameDesc}>{game.desc}</Text>
                    {!isLocked && <StarRating stars={stars} />}
                    {isLocked && (
                      <Text style={styles.premiumTag}>🔓 Unlock — $4.99</Text>
                    )}
                  </View>
                </View>
                <AnimatedPressable
                  style={[
                    styles.playBtn,
                    { backgroundColor: isLocked ? KIDS_COLORS.textSecondary : category.color },
                  ]}
                  onPress={() => handlePlayGame(gameId, isLocked)}
                >
                  <Text style={styles.playBtnText}>{isLocked ? 'Unlock' : 'Play'}</Text>
                </AnimatedPressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
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
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  gameCard: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameCardLocked: {
    opacity: 0.75,
  },
  gameCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  gameEmoji: {
    fontSize: 36,
  },
  lockedEmoji: {
    fontSize: 32,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.text,
    marginBottom: 2,
  },
  lockedText: {
    color: KIDS_COLORS.textSecondary,
  },
  gameDesc: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    marginBottom: 6,
  },
  premiumTag: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: KIDS_COLORS.primary,
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
  playBtn: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 12,
  },
  playBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
});
