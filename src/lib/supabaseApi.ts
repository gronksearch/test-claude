import { supabase } from './supabase';
import type { TeamMember, Chore, CompletionRecord, RecurrenceRule } from '../types';

// ---------------------------------------------------------------------------
// DB row types (snake_case from Postgres)
// ---------------------------------------------------------------------------

interface MemberRow {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface ChoreRow {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  start_date: string;
  recurrence: RecurrenceRule | null;
  created_at: string;
}

interface CompletionRow {
  id: string;
  chore_id: string;
  occurrence_date: string;
  completed_at: string;
  completed_by_id: string;
}

// ---------------------------------------------------------------------------
// Mapping functions (DB row → TypeScript model)
// ---------------------------------------------------------------------------

function mapMember(row: MemberRow): TeamMember {
  return { id: row.id, name: row.name, color: row.color };
}

function mapChore(row: ChoreRow): Chore {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    assigneeId: row.assignee_id,
    startDate: row.start_date,
    recurrence: row.recurrence,
  };
}

export function mapCompletion(row: CompletionRow): CompletionRecord {
  return {
    id: row.id,
    choreId: row.chore_id,
    occurrenceDate: row.occurrence_date,
    completedAt: row.completed_at,
    completedById: row.completed_by_id,
  };
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function fetchMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return (data as MemberRow[]).map(mapMember);
}

export async function insertMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({ name: member.name, color: member.color })
    .select()
    .single();
  if (error) throw error;
  return mapMember(data as MemberRow);
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Chores
// ---------------------------------------------------------------------------

export async function fetchChores(): Promise<Chore[]> {
  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return (data as ChoreRow[]).map(mapChore);
}

export async function insertChore(chore: Omit<Chore, 'id'>): Promise<Chore> {
  const { data, error } = await supabase
    .from('chores')
    .insert({
      title: chore.title,
      description: chore.description ?? null,
      assignee_id: chore.assigneeId,
      start_date: chore.startDate,
      recurrence: chore.recurrence,
    })
    .select()
    .single();
  if (error) throw error;
  return mapChore(data as ChoreRow);
}

export async function updateChore(
  id: string,
  updates: Partial<Omit<Chore, 'id'>>,
): Promise<Chore> {
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description ?? null;
  if ('assigneeId' in updates) patch.assignee_id = updates.assigneeId;
  if (updates.startDate !== undefined) patch.start_date = updates.startDate;
  if ('recurrence' in updates) patch.recurrence = updates.recurrence;

  const { data, error } = await supabase
    .from('chores')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapChore(data as ChoreRow);
}

export async function deleteChore(id: string): Promise<void> {
  const { error } = await supabase.from('chores').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export async function fetchCompletions(): Promise<CompletionRecord[]> {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return (data as CompletionRow[]).map(mapCompletion);
}

export async function insertCompletion(
  completion: Omit<CompletionRecord, 'id'>,
): Promise<CompletionRecord> {
  const { data, error } = await supabase
    .from('completions')
    .insert({
      chore_id: completion.choreId,
      occurrence_date: completion.occurrenceDate,
      completed_at: completion.completedAt,
      completed_by_id: completion.completedById,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCompletion(data as CompletionRow);
}

export async function deleteCompletion(
  choreId: string,
  occurrenceDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('completions')
    .delete()
    .eq('chore_id', choreId)
    .eq('occurrence_date', occurrenceDate);
  if (error) throw error;
}
