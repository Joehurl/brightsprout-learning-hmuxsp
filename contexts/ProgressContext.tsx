import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppProgress, defaultProgress, loadProgress, recordGameComplete } from '@/utils/progress';

interface ProgressContextType {
  progress: AppProgress;
  refreshProgress: () => Promise<void>;
  completeGame: (gameId: string, stars: number) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType>({
  progress: defaultProgress,
  refreshProgress: async () => {},
  completeGame: async () => {},
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<AppProgress>(defaultProgress);

  const refreshProgress = useCallback(async () => {
    console.log('[ProgressContext] refreshProgress called');
    const p = await loadProgress();
    setProgress(p);
  }, []);

  const completeGame = useCallback(async (gameId: string, stars: number) => {
    console.log('[ProgressContext] completeGame called', { gameId, stars });
    const updated = await recordGameComplete(gameId, stars);
    setProgress(updated);
  }, []);

  useEffect(() => { refreshProgress(); }, []);

  return (
    <ProgressContext.Provider value={{ progress, refreshProgress, completeGame }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
