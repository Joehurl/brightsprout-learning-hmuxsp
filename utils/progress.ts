import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameProgress {
  gameId: string;
  starsEarned: number;   // 0-3
  completed: boolean;
  playCount: number;
  lastPlayed: string;    // ISO date
}

export interface AppProgress {
  games: Record<string, GameProgress>;
  totalStars: number;
  streak: number;
  lastPlayDate: string;
  ageGroup: '2-4' | '5-6' | '7-8';
  parentPin: string;     // 4-digit PIN, default '1234'
  totalMinutesPlayed: number;
  badges: string[];
  level: number;
  xp: number;
}

const STORAGE_KEY = 'brightsprout_progress';

export const defaultProgress: AppProgress = {
  games: {},
  totalStars: 0,
  streak: 0,
  lastPlayDate: '',
  ageGroup: '5-6',
  parentPin: '1234',
  totalMinutesPlayed: 0,
  badges: [],
  level: 1,
  xp: 0,
};

export const BADGES = [
  { id: 'first_star', name: 'First Star!', emoji: '⭐', description: 'Earn your first star', condition: (p: AppProgress) => p.totalStars >= 1 },
  { id: 'star_collector', name: 'Star Collector', emoji: '🌟', description: 'Earn 10 stars', condition: (p: AppProgress) => p.totalStars >= 10 },
  { id: 'star_master', name: 'Star Master', emoji: '💫', description: 'Earn 50 stars', condition: (p: AppProgress) => p.totalStars >= 50 },
  { id: 'streak_3', name: '3-Day Streak!', emoji: '🔥', description: 'Play 3 days in a row', condition: (p: AppProgress) => p.streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', emoji: '🏆', description: 'Play 7 days in a row', condition: (p: AppProgress) => p.streak >= 7 },
  { id: 'alphabet_hero', name: 'Alphabet Hero', emoji: '🔤', description: 'Complete Alphabet Adventure', condition: (p: AppProgress) => !!p.games['alphabet-adventure']?.completed },
  { id: 'number_wizard', name: 'Number Wizard', emoji: '🔢', description: 'Complete Number Quiz', condition: (p: AppProgress) => !!p.games['number-quiz']?.completed },
  { id: 'spelling_bee', name: 'Spelling Bee', emoji: '🐝', description: 'Complete Spelling Bee', condition: (p: AppProgress) => !!p.games['spelling-bee']?.completed },
  { id: 'memory_master', name: 'Memory Master', emoji: '🧠', description: 'Complete Memory Match', condition: (p: AppProgress) => !!p.games['memory-match']?.completed },
  { id: 'artist', name: 'Little Artist', emoji: '🎨', description: 'Complete Drawing Canvas', condition: (p: AppProgress) => !!p.games['drawing-canvas']?.completed },
  { id: 'game_explorer', name: 'Game Explorer', emoji: '🗺️', description: 'Play 5 different games', condition: (p: AppProgress) => Object.keys(p.games).length >= 5 },
  { id: 'champion', name: 'Champion', emoji: '👑', description: 'Reach Level 5', condition: (p: AppProgress) => p.level >= 5 },
];

export async function loadProgress(): Promise<AppProgress> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) return { ...defaultProgress, ...JSON.parse(data) };
  } catch {}
  return defaultProgress;
}

export async function saveProgress(progress: AppProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

export async function recordGameComplete(
  gameId: string,
  stars: number
): Promise<{ progress: AppProgress; newBadges: string[] }> {
  const progress = await loadProgress();
  const existing = progress.games[gameId] || { gameId, starsEarned: 0, completed: false, playCount: 0, lastPlayed: '' };
  const newStars = Math.max(existing.starsEarned, stars);
  const starDiff = newStars - existing.starsEarned;
  progress.games[gameId] = {
    gameId,
    starsEarned: newStars,
    completed: true,
    playCount: existing.playCount + 1,
    lastPlayed: new Date().toISOString(),
  };
  progress.totalStars += starDiff;

  // XP and level
  progress.xp = (progress.xp || 0) + stars * 10;
  progress.level = Math.floor(progress.xp / 100) + 1;

  // Update streak
  const today = new Date().toDateString();
  if (progress.lastPlayDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    progress.streak = progress.lastPlayDate === yesterday ? progress.streak + 1 : 1;
    progress.lastPlayDate = today;
  }

  // Check badges
  const existingBadges = new Set(progress.badges || []);
  const newBadges: string[] = [];
  for (const badge of BADGES) {
    if (!existingBadges.has(badge.id) && badge.condition(progress)) {
      existingBadges.add(badge.id);
      newBadges.push(badge.id);
    }
  }
  progress.badges = Array.from(existingBadges);

  await saveProgress(progress);
  return { progress, newBadges };
}
