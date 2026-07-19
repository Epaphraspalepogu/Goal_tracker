export type GoalStatus = 'pending' | 'completed' | 'skipped';
export type Priority = 'low' | 'medium' | 'high';

export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  photo: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_date: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  category: string;
  priority: Priority;
  color: string;
  status: GoalStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GoalInput {
  title: string;
  description?: string;
  start_time?: string | null;
  end_time?: string | null;
  category?: string;
  priority?: Priority;
  color?: string;
  status?: GoalStatus;
  repeat_days?: number;
}

export const CATEGORIES = [
  'Health',
  'Work',
  'Study',
  'Personal',
  'Fitness',
  'Reading',
  'Coding',
  'Social',
  'Finance',
  'General',
] as const;

export const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const STATUS_COLORS: Record<GoalStatus, string> = {
  pending: '#6366f1',
  completed: '#22c55e',
  skipped: '#94a3b8',
};

export const GOAL_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
];
