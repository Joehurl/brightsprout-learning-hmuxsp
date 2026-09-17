import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppProgress, defaultProgress, loadProgress, recordGameComplete } from '@/utils/progress';

interface ProgressContextType {
  progress: AppProgress;
  refreshProgress: () => Promise<void>;
  completeGame: (gameId: string, stars: number) => Promise<{ newBadges: string[] }>;
}

const ProgressContext = createContext<ProgressContextType>({
  progress: defaultProgress,
  refreshProgress: async () => {},
  completeGame: async () => ({ newBadges: [] }),
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<AppProgress>(defaultProgress);

  const refreshProgress = useCallback(async () => {
    console.log('[ProgressContext] refreshProgress called');
    const p = await loadProgress();
    setProgress(p);
  }, []);

  const completeGame = useCallback(async (gameId: string, stars: number): Promise<{ newBadges: string[] }> => {
    console.log('[ProgressContext] completeGame called', { gameId, stars });
    const { progress: updated, newBadges } = await recordGameComplete(gameId, stars);
    setProgress(updated);
    if (newBadges.length > 0) {
      console.log('[ProgressContext] New badges earned:', newBadges);
    }
    return { newBadges };
  }, []);

  useEffect(() => { refreshProgress(); }, [refreshProgress]);

  return (
    <ProgressContext.Provider value={{ progress, refreshProgress, completeGame }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
