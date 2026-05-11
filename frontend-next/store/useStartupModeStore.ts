import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type StartupMode = 'BEFORE' | 'AFTER';

interface StartupModeState {
  mode: StartupMode;
  setMode: (mode: StartupMode) => void;
  toggleMode: () => void;
}

export const useStartupModeStore = create<StartupModeState>()(
  persist(
    (set) => ({
      mode: 'BEFORE', // 기본값: 창업 전
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'BEFORE' ? 'AFTER' : 'BEFORE' })),
    }),
    {
      name: 'startup-mode-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
