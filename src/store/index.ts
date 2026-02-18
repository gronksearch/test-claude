import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { TeamMember, Chore, CompletionRecord } from '../types';

interface AppState {
  members: TeamMember[];
  chores: Chore[];
  completions: CompletionRecord[];

  // Members
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  removeMember: (id: string) => void;

  // Chores
  addChore: (chore: Omit<Chore, 'id'>) => void;
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id'>>) => void;
  removeChore: (id: string) => void;

  // Completions
  recordCompletion: (completion: Omit<CompletionRecord, 'id'>) => void;
  removeCompletion: (choreId: string, occurrenceDate: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      members: [],
      chores: [],
      completions: [],

      addMember: (member) =>
        set((s) => ({ members: [...s.members, { ...member, id: uuidv4() }] })),

      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          // Unassign chores that belonged to this member
          chores: s.chores.map((c) =>
            c.assigneeId === id ? { ...c, assigneeId: null } : c,
          ),
        })),

      addChore: (chore) =>
        set((s) => ({ chores: [...s.chores, { ...chore, id: uuidv4() }] })),

      updateChore: (id, updates) =>
        set((s) => ({
          chores: s.chores.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      removeChore: (id) =>
        set((s) => ({
          chores: s.chores.filter((c) => c.id !== id),
          completions: s.completions.filter((c) => c.choreId !== id),
        })),

      recordCompletion: (completion) =>
        set((s) => {
          // Prevent duplicate completions for same chore+date
          const exists = s.completions.some(
            (c) =>
              c.choreId === completion.choreId &&
              c.occurrenceDate === completion.occurrenceDate,
          );
          if (exists) return s;
          return {
            completions: [...s.completions, { ...completion, id: uuidv4() }],
          };
        }),

      removeCompletion: (choreId, occurrenceDate) =>
        set((s) => ({
          completions: s.completions.filter(
            (c) => !(c.choreId === choreId && c.occurrenceDate === occurrenceDate),
          ),
        })),
    }),
    { name: 'office-chores' },
  ),
);
