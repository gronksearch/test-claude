import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as api from '../lib/supabaseApi';
import type { TeamMember, Chore, CompletionRecord } from '../types';

interface AppState {
  members: TeamMember[];
  chores: Chore[];
  completions: CompletionRecord[];
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;

  // Members
  addMember: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;

  // Chores
  addChore: (chore: Omit<Chore, 'id'>) => Promise<void>;
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id'>>) => Promise<void>;
  removeChore: (id: string) => Promise<void>;

  // Completions
  recordCompletion: (completion: Omit<CompletionRecord, 'id'>) => Promise<void>;
  removeCompletion: (choreId: string, occurrenceDate: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  members: [],
  chores: [],
  completions: [],
  isLoading: true,
  error: null,

  // -------------------------------------------------------------------------
  // Initialization: fetch all data then start realtime subscriptions
  // -------------------------------------------------------------------------
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const [members, chores, completions] = await Promise.all([
        api.fetchMembers(),
        api.fetchChores(),
        api.fetchCompletions(),
      ]);
      set({ members, chores, completions, isLoading: false });
      setupRealtimeSubscriptions(set);
    } catch {
      set({ isLoading: false, error: 'Failed to load data. Check your connection.' });
    }
  },

  // -------------------------------------------------------------------------
  // Members
  // -------------------------------------------------------------------------
  addMember: async (member) => {
    const tempId = crypto.randomUUID();
    set((s) => ({ members: [...s.members, { ...member, id: tempId }] }));
    try {
      const saved = await api.insertMember(member);
      set((s) => ({ members: s.members.map((m) => (m.id === tempId ? saved : m)) }));
    } catch {
      set((s) => ({
        members: s.members.filter((m) => m.id !== tempId),
        error: 'Failed to add member.',
      }));
    }
  },

  removeMember: async (id) => {
    const prevMembers = get().members;
    set((s) => ({
      members: s.members.filter((m) => m.id !== id),
      chores: s.chores.map((c) => (c.assigneeId === id ? { ...c, assigneeId: null } : c)),
    }));
    try {
      await api.deleteMember(id);
    } catch {
      set({ members: prevMembers, error: 'Failed to remove member.' });
    }
  },

  // -------------------------------------------------------------------------
  // Chores
  // -------------------------------------------------------------------------
  addChore: async (chore) => {
    const tempId = crypto.randomUUID();
    set((s) => ({ chores: [...s.chores, { ...chore, id: tempId }] }));
    try {
      const saved = await api.insertChore(chore);
      set((s) => ({ chores: s.chores.map((c) => (c.id === tempId ? saved : c)) }));
    } catch {
      set((s) => ({
        chores: s.chores.filter((c) => c.id !== tempId),
        error: 'Failed to add chore.',
      }));
    }
  },

  updateChore: async (id, updates) => {
    const prevChores = get().chores;
    set((s) => ({
      chores: s.chores.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    try {
      const saved = await api.updateChore(id, updates);
      set((s) => ({ chores: s.chores.map((c) => (c.id === id ? saved : c)) }));
    } catch {
      set({ chores: prevChores, error: 'Failed to update chore.' });
    }
  },

  removeChore: async (id) => {
    const prevChores = get().chores;
    const prevCompletions = get().completions;
    set((s) => ({
      chores: s.chores.filter((c) => c.id !== id),
      completions: s.completions.filter((c) => c.choreId !== id),
    }));
    try {
      await api.deleteChore(id);
    } catch {
      set({ chores: prevChores, completions: prevCompletions, error: 'Failed to remove chore.' });
    }
  },

  // -------------------------------------------------------------------------
  // Completions
  // -------------------------------------------------------------------------
  recordCompletion: async (completion) => {
    const alreadyExists = get().completions.some(
      (c) => c.choreId === completion.choreId && c.occurrenceDate === completion.occurrenceDate,
    );
    if (alreadyExists) return;

    const tempId = crypto.randomUUID();
    set((s) => ({ completions: [...s.completions, { ...completion, id: tempId }] }));
    try {
      const saved = await api.insertCompletion(completion);
      set((s) => ({
        completions: s.completions.map((c) => (c.id === tempId ? saved : c)),
      }));
    } catch {
      set((s) => ({
        completions: s.completions.filter((c) => c.id !== tempId),
        error: 'Failed to record completion.',
      }));
    }
  },

  removeCompletion: async (choreId, occurrenceDate) => {
    const prevCompletions = get().completions;
    set((s) => ({
      completions: s.completions.filter(
        (c) => !(c.choreId === choreId && c.occurrenceDate === occurrenceDate),
      ),
    }));
    try {
      await api.deleteCompletion(choreId, occurrenceDate);
    } catch {
      set({ completions: prevCompletions, error: 'Failed to remove completion.' });
    }
  },
}));

// ---------------------------------------------------------------------------
// Realtime subscriptions (called once after initialize())
// ---------------------------------------------------------------------------

function setupRealtimeSubscriptions(
  set: (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void,
) {
  // members and chores: re-fetch full table on any change
  supabase
    .channel('members-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
      api.fetchMembers().then((members) => set({ members }));
    })
    .subscribe();

  supabase
    .channel('chores-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' }, () => {
      api.fetchChores().then((chores) => set({ chores }));
    })
    .subscribe();

  // completions: apply delta from payload directly
  supabase
    .channel('completions-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'completions' },
      (payload) => {
        const newRecord = api.mapCompletion(payload.new as Parameters<typeof api.mapCompletion>[0]);
        set((s) => {
          if (s.completions.some((c) => c.id === newRecord.id)) return {};
          return { completions: [...s.completions, newRecord] };
        });
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'completions' },
      (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        set((s) => ({
          completions: s.completions.filter((c) => c.id !== deletedId),
        }));
      },
    )
    .subscribe();
}
