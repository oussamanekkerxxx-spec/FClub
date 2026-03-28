import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoardNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
}

interface BoardState {
  notes: BoardNote[];
  addNote: (note: Omit<BoardNote, 'id' | 'createdAt'>) => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (note) => set((state) => ({
        notes: [
          ...state.notes,
          {
            ...note,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          }
        ]
      })),
      clearBoard: () => set({ notes: [] }),
    }),
    {
      name: 'fightclub-board-storage',
    }
  )
);
