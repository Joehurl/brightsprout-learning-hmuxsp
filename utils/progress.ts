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
};

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

export async function recordGameComplete(gameId: string, stars: number): Promise<AppProgress> {
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
  // Update streak
  const today = new Date().toDateString();
  if (progress.lastPlayDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    progress.streak = progress.lastPlayDate === yesterday ? progress.streak + 1 : 1;
    progress.lastPlayDate = today;
  }
  await saveProgress(progress);
  return progress;
}
