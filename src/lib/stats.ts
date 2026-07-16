import type { Goal, GoalStatus } from '@/types';

export interface DayStats {
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  completionRate: number;
  score: number;
  timeSpent: number;
}

export function computeDayStats(goals: Goal[]): DayStats {
  const total = goals.length;
  const completed = goals.filter((g) => g.status === 'completed').length;
  const skipped = goals.filter((g) => g.status === 'skipped').length;
  const pending = goals.filter((g) => g.status === 'pending').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const score = completed * 10 - skipped * 3;
  const timeSpent = goals
    .filter((g) => g.status === 'completed' && g.start_time && g.end_time)
    .reduce((acc, g) => {
      const [sh, sm] = g.start_time!.split(':').map(Number);
      const [eh, em] = g.end_time!.split(':').map(Number);
      return acc + (eh * 60 + em - (sh * 60 + sm));
    }, 0);
  return { total, completed, pending, skipped, completionRate, score, timeSpent };
}

export function computeStreak(allGoals: Goal[], todayISO: string): number {
  const byDate = new Map<string, Goal[]>();
  for (const g of allGoals) {
    const arr = byDate.get(g.goal_date) ?? [];
    arr.push(g);
    byDate.set(g.goal_date, arr);
  }

  let streak = 0;
  const d = new Date(todayISO + 'T00:00:00');
  // If today has no goals yet, start from yesterday
  const todayGoals = byDate.get(todayISO);
  if (!todayGoals || todayGoals.length === 0) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const iso = d.toISOString().slice(0, 10);
    const goals = byDate.get(iso);
    if (!goals || goals.length === 0) break;
    const stats = computeDayStats(goals);
    if (stats.completionRate >= 50) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function computeLongestStreak(allGoals: Goal[]): number {
  const byDate = new Map<string, Goal[]>();
  for (const g of allGoals) {
    const arr = byDate.get(g.goal_date) ?? [];
    arr.push(g);
    byDate.set(g.goal_date, arr);
  }

  const dates = Array.from(byDate.keys()).sort();
  let longest = 0;
  let current = 0;
  let prev: string | null = null;

  for (const date of dates) {
    const stats = computeDayStats(byDate.get(date)!);
    if (stats.completionRate >= 50) {
      if (prev) {
        const prevDate = new Date(prev + 'T00:00:00');
        const currDate = new Date(date + 'T00:00:00');
        const diff = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);
        if (diff === 1) {
          current++;
        } else {
          current = 1;
        }
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
      prev = date;
    } else {
      current = 0;
      prev = null;
    }
  }
  return longest;
}

export function statusCounts(goals: Goal[]): Record<GoalStatus, number> {
  return {
    pending: goals.filter((g) => g.status === 'pending').length,
    completed: goals.filter((g) => g.status === 'completed').length,
    skipped: goals.filter((g) => g.status === 'skipped').length,
  };
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
