import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Target,
  CheckCircle2,
  SkipForward,
  Flame,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, startOfMonth, startOfYear, eachDayOfInterval, eachMonthOfInterval, endOfYear } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { fetchAllGoals } from '@/lib/goals';
import { computeDayStats, computeStreak, computeLongestStreak } from '@/lib/stats';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { CardSkeleton } from '@/components/Skeletons';
import { EmptyState } from '@/components/EmptyState';
import { STATUS_COLORS, type Goal } from '@/types';

type Range = 'week' | 'month' | 'year';

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('week');

  const loadGoals = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await fetchAllGoals(profile.id);
      setGoals(data);
    } catch {
      // silent
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const streak = computeStreak(goals, todayISO);
  const longestStreak = computeLongestStreak(goals);
  const totalCompleted = goals.filter((g) => g.status === 'completed').length;
  const totalSkipped = goals.filter((g) => g.status === 'skipped').length;
  const avgCompletion = useMemo(() => {
    const byDate = new Map<string, Goal[]>();
    for (const g of goals) {
      const arr = byDate.get(g.goal_date) ?? [];
      arr.push(g);
      byDate.set(g.goal_date, arr);
    }
    if (byDate.size === 0) return 0;
    let sum = 0;
    byDate.forEach((dayGoals) => {
      sum += computeDayStats(dayGoals).completionRate;
    });
    return Math.round(sum / byDate.size);
  }, [goals]);

  // Range-based data
  const { chartData, heatmapData } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (range === 'week') {
      startDate = subDays(now, 6);
    } else if (range === 'month') {
      startDate = startOfMonth(now);
    } else {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const byDate = new Map<string, Goal[]>();
    for (const g of goals) {
      const arr = byDate.get(g.goal_date) ?? [];
      arr.push(g);
      byDate.set(g.goal_date, arr);
    }

    // Chart data
    let data: { label: string; completion: number; completed: number; total: number }[];
    if (range === 'year') {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      data = months.map((m) => {
        const monthGoals = goals.filter((g) => g.goal_date.startsWith(format(m, 'yyyy-MM')));
        const s = computeDayStats(monthGoals);
        return {
          label: format(m, 'MMM'),
          completion: s.completionRate,
          completed: s.completed,
          total: s.total,
        };
      });
    } else {
      data = days.map((d) => {
        const iso = format(d, 'yyyy-MM-dd');
        const s = computeDayStats(byDate.get(iso) ?? []);
        return {
          label: format(d, range === 'week' ? 'EEE' : 'd'),
          completion: s.completionRate,
          completed: s.completed,
          total: s.total,
        };
      });
    }

    // Heatmap data (last 365 days)
    const heatStart = subDays(now, 364);
    const heatDays = eachDayOfInterval({ start: heatStart, end: now });
    const heat = heatDays.map((d) => {
      const iso = format(d, 'yyyy-MM-dd');
      const s = computeDayStats(byDate.get(iso) ?? []);
      return { date: iso, rate: s.completionRate, total: s.total };
    });

    return { chartData: data, heatmapData: heat };
  }, [goals, range]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of goals) {
      counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
    }
    const colors = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#84cc16', '#eab308'];
    return Array.from(counts.entries()).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [goals]);

  // Status distribution
  const statusData = [
    { name: 'Completed', value: totalCompleted, color: STATUS_COLORS.completed },
    { name: 'Pending', value: goals.filter((g) => g.status === 'pending').length, color: STATUS_COLORS.pending },
    { name: 'Skipped', value: totalSkipped, color: STATUS_COLORS.skipped },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Deep dive into your productivity" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Deep dive into your productivity" />
        <EmptyState
          icon={<BarChart3 className="size-8 text-muted-foreground" />}
          title="No data yet"
          description="Create some goals to see your analytics come to life!"
        />
      </div>
    );
  }

  // Heatmap rendering
  const heatColor = (rate: number) => {
    if (rate === 0) return 'hsl(var(--muted) / 0.3)';
    if (rate >= 80) return '#22c55e';
    if (rate >= 60) return '#84cc16';
    if (rate >= 40) return '#f59e0b';
    if (rate >= 20) return '#f97316';
    return '#ef4444';
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your productivity"
        actions={
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {(['week', 'month', 'year'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  range === r ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Goals" value={goals.length} icon={<Target className="size-5" />} gradient="bg-gradient-to-br from-primary to-accent" />
        <StatCard title="Completed" value={totalCompleted} icon={<CheckCircle2 className="size-5" />} gradient="bg-gradient-to-br from-success to-emerald-600" />
        <StatCard title="Skipped" value={totalSkipped} icon={<SkipForward className="size-5" />} gradient="bg-gradient-to-br from-muted-foreground to-gray-600" />
        <StatCard title="Avg Completion" value={`${avgCompletion}%`} icon={<TrendingUp className="size-5" />} gradient="bg-gradient-to-br from-accent to-cyan-500" />
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard title="Current Streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} icon={<Flame className="size-5" />} gradient="bg-gradient-to-br from-orange-500 to-red-500" />
        <StatCard title="Longest Streak" value={`${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`} icon={<Award className="size-5" />} gradient="bg-gradient-to-br from-warning to-amber-600" />
      </div>

      {/* Bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 mb-6"
      >
        <h3 className="font-semibold font-display mb-4 capitalize">{range}ly Progress</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            />
            <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Completion %" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Line chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-semibold font-display mb-4">Completed Goals Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="completed" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-semibold font-display mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category pie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 mb-6"
      >
        <h3 className="font-semibold font-display mb-4">Goals by Category</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {categoryData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="font-semibold font-display mb-1">Activity Heatmap</h3>
        <p className="text-sm text-muted-foreground mb-4">Last 365 days of goal completion</p>
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div className="inline-flex flex-col gap-1 min-w-max">
            {Array.from({ length: Math.ceil(heatmapData.length / 7) }, (_, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const idx = weekIdx * 7 + dayIdx;
                  if (idx >= heatmapData.length) return <div key={dayIdx} className="size-3" />;
                  const entry = heatmapData[idx];
                  return (
                    <div
                      key={dayIdx}
                      className="size-3 rounded-sm transition-all hover:scale-125 cursor-default"
                      style={{ backgroundColor: heatColor(entry.rate) }}
                      title={`${entry.date}: ${entry.rate}% (${entry.total} goals)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          {['hsl(var(--muted) / 0.3)', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'].map((c, i) => (
            <div key={i} className="size-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </motion.div>
    </div>
  );
}
