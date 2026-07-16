import { supabase } from '@/lib/supabase';
import type { Goal, GoalInput, GoalStatus } from '@/types';

export async function fetchGoals(userId: string, date: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_date', date)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function fetchGoalsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .gte('goal_date', startDate)
    .lte('goal_date', endDate)
    .order('goal_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function fetchAllGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('goal_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function fetchUserGoals(userId: string, date: string): Promise<Goal[]> {
  return fetchGoals(userId, date);
}

export async function createGoal(userId: string, date: string, input: GoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      goal_date: date,
      title: input.title,
      description: input.description ?? '',
      start_time: input.start_time ?? null,
      end_time: input.end_time ?? null,
      category: input.category ?? 'General',
      priority: input.priority ?? 'medium',
      color: input.color ?? '#6366f1',
      status: input.status ?? 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(id: string, updates: Partial<GoalInput>): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const { error } = await supabase.from('goals').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateGoal(goal: Goal): Promise<Goal> {
  const { id, created_at, updated_at, ...rest } = goal;
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...rest, sort_order: rest.sort_order + 1 })
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function reorderGoals(goals: Goal[]): Promise<void> {
  const updates = goals.map((g, i) => supabase.from('goals').update({ sort_order: i }).eq('id', g.id));
  await Promise.all(updates);
}
