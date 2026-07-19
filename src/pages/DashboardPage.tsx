import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Calendar as CalendarIcon,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { fetchGoals, fetchGoalsByDateRange, fetchAllGoals } from '@/lib/goals';
import { computeDayStats, computeStreak } from '@/lib/stats';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { PageHeader } from '@/components/PageHeader';
import { CardSkeleton, GoalListSkeleton } from '@/components/Skeletons';
import { STATUS_COLORS } from '@/types';
import type { Goal } from '@/types';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [todayGoals, setTodayGoals] = useState<Goal[]>([]);
  const [weekGoals, setWeekGoals] = useState<Goal[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const todayISO = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const [today, week, all] = await Promise.all([
        fetchGoals(profile.id, todayISO),
        fetchGoalsByDateRange(profile.id, format(subDays(new Date(), 6), 'yyyy-MM-dd'), todayISO),
        fetchAllGoals(profile.id),
      ]);
      setTodayGoals(today);
      setWeekGoals(week);
      setAllGoals(all);
      setLoading(false);
    })();
  }, [profile, todayISO]);

  const stats = computeDayStats(todayGoals);
  const streak = computeStreak(allGoals, todayISO);

  // Weekly chart data
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const iso = format(d, 'yyyy-MM-dd');
    const dayGoals = weekGoals.filter((g) => g.goal_date === iso);
    const s = computeDayStats(dayGoals);
    return { day: format(d, 'EEE'), completion: s.completionRate, total: s.total };
  });

  // Status pie data
  const pieData = [
    { name: 'Completed', value: stats.completed, color: STATUS_COLORS.completed },
    { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
    { name: 'Skipped', value: stats.skipped, color: STATUS_COLORS.skipped },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Your productivity at a glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <GoalListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.name?.split(' ')[0] || 'there'}!`}
        subtitle={format(new Date(), 'EEEE, d MMMM yyyy')}
        actions={
          <Link to="/app/today">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/30"
            >
              <Target className="size-4" /> Add Goal
            </motion.button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Progress"
          value={`${stats.completionRate}%`}
          icon={<TrendingUp className="size-5" />}
          gradient="bg-gradient-to-br from-primary to-accent"
          delay={0}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle={`of ${stats.total} goals`}
          icon={<CheckCircle2 className="size-5" />}
          gradient="bg-gradient-to-br from-success to-emerald-600"
          delay={0.1}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          subtitle="Keep going!"
          icon={<Clock className="size-5" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          delay={0.2}
        />
        <StatCard
          title="Current Streak"
          value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
          icon={<Flame className="size-5" />}
          gradient="bg-gradient-to-br from-orange-500 to-red-500"
          delay={0.3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Weekly progress chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold font-display">Weekly Progress</h3>
              <p className="text-sm text-muted-foreground">Last 7 days completion rate</p>
            </div>
            <TrendingUp className="size-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="completion"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCompletion)"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold">Streak</p>
                <p className="text-xs text-muted-foreground">Keep your daily goal momentum going</p>
              </div>
              <div className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold">
                {streak} {streak === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekData.map((day) => (
                <div
                  key={day.day}
                  className={`rounded-2xl border p-2 text-center text-[10px] font-semibold ${day.total > 0 ? 'bg-success text-success-foreground border-success/30' : 'bg-muted/10 text-muted-foreground border-muted/30'}`}
                >
                  <div>{day.day}</div>
                  <div className="mt-1 text-xs">{day.total > 0 ? '✓' : '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Today's progress ring + pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 flex flex-col items-center"
        >
          <h3 className="font-semibold font-display self-start mb-2">Today's Breakdown</h3>
          {stats.total === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <CalendarIcon className="size-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No goals yet for today</p>
              <Link to="/app/today" className="text-sm text-primary hover:underline mt-2">
                Add your first goal
              </Link>
            </div>
          ) : (
            <>
              <ProgressRing progress={stats.completionRate} size={140} label="completed" />
              <div className="w-full mt-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Today's goals preview + achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display">Today's Goals</h3>
            <Link to="/app/today" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {todayGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No goals created for today yet.</p>
          ) : (
            <div className="space-y-2">
              {todayGoals.slice(0, 5).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[goal.status] }}
                  />
                  <span className="flex-1 text-sm font-medium truncate">{goal.title}</span>
                  {goal.start_time && (
                    <span className="text-xs text-muted-foreground">{goal.start_time}</span>
                  )}
                  {goal.status === 'completed' && <CheckCircle2 className="size-4 text-success" />}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="size-5 text-warning" />
            <h3 className="font-semibold font-display">Achievements</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'First Goal', desc: 'Created your first goal', unlocked: allGoals.length > 0 },
              { label: 'Streak Starter', desc: '3-day streak', unlocked: streak >= 3 },
              { label: 'Goal Getter', desc: '10 goals completed', unlocked: allGoals.filter((g) => g.status === 'completed').length >= 10 },
              { label: 'Consistent', desc: '7-day streak', unlocked: streak >= 7 },
            ].map((badge) => (
              <div
                key={badge.label}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${badge.unlocked ? 'bg-warning/10' : 'bg-muted/30 opacity-50'}`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center ${badge.unlocked ? 'bg-warning/20' : 'bg-muted'}`}>
                  <Trophy className={`size-4.5 ${badge.unlocked ? 'text-warning' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
